/**
 * Centralized API Service with interceptors, error handling, and caching
 */

const API_BASE_URL = 'https://grid.ai.juspay.net/v1';
const API_KEY = import.meta.env.VITE_API_KEY;

// Request cache to prevent duplicate calls
const requestCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Clear expired cache entries
 */
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      requestCache.delete(key);
    }
  }
};

/**
 * Generate cache key from request
 */
const getCacheKey = (endpoint, body) => {
  return `${endpoint}:${JSON.stringify(body)}`;
};

/**
 * Core API request function with retry logic
 */
const apiRequest = async (endpoint, options = {}, retryCount = 0) => {
  const maxRetries = 2;
  const retryDelay = 1000 * (retryCount + 1);

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific HTTP errors
      if (response.status === 429 && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return apiRequest(endpoint, options, retryCount + 1);
      }

      if (response.status === 401) {
        throw new ApiError('Authentication failed. Please check your API key.', response.status);
      }

      if (response.status === 503) {
        throw new ApiError('Service temporarily unavailable. Please try again later.', response.status);
      }

      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return apiRequest(endpoint, options, retryCount + 1);
      }
      throw new ApiError('Network error. Please check your internet connection.', 0);
    }

    // Timeout errors
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408);
    }

    throw new ApiError(error.message || 'An unexpected error occurred', 500);
  }
};

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Chat completion API
 */
export const chatCompletion = async (messages, options = {}) => {
  const { model = 'claude-sonnet-4-5', maxTokens = 4096, useCache = true } = options;
  
  const body = {
    model,
    max_tokens: maxTokens,
    messages
  };

  const cacheKey = getCacheKey('/chat/completions', body);
  
  if (useCache) {
    clearExpiredCache();
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  const data = await apiRequest('/chat/completions', {
    body: JSON.stringify(body)
  });

  if (useCache) {
    requestCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  return data;
};

/**
 * Product search with AI
 */
export const searchProductsWithAI = async (query, productCatalog) => {
  const searchPrompt = `You are a product search assistant. I have a catalog of ${productCatalog.length} electronics products. 

The user is looking for: "${query}"

Based on the search query, identify which products from our catalog might be relevant. Return a JSON array of product IDs that match the user's intent. If no products match well, return an empty array.

Product catalog includes: smartphones, laptops, TVs, earbuds, smartwatches, refrigerators, washing machines, tablets, speakers, printers, gaming consoles, accessories, and air conditioners from brands like Apple, Samsung, Sony, OnePlus, Xiaomi, HP, Dell, LG, etc.

Only return the JSON array of product IDs, nothing else.`;

  const response = await chatCompletion([
    { role: 'user', content: searchPrompt }
  ], { model: 'kimi-latest', maxTokens: 1024, useCache: false });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    return [];
  }

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const productIds = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    return productIds.filter(id => productCatalog.some(p => p.id === id));
  } catch (parseError) {
    console.error('Failed to parse AI search response:', parseError);
    return [];
  }
};

/**
 * General assistant response
 */
export const getAssistantResponse = async (message, context = '') => {
  const response = await chatCompletion([
    {
      role: 'system',
      content: context || 'You are a helpful shopping assistant.'
    },
    { role: 'user', content: message }
  ]);

  return response.choices?.[0]?.message?.content || 'I apologize, but I could not process your request.';
};

/**
 * Two-wheeler showroom assistant
 */
export const getTwoWheelerAssistantResponse = async (message, vehicleCount, priceRange) => {
  const context = `You are a helpful 2-wheeler showroom assistant. You have access to ${vehicleCount} vehicles ranging from ₹${priceRange.min} to ₹${priceRange.max}. Keep responses friendly, concise, and ask follow-up questions to help narrow down preferences.`;

  return getAssistantResponse(message, context);
};

/**
 * Image analysis with OCR
 */
export const analyzeImage = async (imageData) => {
  const response = await chatCompletion([
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Please analyze this image and extract any text from it. If it is a product image, describe what you see and any visible text.' },
        { type: 'image_url', image_url: { url: imageData } }
      ]
    }
  ], { maxTokens: 2048 });

  return response.choices?.[0]?.message?.content || 'Could not analyze the image.';
};

/**
 * Clear the request cache
 */
export const clearApiCache = () => {
  requestCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => ({
  size: requestCache.size,
  entries: Array.from(requestCache.keys())
});

// Cleanup cache periodically
setInterval(clearExpiredCache, CACHE_DURATION);

export default {
  chatCompletion,
  searchProductsWithAI,
  getAssistantResponse,
  getTwoWheelerAssistantResponse,
  analyzeImage,
  clearApiCache,
  getCacheStats,
  ApiError
};

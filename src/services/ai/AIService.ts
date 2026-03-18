/**
 * Core AI Service with LLM adapter integration
 * Based on reference project's apiService.js architecture
 * Provides centralized AI model communication with caching and retry logic
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  useCache?: boolean;
  responseFormat?: 'json' | 'text';
}

export interface AIResponse<T = unknown> {
  content: string;
  parsedData?: T;
  confidence: number;
  modelUsed: string;
  processingTime: number;
}

export interface AIServiceConfig {
  apiBaseUrl: string;
  apiKey: string;
  defaultModel: string;
  fallbackModel?: string;
  timeout: number;
  maxRetries: number;
  cacheDuration: number;
}

interface CacheEntry {
  data: AIResponse;
  timestamp: number;
}

/**
 * Custom AI Error class
 */
export class AIError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public data: unknown = null,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}

class AIService {
  private config: AIServiceConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private requestQueue: Map<string, Promise<AIResponse>> = new Map();

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = {
      apiBaseUrl: import.meta.env.VITE_AI_API_BASE_URL || 'https://grid.ai.juspay.net/v1',
      apiKey: import.meta.env.VITE_AI_API_KEY || '',
      defaultModel: import.meta.env.VITE_AI_DEFAULT_MODEL || 'claude-sonnet-4-5',
      fallbackModel: import.meta.env.VITE_AI_FALLBACK_MODEL || 'kimi-latest',
      timeout: 30000,
      maxRetries: 2,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      ...config
    };
  }

  /**
   * Main chat completion method with caching and retry logic
   */
  async chatCompletion<T = unknown>(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<AIResponse<T>> {
    const {
      model = this.config.defaultModel,
      maxTokens = 4096,
      temperature = 0.7,
      useCache = true,
      responseFormat = 'text'
    } = options;

    const cacheKey = this.generateCacheKey(messages, model, maxTokens);

    // Check cache for identical requests
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached as AIResponse<T>;
      }
    }

    // Prevent duplicate in-flight requests
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey) as Promise<AIResponse<T>>;
    }

    const requestPromise = this.executeWithRetry<T>(
      messages,
      model,
      maxTokens,
      temperature,
      responseFormat,
      cacheKey,
      useCache
    );

    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    messages: ChatMessage[],
    model: string,
    maxTokens: number,
    temperature: number,
    responseFormat: string,
    cacheKey: string,
    useCache: boolean,
    attempt: number = 0
  ): Promise<AIResponse<T>> {
    const startTime = performance.now();

    try {
      const response = await this.makeRequest(
        messages,
        model,
        maxTokens,
        temperature,
        responseFormat
      );

      const processingTime = performance.now() - startTime;

      const result: AIResponse<T> = {
        content: response.content,
        parsedData: response.parsedData as T,
        confidence: response.confidence,
        modelUsed: model,
        processingTime
      };

      if (useCache) {
        this.setCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      const isRetryable = this.isRetryableError(error, attempt);

      if (isRetryable && attempt < this.config.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(
          messages,
          model,
          maxTokens,
          temperature,
          responseFormat,
          cacheKey,
          useCache,
          attempt + 1
        );
      }

      // Try fallback model if available
      if (model !== this.config.fallbackModel && this.config.fallbackModel) {
        console.warn(`Primary model ${model} failed, trying fallback ${this.config.fallbackModel}`);
        return this.executeWithRetry(
          messages,
          this.config.fallbackModel,
          maxTokens,
          temperature,
          responseFormat,
          cacheKey,
          useCache,
          0
        );
      }

      throw error;
    }
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest(
    messages: ChatMessage[],
    model: string,
    maxTokens: number,
    temperature: number,
    responseFormat: string
  ): Promise<{ content: string; parsedData?: unknown; confidence: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleHTTPError(response);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new AIError('Empty response from AI model', 500, null, true);
      }

      let parsedData: unknown;
      let confidence = 0.8;

      if (responseFormat === 'json') {
        try {
          parsedData = this.extractAndParseJSON(content);
          confidence = this.calculateConfidence(parsedData);
        } catch (parseError) {
          console.warn('Failed to parse JSON response, returning raw content');
        }
      }

      return { content, parsedData, confidence };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new AIError('Request timed out', 408, null, true);
        }
        if (error.message.includes('fetch')) {
          throw new AIError('Network error', 0, null, true);
        }
      }

      throw new AIError(
        error instanceof Error ? error.message : 'Unknown error',
        500,
        null,
        true
      );
    }
  }

  /**
   * Handle HTTP errors with specific messaging
   */
  private async handleHTTPError(response: Response): Promise<void> {
    const errorData = await response.json().catch(() => ({}));

    switch (response.status) {
      case 401:
        throw new AIError(
          'AI service authentication failed. Please check API configuration.',
          401,
          errorData,
          false
        );
      case 429:
        throw new AIError(
          'AI service rate limit exceeded. Please try again.',
          429,
          errorData,
          true
        );
      case 503:
        throw new AIError(
          'AI service temporarily unavailable.',
          503,
          errorData,
          true
        );
      default:
        throw new AIError(
          errorData.message || `AI service error: ${response.statusText}`,
          response.status,
          errorData,
          response.status >= 500
        );
    }
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: unknown, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) return false;
    if (error instanceof AIError) {
      return error.retryable;
    }
    return false;
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(
    messages: ChatMessage[],
    model: string,
    maxTokens: number
  ): string {
    const content = messages.map(m => `${m.role}:${m.content}`).join('|');
    return `${model}:${maxTokens}:${this.hashString(content)}`;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private getFromCache(key: string): AIResponse | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.config.cacheDuration) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set cache entry
   */
  private setCache(key: string, data: AIResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean old entries if cache gets too large
    if (this.cache.size > 100) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
  }

  /**
   * Extract and parse JSON from AI response
   */
  private extractAndParseJSON(content: string): unknown {
    // Try direct parsing first
    try {
      return JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }

      // Try to find JSON object/array in text
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }

      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }

      throw new Error('No valid JSON found in response');
    }
  }

  /**
   * Calculate confidence score from parsed response
   */
  private calculateConfidence(data: unknown): number {
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      if (typeof obj.confidence === 'number') {
        return Math.min(1, Math.max(0, obj.confidence));
      }
    }
    return 0.8;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;

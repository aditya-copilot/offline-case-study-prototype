import type {
  AIReasoningRequest,
  AIReasoningResponse,
  AIRecommendation,
  LLMAdapter as ILLMAdapter
} from '../types';

export abstract class BaseLLMAdapter implements ILLMAdapter {
  protected modelName: string;
  protected apiKey?: string;
  protected baseUrl?: string;
  protected timeout: number;

  constructor(config: {
    modelName: string;
    apiKey?: string;
    baseUrl?: string;
    timeout?: number;
  }) {
    this.modelName = config.modelName;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
  }

  abstract generateRecommendations(request: AIReasoningRequest): Promise<AIReasoningResponse>;
  abstract generateExplanation(recommendation: AIRecommendation): Promise<string>;
  abstract estimateConfidence(prompt: string): Promise<number>;

  protected async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

export class OpenAIAdapter extends BaseLLMAdapter {
  constructor(config: {
    apiKey: string;
    modelName?: string;
    baseUrl?: string;
    timeout?: number;
  }) {
    super({
      modelName: config.modelName || 'gpt-4',
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      timeout: config.timeout
    });
  }

  async generateRecommendations(request: AIReasoningRequest): Promise<AIReasoningResponse> {
    const startTime = performance.now();

    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content: this.buildSystemPrompt()
            },
            {
              role: 'user',
              content: request.prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content);
      const processingTime = performance.now() - startTime;

      return {
        recommendations: parsed.recommendations || [],
        reasoningSummary: parsed.reasoningSummary || '',
        confidence: parsed.confidence || 0.5,
        processingTime,
        modelUsed: this.modelName
      };
    } catch (error) {
      console.error('OpenAI adapter error:', error);
      throw error;
    }
  }

  async generateExplanation(recommendation: AIRecommendation): Promise<string> {
    const prompt = `Explain this recommendation in a conversational way:

Recommendation: ${recommendation.title}
Description: ${recommendation.description}
Reasoning: ${recommendation.reasoning.primaryFactors.join(', ')}

Provide a brief, friendly explanation suitable for a customer.`;

    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No explanation available';
    } catch {
      return 'Explanation temporarily unavailable';
    }
  }

  async estimateConfidence(prompt: string): Promise<number> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content: 'Rate the confidence of this recommendation prompt from 0.0 to 1.0. Respond with just the number.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0,
          max_tokens: 10
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '0.5';
      const confidence = parseFloat(content);
      return isNaN(confidence) ? 0.5 : Math.min(1, Math.max(0, confidence));
    } catch {
      return 0.5;
    }
  }

  private buildSystemPrompt(): string {
    return `You are an AI shopping assistant for a smart store. 
Generate personalized product recommendations based on customer context.
Always respond in valid JSON format with this structure:
{
  "recommendations": [...],
  "reasoningSummary": "...",
  "confidence": 0.0-1.0
}`;
  }
}

export class LocalLLMAdapter extends BaseLLMAdapter {
  constructor(config: {
    baseUrl?: string;
    modelName?: string;
    timeout?: number;
  }) {
    super({
      modelName: config.modelName || 'local-llm',
      baseUrl: config.baseUrl || 'http://localhost:11434',
      timeout: config.timeout
    });
  }

  async generateRecommendations(request: AIReasoningRequest): Promise<AIReasoningResponse> {
    const startTime = performance.now();

    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          prompt: request.prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        throw new Error(`Local LLM error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.response;
      
      const parsed = JSON.parse(content);
      const processingTime = performance.now() - startTime;

      return {
        recommendations: parsed.recommendations || [],
        reasoningSummary: parsed.reasoningSummary || '',
        confidence: parsed.confidence || 0.5,
        processingTime,
        modelUsed: this.modelName
      };
    } catch (error) {
      console.error('Local LLM adapter error:', error);
      throw error;
    }
  }

  async generateExplanation(recommendation: AIRecommendation): Promise<string> {
    const prompt = `Explain this recommendation briefly:
${recommendation.title} - ${recommendation.reasoning.primaryFactors.join(', ')}`;

    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          prompt,
          stream: false
        })
      });

      const data = await response.json();
      return data.response || 'No explanation available';
    } catch {
      return 'Explanation unavailable';
    }
  }

  async estimateConfidence(): Promise<number> {
    return 0.7;
  }
}

export class EdgeAIAdapter extends BaseLLMAdapter {
  private model: any;

  constructor(config: {
    modelName?: string;
    timeout?: number;
  }) {
    super({
      modelName: config.modelName || 'edge-ai-model',
      timeout: config.timeout
    });
  }

  async initialize(): Promise<void> {
    // Placeholder for edge AI model initialization
    // e.g., TensorFlow.js model loading
    console.log(`Initializing edge AI model: ${this.modelName}`);
  }

  async generateRecommendations(request: AIReasoningRequest): Promise<AIReasoningResponse> {
    const startTime = performance.now();

    // Placeholder implementation
    // In reality, this would run inference locally
    const processingTime = performance.now() - startTime;

    return {
      recommendations: [],
      reasoningSummary: 'Edge AI inference completed',
      confidence: 0.8,
      processingTime,
      modelUsed: this.modelName
    };
  }

  async generateExplanation(recommendation: AIRecommendation): Promise<string> {
    return `Based on ${recommendation.reasoning.primaryFactors.length} factors, this recommendation has ${(recommendation.confidence * 100).toFixed(0)}% confidence.`;
  }

  async estimateConfidence(): Promise<number> {
    return 0.85;
  }
}

export class MockLLMAdapter extends BaseLLMAdapter {
  constructor() {
    super({ modelName: 'mock-adapter' });
  }

  async generateRecommendations(request: AIReasoningRequest): Promise<AIReasoningResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      recommendations: [
        {
          id: 'mock-1',
          type: 'product',
          priority: 'high',
          confidence: 0.85,
          title: 'Mock Recommendation',
          description: 'This is a mock recommendation for testing',
          reasoning: {
            steps: [],
            overallConfidence: 0.85,
            primaryFactors: ['test'],
            evidence: []
          },
          expiresAt: Date.now() + 300000,
          triggeredAt: Date.now(),
          context: {
            shoppingList: [],
            searchHistory: [],
            movementPattern: {
              path: [],
              speed: 0,
              direction: 0,
              hesitationPoints: [],
              pattern: 'browsing'
            },
            timeInZones: new Map(),
            sessionDuration: 0,
            timeOfDay: 'morning',
            dayOfWeek: 'Monday',
            seasonalContext: 'spring',
            behavioralSignals: []
          }
        }
      ],
      reasoningSummary: 'Mock reasoning summary',
      confidence: 0.85,
      processingTime: 500,
      modelUsed: 'mock-adapter'
    };
  }

  async generateExplanation(): Promise<string> {
    return 'This is a mock explanation for testing purposes.';
  }

  async estimateConfidence(): Promise<number> {
    return 0.8;
  }
}

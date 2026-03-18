import type { AIRecommendation } from './VehicleAIRecommendationService';

export interface ParsedRecommendationResponse {
  recommendations: AIRecommendation[];
  comparisonSummary: string;
  verdict: string;
  suggestedActions: Array<{
    type: string;
    label: string;
    vehicleId: string;
  }>;
  followUpQuestions: string[];
  confidence: number;
}

export interface ParsedVoiceResponse {
  response: string;
  suggestedVehicleIds: string[];
  actions: Array<{
    type: string;
    label: string;
    payload: unknown;
  }>;
  confidence: number;
  followUpQuestion?: string;
}

export type ValidationError = {
  field: string;
  message: string;
  value?: unknown;
};

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  rawContent?: string;
}

class AIResponseParser {
  private maxRecursionDepth = 3;

  parseRecommendationResponse(content: string): ParseResult<ParsedRecommendationResponse> {
    const extracted = this.extractJSON(content);

    if (!extracted) {
      return {
        success: false,
        errors: [{ field: 'content', message: 'No valid JSON found in response' }],
        rawContent: content
      };
    }

    try {
      const parsed = JSON.parse(extracted);
      const validation = this.validateRecommendationResponse(parsed);

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          rawContent: content
        };
      }

      return {
        success: true,
        data: this.normalizeRecommendationResponse(parsed),
        rawContent: content
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'json',
          message: error instanceof Error ? error.message : 'JSON parse error'
        }],
        rawContent: content
      };
    }
  }

  parseVoiceResponse(content: string): ParseResult<ParsedVoiceResponse> {
    const extracted = this.extractJSON(content);

    if (!extracted) {
      return {
        success: false,
        errors: [{ field: 'content', message: 'No valid JSON found in voice response' }],
        rawContent: content
      };
    }

    try {
      const parsed = JSON.parse(extracted);
      const validation = this.validateVoiceResponse(parsed);

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          rawContent: content
        };
      }

      return {
        success: true,
        data: this.normalizeVoiceResponse(parsed),
        rawContent: content
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'json',
          message: error instanceof Error ? error.message : 'JSON parse error'
        }],
        rawContent: content
      };
    }
  }

  private extractJSON(content: string, depth = 0): string | null {
    if (depth > this.maxRecursionDepth) return null;

    const trimmed = content.trim();

    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return trimmed;
      } catch {}
    }

    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      const inner = this.extractJSON(codeBlockMatch[1], depth + 1);
      if (inner) return inner;
    }

    const objectMatch = trimmed.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        JSON.parse(objectMatch[0]);
        return objectMatch[0];
      } catch {}
    }

    const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        JSON.parse(arrayMatch[0]);
        return arrayMatch[0];
      } catch {}
    }

    const jsonLikeMatch = trimmed.match(/("recommendations"\s*:\s*\[|"response"\s*:\s*")/);
    if (jsonLikeMatch) {
      const startIndex = trimmed.indexOf(jsonLikeMatch[0]);
      const before = trimmed.slice(0, startIndex);
      const after = trimmed.slice(startIndex);

      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      let objectStart = -1;

      for (let i = 0; i < after.length; i++) {
        const char = after[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !inString) {
          inString = true;
          if (objectStart === -1) {
            const prevChar = after[i - 1];
            if (prevChar === undefined || /[\s{,]/.test(prevChar)) {
              const keyEnd = after.indexOf('"', i + 1);
              if (keyEnd > i) {
                const key = after.slice(i + 1, keyEnd);
                if (key === 'recommendations' || key === 'response') {
                  objectStart = before.lastIndexOf('{');
                  if (objectStart === -1) objectStart = 0;
                }
              }
            }
          }
        } else if (char === '"' && inString) {
          inString = false;
        }

        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') {
            braceCount--;
            if (braceCount === 0 && objectStart !== -1) {
              const candidate = before.slice(objectStart) + after.slice(0, i + 1);
              try {
                JSON.parse(candidate);
                return candidate;
              } catch {
                objectStart = -1;
              }
            }
          }
        }
      }
    }

    const lines = trimmed.split('\n');
    const jsonLines: string[] = [];
    let inJson = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('{') || trimmedLine.startsWith('[')) {
        inJson = true;
      }

      if (inJson) {
        jsonLines.push(trimmedLine);
      }

      if (trimmedLine.endsWith('}') || trimmedLine.endsWith(']')) {
        inJson = false;
      }
    }

    if (jsonLines.length > 0) {
      const candidate = jsonLines.join('\n');
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {}
    }

    return null;
  }

  private validateRecommendationResponse(data: unknown): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (typeof data !== 'object' || data === null) {
      return { valid: false, errors: [{ field: 'root', message: 'Response must be an object' }] };
    }

    const obj = data as Record<string, unknown>;

    if (!Array.isArray(obj.recommendations)) {
      errors.push({ field: 'recommendations', message: 'Must be an array' });
    } else {
      obj.recommendations.forEach((rec, idx) => {
        if (typeof rec !== 'object' || rec === null) {
          errors.push({ field: `recommendations[${idx}]`, message: 'Must be an object' });
          return;
        }

        const recObj = rec as Record<string, unknown>;

        if (typeof recObj.vehicleId !== 'string') {
          errors.push({ field: `recommendations[${idx}].vehicleId`, message: 'Must be a string' });
        }

        if (typeof recObj.rank !== 'number') {
          errors.push({ field: `recommendations[${idx}].rank`, message: 'Must be a number' });
        }

        if (typeof recObj.confidence !== 'number') {
          errors.push({ field: `recommendations[${idx}].confidence`, message: 'Must be a number' });
        }

        if (typeof recObj.reasoning !== 'string') {
          errors.push({ field: `recommendations[${idx}].reasoning`, message: 'Must be a string' });
        }
      });
    }

    if (typeof obj.verdict !== 'string') {
      errors.push({ field: 'verdict', message: 'Must be a string' });
    }

    return { valid: errors.length === 0, errors };
  }

  private validateVoiceResponse(data: unknown): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (typeof data !== 'object' || data === null) {
      return { valid: false, errors: [{ field: 'root', message: 'Response must be an object' }] };
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.response !== 'string') {
      errors.push({ field: 'response', message: 'Must be a string' });
    }

    if (!Array.isArray(obj.suggestedVehicles)) {
      errors.push({ field: 'suggestedVehicles', message: 'Must be an array' });
    }

    if (typeof obj.confidence !== 'number') {
      errors.push({ field: 'confidence', message: 'Must be a number' });
    }

    return { valid: errors.length === 0, errors };
  }

  private normalizeRecommendationResponse(data: Record<string, unknown>): ParsedRecommendationResponse {
    const recommendations = (data.recommendations as Array<Record<string, unknown>> || []).map(rec => ({
      vehicleId: String(rec.vehicleId || ''),
      rank: Number(rec.rank || 0),
      confidence: Math.min(1, Math.max(0, Number(rec.confidence || 0.5))),
      reasoning: String(rec.reasoning || ''),
      keyHighlights: Array.isArray(rec.keyHighlights)
        ? rec.keyHighlights.map(String)
        : [String(rec.reasoning || '')],
      bestFor: String(rec.bestFor || 'General use')
    }));

    return {
      recommendations,
      comparisonSummary: String(data.comparisonSummary || ''),
      verdict: String(data.verdict || ''),
      suggestedActions: Array.isArray(data.suggestedActions)
        ? data.suggestedActions.map((action: Record<string, unknown>) => ({
            type: String(action.type || ''),
            label: String(action.label || ''),
            vehicleId: String(action.vehicleId || action.payload || '')
          }))
        : [],
      followUpQuestions: Array.isArray(data.followUpQuestions)
        ? data.followUpQuestions.map(String)
        : [],
      confidence: Math.min(1, Math.max(0, Number(data.confidence || 0.8)))
    };
  }

  private normalizeVoiceResponse(data: Record<string, unknown>): ParsedVoiceResponse {
    return {
      response: String(data.response || ''),
      suggestedVehicleIds: Array.isArray(data.suggestedVehicles)
        ? data.suggestedVehicles.map(String)
        : [],
      actions: Array.isArray(data.actions)
        ? data.actions.map((action: Record<string, unknown>) => ({
            type: String(action.type || ''),
            label: String(action.label || ''),
            payload: action.payload
          }))
        : [],
      confidence: Math.min(1, Math.max(0, Number(data.confidence || 0.8))),
      followUpQuestion: data.followUpQuestion ? String(data.followUpQuestion) : undefined
    };
  }

  attemptRepair(content: string): string | null {
    let repaired = content;

    repaired = repaired.replace(/,\s*([}\]])/g, '$1');

    repaired = repaired.replace(/([{\[,])\s*([}\]])/g, '$1$2');

    const quotes = repaired.match(/"/g) || [];
    if (quotes.length % 2 !== 0) {
      repaired += '"';
    }

    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      repaired += '}'.repeat(openBraces - closeBraces);
    }

    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      repaired += ']'.repeat(openBrackets - closeBrackets);
    }

    try {
      JSON.parse(repaired);
      return repaired;
    } catch {
      return null;
    }
  }
}

export const aiResponseParser = new AIResponseParser();
export default aiResponseParser;

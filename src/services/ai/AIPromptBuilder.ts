import type { Vehicle } from '@core/types/vehicles';
import type { AssistantPersonality, AssistantIntent } from '@assistant/types';

export interface PromptContext {
  userQuery: string;
  intent: AssistantIntent;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  userPreferences: {
    preferredBrands?: string[];
    budgetRange?: { min: number; max: number };
    preferredFuelType?: string;
    preferredBodyStyle?: string;
    priorityFeatures?: string[];
  };
  currentZone?: string;
  viewedVehicles: string[];
  sessionDuration: number;
}

export interface VehicleRecommendationPrompt {
  system: string;
  user: string;
}

export interface ConversationPrompt {
  system: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
}

export class AIPromptBuilder {
  private personality: AssistantPersonality;

  constructor(personality: AssistantPersonality = 'auto') {
    this.personality = personality;
  }

  buildVehicleRecommendationPrompt(
    context: PromptContext,
    availableVehicles: Vehicle[],
    topCandidates: Vehicle[]
  ): VehicleRecommendationPrompt {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context, availableVehicles, topCandidates);

    return { system: systemPrompt, user: userPrompt };
  }

  buildConversationPrompt(
    context: PromptContext,
    userMessage: string
  ): ConversationPrompt {
    const systemPrompt = this.buildConversationSystemPrompt();
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...context.conversationHistory.slice(-6),
      { role: 'user', content: userMessage }
    ];

    return { system: systemPrompt, messages };
  }

  buildVoiceConversationPrompt(
    transcript: string,
    context: PromptContext,
    vehicles: Vehicle[]
  ): VehicleRecommendationPrompt {
    const systemPrompt = `You are an expert two-wheeler sales consultant. The user is speaking via voice input. 
Respond conversationally and naturally, as if speaking to a customer in a showroom.
Keep responses concise (2-4 sentences) and friendly.
${this.getPersonalityTraits()}`;

    const userPrompt = `USER VOICE INPUT: "${transcript}"

CONVERSATION CONTEXT:
- Intent detected: ${context.intent}
- User preferences: ${JSON.stringify(context.userPreferences, null, 2)}
- Previously viewed: ${context.viewedVehicles.join(', ') || 'None'}
- Session duration: ${Math.floor(context.sessionDuration / 1000)}s

AVAILABLE VEHICLES (${vehicles.length} total):
${this.formatVehicleList(vehicles.slice(0, 10))}

Respond naturally to the user's voice input. If they're asking about vehicles, provide helpful information. 
If they're giving preferences, acknowledge them and suggest relevant options.

Return your response in this JSON format:
{
  "response": "Your conversational response here",
  "suggestedVehicles": ["vehicle-id-1", "vehicle-id-2"],
  "actions": [
    { "type": "navigate|compare|view-details|book-test-ride", "label": "Action label", "payload": "action data" }
  ],
  "confidence": 0.95,
  "followUpQuestion": "Optional follow-up question to ask the user"
}`;

    return { system: systemPrompt, user: userPrompt };
  }

  private buildSystemPrompt(): string {
    return `You are an expert two-wheeler sales consultant with deep knowledge of Indian motorcycles and scooters.

YOUR GOAL: Analyze user requirements and recommend the BEST vehicles from the available inventory.

EVALUATION CRITERIA (in order of importance):
1. Budget match and value for money
2. Primary use case compatibility (commute, touring, sports, family)
3. Fuel efficiency and running costs
4. Maintenance and reliability
5. Brand reputation and service network
6. Latest features and technology
7. Rider experience level appropriateness
8. Resale value

RULES:
- ONLY recommend vehicles from the provided dataset
- Be specific about why each vehicle matches the user's needs
- Consider the user's conversation history and preferences
- If budget is mentioned, strictly respect it (±10% buffer allowed)
- Provide honest assessments, including any drawbacks
- Match personality: ${this.getPersonalityTraits()}

RESPONSE FORMAT: Return ONLY a valid JSON object.`;
  }

  private buildUserPrompt(
    context: PromptContext,
    availableVehicles: Vehicle[],
    topCandidates: Vehicle[]
  ): string {
    const { userQuery, intent, userPreferences, conversationHistory, viewedVehicles } = context;

    let prompt = `USER QUERY: "${userQuery}"

DETECTED INTENT: ${intent}

USER PREFERENCES:
`;

    if (userPreferences.budgetRange) {
      prompt += `- Budget: ₹${userPreferences.budgetRange.min.toLocaleString()} - ₹${userPreferences.budgetRange.max.toLocaleString()}\n`;
    }
    if (userPreferences.preferredBrands?.length) {
      prompt += `- Preferred Brands: ${userPreferences.preferredBrands.join(', ')}\n`;
    }
    if (userPreferences.preferredFuelType) {
      prompt += `- Fuel Type: ${userPreferences.preferredFuelType}\n`;
    }
    if (userPreferences.preferredBodyStyle) {
      prompt += `- Body Style: ${userPreferences.preferredBodyStyle}\n`;
    }
    if (userPreferences.priorityFeatures?.length) {
      prompt += `- Priority Features: ${userPreferences.priorityFeatures.join(', ')}\n`;
    }

    if (viewedVehicles.length > 0) {
      prompt += `\nPREVIOUSLY VIEWED: ${viewedVehicles.join(', ')}\n`;
    }

    if (conversationHistory.length > 0) {
      prompt += `\nCONVERSATION HISTORY:\n`;
      conversationHistory.slice(-4).forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }

    prompt += `\nTOP CANDIDATE VEHICLES:\n`;
    prompt += this.formatVehicleList(topCandidates);

    prompt += `\n\nFULL INVENTORY (${availableVehicles.length} vehicles available for reference)\n`;

    prompt += `\n
TASK: Analyze the user's query and recommend the TOP 3 most suitable vehicles.

Return your analysis in this exact JSON format:
{
  "recommendations": [
    {
      "vehicleId": "exact-vehicle-id",
      "rank": 1,
      "confidence": 0.95,
      "reasoning": "Detailed explanation of why this vehicle is the best match",
      "keyHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
      "bestFor": "Description of who should buy this vehicle"
    }
  ],
  "comparisonSummary": "Brief comparison highlighting key differences",
  "verdict": "Final recommendation with specific reasoning",
  "suggestedActions": [
    { "type": "view-details|compare|emi-calculator|book-test-ride", "label": "Action text", "vehicleId": "id" }
  ],
  "followUpQuestions": ["Question 1?", "Question 2?"]
}`;

    return prompt;
  }

  private buildConversationSystemPrompt(): string {
    const personalityTraits = this.getPersonalityTraits();

    return `You are an AI assistant for a two-wheeler showroom.

${personalityTraits}

CAPABILITIES:
- Answer questions about motorcycles and scooters
- Provide vehicle recommendations
- Compare different models
- Explain features and specifications
- Help with financing/EMI calculations
- Guide users to the right vehicle for their needs

RESPONSE GUIDELINES:
- Be friendly, helpful, and professional
- Keep responses concise but informative
- Ask clarifying questions when needed
- Use the user's preferences to personalize responses
- Suggest next steps or actions when appropriate

CONVERSATION STYLE:
- Natural and conversational
- Not overly formal or robotic
- Enthusiastic about two-wheelers
- Patient with customer questions`;
  }

  private getPersonalityTraits(): string {
    switch (this.personality) {
      case 'ev-expert':
        return 'PERSONALITY: You are an EV specialist. Focus on electric vehicles, range, charging infrastructure, environmental benefits, and total cost of ownership. Be knowledgeable about subsidies and EV technology.';
      case 'budget-advisor':
        return 'PERSONALITY: You are a budget-conscious advisor. Focus on value for money, fuel efficiency, low maintenance costs, and affordable options. Highlight savings and practical benefits.';
      case 'performance-guru':
        return 'PERSONALITY: You are a performance enthusiast. Focus on power, acceleration, handling, premium features, and riding experience. Be excited about specs and performance metrics.';
      case 'friendly-guide':
      default:
        return 'PERSONALITY: You are a friendly, helpful guide. Be warm, approachable, and focused on understanding the customer\'s needs. Balance features, price, and practicality.';
    }
  }

  private formatVehicleList(vehicles: Vehicle[]): string {
    return vehicles.map(v => {
      const avgPrice = (v.priceRange.min + v.priceRange.max) / 2;
      return `
ID: ${v.id}
Name: ${v.makeName} ${v.modelName}
Price: ₹${avgPrice.toLocaleString('en-IN')}
Fuel: ${v.fuelType}
Body: ${v.bodyStyle}
Tags: ${v.tags.join(', ')}
Rating: ${v.overallRating}/5
---`;
    }).join('\n');
  }

  setPersonality(personality: AssistantPersonality): void {
    this.personality = personality;
  }
}

export const aiPromptBuilder = new AIPromptBuilder();
export default aiPromptBuilder;

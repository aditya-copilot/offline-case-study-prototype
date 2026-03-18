import type {
  PromptContext,
  AIReasoningRequest,
  AIPersonality,
  RecommendationType
} from '../types';

interface PromptSection {
  title: string;
  content: string;
  priority: number;
}

interface StructuredPrompt {
  system: string;
  context: string;
  instruction: string;
  constraints: string;
  outputFormat: string;
  raw: string;
}

export class PromptBuilder {
  private personality: AIPersonality;
  private preferredTypes: RecommendationType[];

  constructor(personality: AIPersonality = 'explorer', preferredTypes: RecommendationType[] = ['product', 'bundle', 'insight']) {
    this.personality = personality;
    this.preferredTypes = preferredTypes;
  }

  buildRecommendationPrompt(context: PromptContext, constraints?: { maxRecommendations?: number; minConfidence?: number }): AIReasoningRequest {
    const structured = this.buildStructuredPrompt(context, constraints);
    
    const fullPrompt = `
${structured.system}

${structured.context}

${structured.instruction}

${structured.constraints}

${structured.outputFormat}
    `.trim();

    return {
      prompt: fullPrompt,
      context,
      constraints: {
        maxRecommendations: constraints?.maxRecommendations ?? 5,
        minConfidence: constraints?.minConfidence ?? 0.6,
        preferredTypes: this.preferredTypes,
        excludedCategories: []
      }
    };
  }

  private buildStructuredPrompt(context: PromptContext, constraints?: { maxRecommendations?: number; minConfidence?: number }): StructuredPrompt {
    const sections: PromptSection[] = [
      this.buildSystemSection(),
      this.buildCustomerSection(context),
      this.buildSessionSection(context),
      this.buildStoreSection(context),
      this.buildTemporalSection(context),
      this.buildBehavioralSection(context)
    ];

    const system = this.buildSystemSection().content;
    const contextStr = sections
      .filter(s => s.title !== 'System')
      .map(s => `## ${s.title}\n${s.content}`)
      .join('\n\n');

    const instruction = this.buildInstructionSection(constraints);
    const constraintsStr = this.buildConstraintsSection(constraints);
    const outputFormat = this.buildOutputFormatSection();

    return {
      system,
      context: contextStr,
      instruction,
      constraints: constraintsStr,
      outputFormat,
      raw: `
${system}

${contextStr}

${instruction}

${constraintsStr}

${outputFormat}
      `.trim()
    };
  }

  private buildSystemSection(): PromptSection {
    const personalityPrompts: Record<string, string> = {
      budget: 'You are a budget-conscious shopping assistant focused on finding the best value and savings.',
      health: 'You are a health-focused shopping assistant prioritizing organic, nutritious, and wellness products.',
      premium: 'You are a premium shopping assistant focused on quality, luxury, and exclusive products.',
      quick: 'You are an efficiency-focused shopping assistant prioritizing speed and convenience.',
      explorer: 'You are a discovery-focused shopping assistant helping customers find new and interesting products.'
    };

    return {
      title: 'System',
      content: `You are an intelligent retail AI assistant for a smart store navigation system.
${personalityPrompts[this.personality]}

Your goal is to provide personalized product recommendations, bundles, and shopping insights based on real-time customer context, behavior, and store data.

You have access to:
- Complete product catalog with attributes, pricing, and locations
- Customer shopping history and preferences
- Real-time store layout and zone information
- Current shopping list and session behavior
- Seasonal trends and promotional data

Respond with structured, actionable recommendations that enhance the shopping experience.`,
      priority: 1
    };
  }

  private buildCustomerSection(context: PromptContext): PromptSection {
    const { customerProfile } = context;
    
    return {
      title: 'Customer Profile',
      content: `Personality: ${customerProfile.personality}
Shopping History:
- Total visits: ${customerProfile.shoppingHistory.totalVisits}
- Average basket: $${customerProfile.shoppingHistory.averageBasketSize.toFixed(2)}
- Favorite zones: ${customerProfile.shoppingHistory.favoriteZones.join(', ')}
- Frequent products: ${customerProfile.shoppingHistory.frequentProducts.slice(0, 5).join(', ')}

Preferences:
- Price sensitivity: ${(customerProfile.preferences.priceSensitivity * 100).toFixed(0)}%
- Quality priority: ${(customerProfile.preferences.qualityPriority * 100).toFixed(0)}%
- Health consciousness: ${(customerProfile.preferences.healthConsciousness * 100).toFixed(0)}%
- Sustainability concern: ${(customerProfile.preferences.sustainabilityConcern * 100).toFixed(0)}%

Top affinities:
${Array.from(customerProfile.affinityScores.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([category, score]) => `- ${category}: ${(score * 100).toFixed(0)}%`)
  .join('\n')}`,
      priority: 2
    };
  }

  private buildSessionSection(context: PromptContext): PromptSection {
    const { currentSession } = context;
    
    return {
      title: 'Current Session',
      content: `Session started: ${new Date(currentSession.startedAt).toLocaleTimeString()}
Current zone: ${currentSession.currentZone || 'Unknown'}
Position: (${currentSession.position?.x ?? '?'}, ${currentSession.position?.y ?? '?'})

Shopping List (${currentSession.shoppingList.length} items):
${currentSession.shoppingList.map(item => `- ${item.productId} (qty: ${item.quantity}, checked: ${item.isChecked})`).join('\n')}

Collected items: ${currentSession.collectedItems.join(', ') || 'None'}
Skipped items: ${currentSession.skippedItems.join(', ') || 'None'}

Recent searches: ${currentSession.searchQueries.join(', ') || 'None'}
Viewed products: ${currentSession.viewedProducts.slice(-5).join(', ') || 'None'}`,
      priority: 3
    };
  }

  private buildStoreSection(context: PromptContext): PromptSection {
    const { storeContext } = context;
    
    return {
      title: 'Store Context',
      content: `Current crowd level: ${storeContext.currentCrowdLevel}

Active zones:
${storeContext.zoneMetadata.map(zone => `- ${zone.zoneId}: ${zone.popularProducts.length} popular products, avg dwell ${zone.averageDwellTime}s`).join('\n')}

Active promotions:
${storeContext.activePromotions.map(promo => `- ${promo.type}: ${promo.description}`).join('\n') || 'None'}`,
      priority: 4
    };
  }

  private buildTemporalSection(context: PromptContext): PromptSection {
    const { temporalContext } = context;
    
    return {
      title: 'Temporal Context',
      content: `Time: ${temporalContext.timeOfDay} on ${temporalContext.dayOfWeek}
Season: ${temporalContext.season}
Weekend: ${temporalContext.isWeekend ? 'Yes' : 'No'}
Holiday: ${temporalContext.isHoliday ? 'Yes' : 'No'}

Session duration: ${Math.floor(context.behavioralContext.sessionPatterns.length * 5 / 60)} minutes`,
      priority: 5
    };
  }

  private buildBehavioralSection(context: PromptContext): PromptSection {
    const { behavioralContext } = context;
    const recentSignals = behavioralContext.sessionPatterns.slice(-10);
    
    return {
      title: 'Behavioral Signals',
      content: `Recent activity (${recentSignals.length} signals):
${recentSignals.map(signal => `- ${signal.type}${signal.zoneId ? ` in ${signal.zoneId}` : ''}${signal.productId ? ` (${signal.productId})` : ''} [intensity: ${(signal.intensity * 100).toFixed(0)}%]`).join('\n')}

Zone transitions:
${behavioralContext.zoneTransitions.map(t => `- ${t.fromZoneId} → ${t.dwellTime}s → ${t.toZoneId}`).join('\n') || 'None'}

Fatigue score: ${(behavioralContext.fatigueScore * 100).toFixed(0)}%
Urgency score: ${(behavioralContext.urgencyScore * 100).toFixed(0)}%

Interest indicators:
${behavioralContext.interestIndicators
  .sort((a, b) => b.combinedScore - a.combinedScore)
  .slice(0, 5)
  .map(i => `- ${i.productId}: ${(i.combinedScore * 100).toFixed(0)}% interest`)
  .join('\n') || 'None detected'}`,
      priority: 6
    };
  }

  private buildInstructionSection(constraints?: { maxRecommendations?: number }): string {
    return `## Instruction

Based on the comprehensive context above, generate ${constraints?.maxRecommendations ?? 5} personalized recommendations.

Consider:
1. Items on the shopping list that haven't been collected
2. Products complementary to recent views and collected items
3. Seasonal and trending products matching customer preferences
4. Bundle opportunities that provide value
5. Navigation hints for efficient shopping
6. Behavioral insights about shopping patterns

Each recommendation must include reasoning based on specific signals from the context.`;
  }

  private buildConstraintsSection(constraints?: { minConfidence?: number }): string {
    return `## Constraints

- Minimum confidence: ${(constraints?.minConfidence ?? 0.6) * 100}%
- Focus on: ${this.preferredTypes.join(', ')}
- Avoid: Out-of-stock items, previously skipped items
- Prioritize: Items in current or nearby zones for convenience
- Respect: Customer personality (${this.personality}) and preferences`;
  }

  private buildOutputFormatSection(): string {
    return `## Output Format

Respond in JSON format with the following structure:

{
  "recommendations": [
    {
      "id": "rec-001",
      "type": "product|bundle|navigation|insight|reminder|discovery",
      "priority": "low|medium|high|urgent",
      "confidence": 0.85,
      "title": "Clear, actionable title",
      "description": "Detailed explanation with context",
      "products": ["prod-id-1", "prod-id-2"],
      "bundle": {
        "name": "Bundle name",
        "savings": 5.00
      },
      "navigationHint": {
        "type": "shortcut|detour|alert",
        "message": "Navigation guidance"
      },
      "reasoning": {
        "steps": [
          {
            "description": "What was observed",
            "confidence": 0.9,
            "evidence": ["signal-1", "signal-2"]
          }
        ],
        "primaryFactors": ["factor1", "factor2"]
      }
    }
  ],
  "reasoningSummary": "Brief summary of AI reasoning process",
  "confidence": 0.82,
  "modelUsed": "LocalAIReasoningModel"
}`;
  }

  setPersonality(personality: AIPersonality): void {
    this.personality = personality;
  }

  setPreferredTypes(types: RecommendationType[]): void {
    this.preferredTypes = types;
  }
}

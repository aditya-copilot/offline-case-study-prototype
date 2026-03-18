export { AIOrchestrator } from './orchestrator/AIOrchestrator';
export { PromptBuilder } from './prompt-engine/PromptBuilder';
export { ContextBuilder } from './context-builder/ContextBuilder';
export { LocalAIReasoningModel } from './models/LocalAIReasoningModel';
export { AICache } from './cache/AICache';
export { ExplainabilityPanel } from './explainability/ExplainabilityPanel';

export {
  BaseLLMAdapter,
  OpenAIAdapter,
  LocalLLMAdapter,
  EdgeAIAdapter,
  MockLLMAdapter
} from './adapters/LLMAdapter';

export type {
  AIPersonality,
  RecommendationType,
  AIRecommendation,
  ProductBundle,
  NavigationHint,
  BehavioralInsight,
  ReasoningChain,
  ReasoningStep,
  EvidenceItem,
  RecommendationContext,
  MovementPattern,
  BehavioralSignal,
  PromptContext,
  CustomerProfile,
  PreferenceProfile,
  ShoppingHistory,
  SessionContext,
  StoreContext,
  ZoneMetadata,
  Promotion,
  ProductContext,
  TemporalContext,
  BehavioralContext,
  ZoneTransition,
  InterestIndicator,
  AIReasoningRequest,
  ReasoningConstraints,
  AIReasoningResponse,
  LLMAdapter,
  AICacheEntry,
  PredictionResult
} from './types';

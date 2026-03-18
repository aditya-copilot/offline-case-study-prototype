export type {
  AssistantMode,
  AssistantPersonality,
  AssistantIntent,
  MessageRole,
  MessageType,
  VoiceState,
  ScanState,
  ScanTarget,
  AssistantMessage,
  AssistantAttachment,
  AssistantAction,
  AssistantContext,
  UserPreferenceContext,
  VoiceConfig,
  ScanConfig,
  AssistantMemory,
  ReasoningResult,
  MultimodalInput,
  AssistantState
} from './types';

export { AssistantEngine, assistantEngine } from './core/AssistantEngine';
export { VoiceEngine, voiceEngine } from './voice/VoiceEngine';
export { ScanEngine, scanEngine } from './scan/ScanEngine';
export { AIRecommendationEngine, aiRecommendationEngine } from './reasoning/AIRecommendationEngine';
export { useAssistant } from './hooks/useAssistant';
export { FloatingAssistant } from './ui/FloatingAssistant';
export { AssistantChat } from './ui/AssistantChat';
export { VoiceInterface } from './ui/VoiceInterface';
export { ScanInterface } from './ui/ScanInterface';
export { CompareView } from './ui/CompareView';
export { assistantMemory } from './memory/AssistantMemory';
export { contextFusion } from './multimodal/ContextFusion';

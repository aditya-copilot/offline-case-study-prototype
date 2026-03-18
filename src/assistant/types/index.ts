export type AssistantMode = 'text' | 'voice' | 'scan' | 'hybrid';

export type AssistantPersonality =
  | 'ev-expert'
  | 'budget-advisor'
  | 'performance-guru'
  | 'friendly-guide'
  | 'auto';

export type AssistantIntent =
  | 'vehicle-search'
  | 'comparison'
  | 'feature-explanation'
  | 'financing'
  | 'navigation'
  | 'test-ride'
  | 'general-chat'
  | 'recommendation'
  | 'specs-query';

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageType =
  | 'text'
  | 'vehicle-card'
  | 'comparison-table'
  | 'navigation-cta'
  | 'feature-list'
  | 'spec-highlight'
  | 'voice-transcript';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export type ScanState = 'idle' | 'scanning' | 'recognizing' | 'success' | 'error';

export type ScanTarget = 'vehicle' | 'number-plate' | 'accessory' | 'qr-code';

export interface AssistantMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  metadata?: {
    vehicles?: string[];
    confidence?: number;
    processingTime?: number;
    sources?: string[];
    actions?: AssistantAction[];
  };
  timestamp: number;
  attachments?: AssistantAttachment[];
}

export interface AssistantAttachment {
  type: 'vehicle' | 'image' | 'comparison' | 'navigation';
  data: unknown;
}

export interface AssistantAction {
  type: 'navigate' | 'compare' | 'view-details' | 'book-test-ride' | 'call' | 'share';
  label: string;
  payload: unknown;
}

export interface AssistantContext {
  currentZone?: string;
  viewedVehicles: string[];
  searchHistory: string[];
  intent: AssistantIntent;
  confidence: number;
  sessionDuration: number;
  userPreferences: UserPreferenceContext;
}

export interface UserPreferenceContext {
  preferredBrands: string[];
  budgetRange?: { min: number; max: number };
  preferredFuelType?: string;
  preferredBodyStyle?: string;
  priorityFeatures: string[];
}

export interface VoiceConfig {
  mode: 'push-to-talk' | 'continuous';
  language: string;
  continuousListening: boolean;
  autoSpeakResponses: boolean;
  silenceThreshold: number;
  noiseSuppression: boolean;
}

export interface ScanConfig {
  target: ScanTarget;
  autoCapture: boolean;
  showOverlay: boolean;
  confidenceThreshold: number;
  simulationMode: boolean;
}

export interface AssistantMemory {
  sessionId: string;
  messages: AssistantMessage[];
  context: AssistantContext;
  learnedPreferences: Record<string, unknown>;
  intentHistory: AssistantIntent[];
}

export interface ReasoningResult {
  intent: AssistantIntent;
  confidence: number;
  suggestedVehicles: string[];
  reasoning: string;
  followUpQuestions: string[];
  relatedSpecs: string[];
}

export interface MultimodalInput {
  text?: string;
  voice?: {
    transcript: string;
    confidence: number;
    audioBlob?: Blob;
  };
  scan?: {
    target: ScanTarget;
    result: unknown;
    imageData?: string;
  };
  context: AssistantContext;
}

export interface AssistantState {
  isOpen: boolean;
  isExpanded: boolean;
  mode: AssistantMode;
  personality: AssistantPersonality;
  voiceState: VoiceState;
  scanState: ScanState;
  messages: AssistantMessage[];
  isProcessing: boolean;
  currentSuggestion: string[];
}

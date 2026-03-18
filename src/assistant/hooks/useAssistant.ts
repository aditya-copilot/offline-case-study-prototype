import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceEngine, voiceEngine } from '../voice/VoiceEngine';
import { ScanEngine, scanEngine } from '../scan/ScanEngine';
import { aiRecommendationEngine } from '../reasoning/AIRecommendationEngine';
import { assistantMemory } from '../memory/AssistantMemory';
import { contextFusion } from '../multimodal/ContextFusion';
import type {
  AssistantMessage,
  AssistantMode,
  AssistantPersonality,
  VoiceState,
  ScanState,
  AssistantContext,
  AssistantAction
} from '../types';
import { generateId } from '@core/utils';

interface UseAssistantOptions {
  persistHistory?: boolean;
  personality?: AssistantPersonality;
}

interface RecommendationData {
  vehicles: Array<{
    id: string;
    makeName: string;
    modelName: string;
    priceRange: { min: number; max: number };
    matchScore: number;
    matchReasons: string[];
    pros: string[];
    cons: string[];
    imagePath?: string;
  }>;
  comparison?: {
    vehicles: string[];
    comparisonPoints: Array<{
      category: string;
      winner: string;
      details: Record<string, string>;
    }>;
  };
}

interface UseAssistantReturn {
  messages: AssistantMessage[];
  isProcessing: boolean;
  mode: AssistantMode;
  voiceState: VoiceState;
  scanState: ScanState;
  currentPersonality: AssistantPersonality;
  context: AssistantContext;
  lastRecommendation: RecommendationData | null;
  compareVehicleIds: string[];
  isCompareOpen: boolean;
  sendMessage: (text: string) => Promise<void>;
  sendVoiceMessage: (transcript: string, confidence: number) => Promise<void>;
  sendScanResult: (vehicleId: string, confidence: number) => Promise<void>;
  setMode: (mode: AssistantMode) => void;
  setPersonality: (personality: AssistantPersonality) => void;
  clearHistory: () => void;
  startVoiceListening: (
    onTranscript: (text: string) => void,
    onError: (error: string) => void
  ) => void;
  stopVoiceListening: () => void;
  startScanning: (
    videoElement: HTMLVideoElement,
    onResult: (result: { success: boolean; vehicleId?: string; message: string }) => void,
    onError: (error: string) => void
  ) => Promise<void>;
  stopScanning: () => void;
  openCompare: (vehicleIds: string[]) => void;
  closeCompare: () => void;
  isVoiceSupported: boolean;
  isScanSupported: boolean;
}

const STORAGE_KEY = 'assistant:history';
const MAX_HISTORY = 50;

export function useAssistant(options: UseAssistantOptions = {}): UseAssistantReturn {
  const { persistHistory = true, personality = 'auto' } = options;

  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    if (persistHistory) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('text');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [currentPersonality, setCurrentPersonality] = useState<AssistantPersonality>(personality);
  const [context, setContext] = useState<AssistantContext>({
    viewedVehicles: [],
    searchHistory: [],
    intent: 'general-chat',
    confidence: 1.0,
    sessionDuration: 0,
    userPreferences: {
      preferredBrands: [],
      priorityFeatures: []
    }
  });
  const [lastRecommendation, setLastRecommendation] = useState<RecommendationData | null>(null);
  const [compareVehicleIds, setCompareVehicleIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    assistantMemory.initialize();
  }, []);

  useEffect(() => {
    if (persistHistory) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
      } catch {
        return;
      }
    }
  }, [messages, persistHistory]);

  const addMessage = useCallback((message: AssistantMessage) => {
    setMessages((prev) => [...prev, message]);
    assistantMemory.addMessage(message);
  }, []);

  const processAIResponse = useCallback(async (query: string, isVoice = false) => {
    setIsProcessing(true);
    if (isVoice) {
      setVoiceState('processing');
    }

    try {
      const userPrefs = assistantMemory.getUserPreferences();
      const aiResponse = await aiRecommendationEngine.processQuery(query, userPrefs);

      const recommendationData: RecommendationData = {
        vehicles: aiResponse.recommendations.map((r) => ({
          id: r.vehicle.id,
          makeName: r.vehicle.makeName,
          modelName: r.vehicle.modelName,
          priceRange: r.vehicle.priceRange,
          matchScore: r.matchScore,
          matchReasons: r.matchReasons,
          pros: r.pros,
          cons: r.cons,
          imagePath: r.vehicle.imagePath
        }))
      };

      if (aiResponse.comparison) {
        recommendationData.comparison = {
          vehicles: aiResponse.comparison.vehicles.map((v) => v.id),
          comparisonPoints: aiResponse.comparison.comparisonPoints
        };
      }

      setLastRecommendation(recommendationData);

      if (aiResponse.type === 'comparison' && aiResponse.comparison) {
        setCompareVehicleIds(aiResponse.comparison.vehicles.map((v) => v.id));
      }

      const assistantMessage: AssistantMessage = {
        id: generateId(),
        role: 'assistant',
        type: aiResponse.type === 'comparison' ? 'comparison-table' : aiResponse.type === 'single' ? 'vehicle-card' : 'text',
        content: aiResponse.message,
        metadata: {
          confidence: aiResponse.recommendations[0]?.matchScore ?? 0.8,
          vehicles: aiResponse.recommendations.map((r) => r.vehicle.id),
          actions: aiResponse.actions,
          sources: ['ai-recommendation']
        },
        timestamp: Date.now()
      };

      addMessage(assistantMessage);

      contextFusion.recordSearch(query);
      await assistantMemory.addSearchQuery(query);

      if (isVoice && voiceEngine.getState() !== 'error') {
        voiceEngine.speak(aiResponse.message, () => {
          setVoiceState('idle');
        });
      }

      setContext((prev) => ({
        ...prev,
        searchHistory: [...prev.searchHistory, query].slice(-20),
        intent: aiResponse.type === 'comparison' ? 'comparison' : 'recommendation'
      }));
    } catch (error) {
      const errorMessage: AssistantMessage = {
        id: generateId(),
        role: 'assistant',
        type: 'text',
        content: 'Sorry, I encountered an error while getting recommendations. Please try again.',
        metadata: {
          confidence: 0,
          sources: ['error']
        },
        timestamp: Date.now()
      };
      addMessage(errorMessage);
      setVoiceState('idle');
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, context]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: AssistantMessage = {
      id: generateId(),
      role: 'user',
      type: 'text',
      content: text,
      timestamp: Date.now()
    };

    addMessage(userMessage);
    await processAIResponse(text, false);
  }, [addMessage, isProcessing, processAIResponse]);

  const sendVoiceMessage = useCallback(async (transcript: string, confidence: number) => {
    if (!transcript.trim() || isProcessing) return;

    const userMessage: AssistantMessage = {
      id: generateId(),
      role: 'user',
      type: 'voice-transcript',
      content: transcript,
      metadata: { confidence },
      timestamp: Date.now()
    };

    addMessage(userMessage);
    await processAIResponse(transcript, true);
  }, [addMessage, isProcessing, processAIResponse]);

  const sendScanResult = useCallback(async (vehicleId: string, confidence: number) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setScanState('recognizing');

    try {
      const query = `Tell me about ${vehicleId}`;
      await processAIResponse(query, false);
      setScanState('success');
    } catch {
      const errorMessage: AssistantMessage = {
        id: generateId(),
        role: 'assistant',
        type: 'text',
        content: 'Sorry, I could not identify the vehicle. Please try scanning again.',
        metadata: {
          confidence: 0,
          sources: ['error']
        },
        timestamp: Date.now()
      };
      addMessage(errorMessage);
      setScanState('error');
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, isProcessing, processAIResponse]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setLastRecommendation(null);
    assistantMemory.clearSession();
    if (persistHistory) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        return;
      }
    }
  }, [persistHistory]);

  const startVoiceListening = useCallback((
    onTranscript: (text: string) => void,
    onError: (error: string) => void
  ) => {
    if (!voiceEngine.isSupported()) {
      onError('Voice recognition is not supported in this browser.');
      return;
    }

    voiceEngine.startListening(
      (text, confidence) => {
        sendVoiceMessage(text, confidence);
        onTranscript(text);
      },
      (state) => {
        setVoiceState(state);
        if (state === 'error') {
          onError('Voice recognition failed. Please try again.');
        }
      }
    );
  }, [sendVoiceMessage]);

  const stopVoiceListening = useCallback(() => {
    voiceEngine.stopListening();
    setVoiceState('idle');
  }, []);

  const startScanning = useCallback(async (
    videoElement: HTMLVideoElement,
    onResult: (result: { success: boolean; vehicleId?: string; message: string }) => void,
    onError: (error: string) => void
  ) => {
    if (!scanEngine.isSupported()) {
      onError('Camera access is not supported in this browser.');
      return;
    }

    try {
      await scanEngine.startScan(
        videoElement,
        (state) => setScanState(state),
        (result) => {
          onResult({
            success: result.success,
            vehicleId: result.vehicleId,
            message: result.message
          });
          if (result.success && result.vehicleId) {
            sendScanResult(result.vehicleId, result.confidence);
          }
        }
      );
    } catch {
      onError('Failed to start camera. Please check permissions.');
    }
  }, [sendScanResult]);

  const stopScanning = useCallback(() => {
    scanEngine.stopScan();
    setScanState('idle');
  }, []);

  const openCompare = useCallback((vehicleIds: string[]) => {
    setCompareVehicleIds(vehicleIds);
    setIsCompareOpen(true);
  }, []);

  const closeCompare = useCallback(() => {
    setIsCompareOpen(false);
  }, []);

  return {
    messages,
    isProcessing,
    mode,
    voiceState,
    scanState,
    currentPersonality,
    context,
    lastRecommendation,
    compareVehicleIds,
    isCompareOpen,
    sendMessage,
    sendVoiceMessage,
    sendScanResult,
    setMode,
    setPersonality: setCurrentPersonality,
    clearHistory,
    startVoiceListening,
    stopVoiceListening,
    startScanning,
    stopScanning,
    openCompare,
    closeCompare,
    isVoiceSupported: voiceEngine.isSupported(),
    isScanSupported: scanEngine.isSupported()
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { AIOrchestrator } from '../../ai/orchestrator/AIOrchestrator';
import type {
  AIRecommendation,
  AIPersonality,
  PredictionResult
} from '../../ai/types';
import type { ShoppingListItem } from '../../core/types';
import type { Vector2 } from '../../core/spatial/types';

interface UseAIRecommendationsOptions {
  personality?: AIPersonality;
  autoInitialize?: boolean;
}

interface UseAIRecommendationsReturn {
  recommendations: AIRecommendation[];
  isLoading: boolean;
  isThinking: boolean;
  selectedRecommendation: AIRecommendation | null;
  prediction: PredictionResult | null;
  personality: AIPersonality;
  stats: {
    totalRecs: number;
    avgConfidence: number;
    processingTime: number;
  };
  
  setPersonality: (personality: AIPersonality) => void;
  updateContext: (
    customerId: string,
    currentZoneId: string | undefined,
    position: Vector2 | undefined,
    shoppingList: ShoppingListItem[]
  ) => Promise<void>;
  recordSignal: (signal: {
    type: 'dwell' | 'view' | 'search' | 'hesitate' | 'skip' | 'pickup';
    zoneId?: string;
    productId?: string;
    intensity?: number;
  }) => void;
  selectRecommendation: (rec: AIRecommendation | null) => void;
  generateExplanation: (recommendationId: string) => Promise<string>;
  predictIntent: () => Promise<PredictionResult>;
  refresh: () => void;
}

export const useAIRecommendations = (
  options: UseAIRecommendationsOptions = {}
): UseAIRecommendationsReturn => {
  const { personality: initialPersonality = 'explorer', autoInitialize = true } = options;
  
  const orchestratorRef = useRef<AIOrchestrator | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [personality, setPersonalityState] = useState<AIPersonality>(initialPersonality);
  const [stats, setStats] = useState({
    totalRecs: 0,
    avgConfidence: 0,
    processingTime: 0
  });

  useEffect(() => {
    orchestratorRef.current = new AIOrchestrator({ personality: initialPersonality });
    
    const initialize = async () => {
      if (autoInitialize) {
        try {
          const res = await fetch('/data/products.json');
          const data = await res.json();
          await orchestratorRef.current?.initialize(data.products);
        } catch {
          console.error('Failed to initialize AI');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    initialize();

    return () => {
      orchestratorRef.current?.reset();
    };
  }, [initialPersonality, autoInitialize]);

  useEffect(() => {
    if (!orchestratorRef.current) return;

    const unsubscribe = orchestratorRef.current.subscribe('hook', (recs) => {
      setRecommendations(recs);
      setIsThinking(orchestratorRef.current?.isRecomputing() ?? false);
      setStats({
        totalRecs: recs.length,
        avgConfidence: recs.reduce((sum, r) => sum + r.confidence, 0) / (recs.length || 1),
        processingTime: 150
      });
    });

    return unsubscribe;
  }, []);

  const setPersonality = useCallback((p: AIPersonality) => {
    setPersonalityState(p);
    orchestratorRef.current?.setPersonality(p);
  }, []);

  const updateContext = useCallback(async (
    customerId: string,
    currentZoneId: string | undefined,
    position: Vector2 | undefined,
    shoppingList: ShoppingListItem[]
  ) => {
    setIsThinking(true);
    await orchestratorRef.current?.updateContext(customerId, currentZoneId, position, shoppingList);
  }, []);

  const recordSignal = useCallback((signal: {
    type: 'dwell' | 'view' | 'search' | 'hesitate' | 'skip' | 'pickup';
    zoneId?: string;
    productId?: string;
    intensity?: number;
  }) => {
    orchestratorRef.current?.recordBehavioralSignal(signal);
  }, []);

  const selectRecommendation = useCallback((rec: AIRecommendation | null) => {
    setSelectedRecommendation(rec);
  }, []);

  const generateExplanation = useCallback(async (recommendationId: string): Promise<string> => {
    return orchestratorRef.current?.generateExplanation(recommendationId) ?? '';
  }, []);

  const predictIntent = useCallback(async (): Promise<PredictionResult> => {
    const result = await orchestratorRef.current?.predictIntent() ?? {
      predictedIntent: 'unknown',
      confidence: 0,
      possibleNextProducts: [],
      forgottenItems: []
    };
    setPrediction(result);
    return result;
  }, []);

  const refresh = useCallback(() => {
    const recs = orchestratorRef.current?.getCurrentRecommendations() ?? [];
    setRecommendations(recs);
  }, []);

  return {
    recommendations,
    isLoading,
    isThinking,
    selectedRecommendation,
    prediction,
    personality,
    stats,
    setPersonality,
    updateContext,
    recordSignal,
    selectRecommendation,
    generateExplanation,
    predictIntent,
    refresh
  };
};

import { useState, useEffect, useCallback, useRef } from 'react';
import { brainOrchestrator } from '@brain/orchestrator/BrainOrchestrator';
import type {
  RetailSessionContext,
  BrainSignal,
  Predictions,
  SystemHealth,
  Decision
} from '@brain/types';

interface UseBrainEngineReturn {
  sessionContext: RetailSessionContext | null;
  predictions: Predictions | null;
  health: SystemHealth | null;
  recentDecisions: Decision[];
  cycleCount: number;
  isRunning: boolean;
  
  emitSignal: (signal: Omit<BrainSignal, 'id' | 'timestamp'>) => void;
  getContext: () => RetailSessionContext | null;
  refresh: () => void;
}

export const useBrainEngine = (): UseBrainEngineReturn => {
  const [sessionContext, setSessionContext] = useState<RetailSessionContext | null>(null);
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<Decision[]>([]);
  const [cycleCount, setCycleCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const decisionsRef = useRef<Decision[]>([]);

  useEffect(() => {
    const unsubContext = brainOrchestrator.on('context-updated', (ctx) => {
      setSessionContext(ctx);
    });

    const unsubPredictions = brainOrchestrator.on('predictions-updated', (pred) => {
      setPredictions(pred);
    });

    const unsubHealth = brainOrchestrator.on('health-update', (h) => {
      setHealth(h);
    });

    const unsubDecision = brainOrchestrator.on('decision-made', (decision) => {
      decisionsRef.current = [decision, ...decisionsRef.current].slice(0, 10);
      setRecentDecisions(decisionsRef.current);
    });

    const unsubCycle = brainOrchestrator.on('cognition-cycle', ({ cycle }) => {
      setCycleCount(cycle);
      setIsRunning(brainOrchestrator.isSystemRunning());
    });

    return () => {
      unsubContext();
      unsubPredictions();
      unsubHealth();
      unsubDecision();
      unsubCycle();
    };
  }, []);

  const emitSignal = useCallback((signal: Omit<BrainSignal, 'id' | 'timestamp'>) => {
    brainOrchestrator.emitSignal(signal);
  }, []);

  const getContext = useCallback(() => {
    return brainOrchestrator.getSessionContext();
  }, []);

  const refresh = useCallback(() => {
    setSessionContext(brainOrchestrator.getSessionContext());
    setHealth(brainOrchestrator.getSystemHealth());
    setCycleCount(brainOrchestrator.getCycleCount());
    setIsRunning(brainOrchestrator.isSystemRunning());
  }, []);

  return {
    sessionContext,
    predictions,
    health,
    recentDecisions,
    cycleCount,
    isRunning,
    emitSignal,
    getContext,
    refresh
  };
};

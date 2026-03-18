import { useState, useEffect, useCallback } from 'react';
import { demoOrchestrator } from '../orchestrator/DemoOrchestrator';
import type { DemoState, DemoPhase, NarrativeMoment } from '../types';

export const useDemo = () => {
  const [state, setState] = useState<DemoState>(demoOrchestrator.getState());
  const [currentPhase, setCurrentPhase] = useState<DemoPhase>('intro');
  const [narrative, setNarrative] = useState<NarrativeMoment[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubPhase = demoOrchestrator.on('phase-change', (phase) => {
      setCurrentPhase(phase);
    });

    const unsubNarrative = demoOrchestrator.on('narrative-add', (moment) => {
      setNarrative(prev => [...prev, moment]);
    });

    const unsubProgress = demoOrchestrator.on('progress-update', (p) => {
      setProgress(p);
    });

    return () => {
      unsubPhase();
      unsubNarrative();
      unsubProgress();
    };
  }, []);

  const startDemo = useCallback((scriptId?: string, mode?: 'manual' | 'auto') => {
    demoOrchestrator.startDemo(scriptId, mode);
    setState(demoOrchestrator.getState());
  }, []);

  const pauseDemo = useCallback(() => {
    demoOrchestrator.pauseDemo();
    setState(demoOrchestrator.getState());
  }, []);

  const resumeDemo = useCallback(() => {
    demoOrchestrator.resumeDemo();
    setState(demoOrchestrator.getState());
  }, []);

  return {
    state,
    currentPhase,
    narrative,
    progress,
    isPlaying: state.isPlaying,
    startDemo,
    pauseDemo,
    resumeDemo
  };
};

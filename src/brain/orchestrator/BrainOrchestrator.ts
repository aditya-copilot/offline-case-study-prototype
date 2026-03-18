import { EventEmitter } from '@core/utils/events';
import type {
  BrainSignal,
  RetailSessionContext,
  DecisionContext,
  Predictions,
  SystemHealth,
  Decision,
  AdaptationState
} from '../types';
import { ContextFusionEngine } from '../context-fusion/ContextFusionEngine';
import { DecisionEngine } from '../decision-engine/DecisionEngine';
import { PredictionEngine } from '../prediction/PredictionEngine';
import { MemoryManager } from '../memory/MemoryManager';
import { AdaptationEngine } from '../adaptation/AdaptationEngine';
import { ExplainabilityEngine } from '../explainability/ExplainabilityEngine';
import { HealthMonitor } from '../runtime/HealthMonitor';

interface BrainEvents {
  'signal-received': BrainSignal;
  'context-updated': RetailSessionContext;
  'decision-made': Decision;
  'predictions-updated': Predictions;
  'adaptation-changed': AdaptationState;
  'health-update': SystemHealth;
  'cognition-cycle': { cycle: number; duration: number };
}

export class BrainOrchestrator extends EventEmitter<BrainEvents> {
  private static instance: BrainOrchestrator;
  
  contextFusion: ContextFusionEngine;
  decisionEngine: DecisionEngine;
  predictionEngine: PredictionEngine;
  memoryManager: MemoryManager;
  adaptationEngine: AdaptationEngine;
  explainability: ExplainabilityEngine;
  healthMonitor: HealthMonitor;
  
  private sessionContext: RetailSessionContext | null = null;
  private signalQueue: BrainSignal[] = [];
  private cognitionCycle: ReturnType<typeof setInterval> | null = null;
  private cycleCount = 0;
  private isRunning = false;

  static getInstance(): BrainOrchestrator {
    if (!BrainOrchestrator.instance) {
      BrainOrchestrator.instance = new BrainOrchestrator();
    }
    return BrainOrchestrator.instance;
  }

  private constructor() {
    super();
    this.contextFusion = new ContextFusionEngine();
    this.decisionEngine = new DecisionEngine();
    this.predictionEngine = new PredictionEngine();
    this.memoryManager = new MemoryManager();
    this.adaptationEngine = new AdaptationEngine();
    this.explainability = new ExplainabilityEngine();
    this.healthMonitor = new HealthMonitor();
  }

  async initialize(customerId: string): Promise<void> {
    await this.memoryManager.initialize();
    
    this.sessionContext = {
      sessionId: `session-${Date.now()}`,
      customerId,
      startedAt: Date.now(),
      location: {
        position: { x: 0, y: 0 },
        accuracy: 0,
        lastUpdated: Date.now()
      },
      navigation: {
        progress: 0,
        deviationCount: 0
      },
      shopping: {
        list: [],
        collected: [],
        remaining: [],
        completionRate: 0
      },
      ai: {
        activeRecommendations: [],
        recommendationAcceptanceRate: 0
      },
      gamification: {
        profile: {} as any,
        activeMissions: [],
        currentEnergy: 100,
        engagementScore: 50
      },
      analytics: {
        zonesVisited: [],
        totalDwellTime: 0,
        productsViewed: [],
        searchQueries: [],
        interactionCount: 0
      },
      ui: {
        currentScreen: 'home',
        theme: 'dark',
        lastInteraction: Date.now(),
        interactionFrequency: 0
      }
    };

    const memory = await this.memoryManager.loadMemory(customerId);
    this.adaptationEngine.initialize(memory);
    
    this.startCognitionCycle();
    this.isRunning = true;
  }

  emitSignal(signal: Omit<BrainSignal, 'id' | 'timestamp'>): void {
    const fullSignal: BrainSignal = {
      ...signal,
      id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now()
    };

    this.signalQueue.push(fullSignal);
    this.emit('signal-received', fullSignal);
    
    if (signal.priority === 'critical') {
      this.processImmediate(fullSignal);
    }
  }

  private async processImmediate(signal: BrainSignal): Promise<void> {
    await this.processCognitionCycle();
  }

  private startCognitionCycle(): void {
    this.cognitionCycle = setInterval(async () => {
      const startTime = performance.now();
      await this.processCognitionCycle();
      const duration = performance.now() - startTime;
      
      this.cycleCount++;
      this.emit('cognition-cycle', { cycle: this.cycleCount, duration });
    }, 1000);
  }

  private async processCognitionCycle(): Promise<void> {
    if (!this.sessionContext) return;

    const signals = [...this.signalQueue];
    this.signalQueue = [];

    this.sessionContext = this.contextFusion.fuseContext(
      this.sessionContext,
      signals
    );

    const predictions = this.predictionEngine.generatePredictions(
      this.sessionContext,
      await this.memoryManager.getMemorySnapshot()
    );
    this.emit('predictions-updated', predictions);

    const decisionContext: DecisionContext = {
      timestamp: Date.now(),
      context: this.sessionContext,
      signals,
      predictions,
      memory: await this.memoryManager.getMemorySnapshot()
    };

    const decisions = this.decisionEngine.evaluate(decisionContext);
    
    for (const decision of decisions) {
      if (decision.confidence > 0.6) {
        this.emit('decision-made', decision);
        decision.action();
      }
    }

    const adaptation = this.adaptationEngine.adapt(
      this.sessionContext,
      predictions
    );
    this.emit('adaptation-changed', adaptation);

    await this.memoryManager.updateSessionMemory(
      this.sessionContext.customerId,
      this.sessionContext
    );

    this.emit('context-updated', this.sessionContext);

    const health = this.healthMonitor.checkHealth();
    this.emit('health-update', health);
  }

  getSessionContext(): RetailSessionContext | null {
    return this.sessionContext;
  }

  getSystemHealth(): SystemHealth {
    return this.healthMonitor.checkHealth();
  }

  getCycleCount(): number {
    return this.cycleCount;
  }

  isSystemRunning(): boolean {
    return this.isRunning;
  }

  destroy(): void {
    if (this.cognitionCycle) {
      clearInterval(this.cognitionCycle);
    }
    this.isRunning = false;
    this.removeAllListeners();
  }
}

export const brainOrchestrator = BrainOrchestrator.getInstance();

import { EventEmitter } from '@core/utils/events';
import type { DemoScript, DemoPhase, DemoMode, DemoState, NarrativeMoment, DemoAction } from '../types';
import { brainOrchestrator } from '@brain/orchestrator/BrainOrchestrator';
import { signalBus } from '@ble/signal-bus/SignalBus';
import { gamificationEngine } from '@gamification/engine/GamificationEngine';

interface DemoEvents {
  'phase-change': DemoPhase;
  'script-start': string;
  'script-end': string;
  'action-trigger': DemoAction;
  'narrative-add': NarrativeMoment;
  'progress-update': number;
  'demo-complete': void;
}

export class DemoOrchestrator extends EventEmitter<DemoEvents> {
  private static instance: DemoOrchestrator;
  
  private state: DemoState = {
    mode: 'manual',
    currentPhase: 'intro',
    currentScript: null,
    isPlaying: false,
    progress: 0,
    highlights: [],
    narrative: [],
    scores: {
      intelligence: 85,
      engagement: 78,
      efficiency: 92,
      overall: 85,
      projections: []
    }
  };
  
  private scripts: Map<string, DemoScript> = new Map();
  private currentActionIndex = 0;
  private actionTimeout: ReturnType<typeof setTimeout> | null = null;
  private phaseTimeout: ReturnType<typeof setTimeout> | null = null;

  static getInstance(): DemoOrchestrator {
    if (!DemoOrchestrator.instance) {
      DemoOrchestrator.instance = new DemoOrchestrator();
    }
    return DemoOrchestrator.instance;
  }

  private constructor() {
    super();
    this.registerDefaultScripts();
  }

  private registerDefaultScripts(): void {
    const defaultScript: DemoScript = {
      id: 'default-journey',
      name: 'Smart Store Journey',
      duration: 120000,
      autoAdvance: true,
      phases: [
        {
          phase: 'intro',
          duration: 10000,
          script: 'Welcome to the future of retail navigation.',
          actions: [],
          highlights: ['offline-autonomy']
        },
        {
          phase: 'demo',
          duration: 60000,
          script: 'Watch as our AI guides the customer through their shopping journey.',
          actions: [
            { type: 'ble-move', delay: 2000, data: { position: { x: 10, y: 10 } } },
            { type: 'zone-enter', delay: 5000, data: { zoneId: 'electronics' } },
            { type: 'ai-recommend', delay: 8000, data: { productId: 'prod-004' } },
            { type: 'route-calculate', delay: 12000, data: { waypoints: ['start', 'item1', 'checkout'] } },
            { type: 'reward-trigger', delay: 15000, data: { xp: 50 } }
          ],
          highlights: ['ai-intelligence', 'ble-spatial', 'smart-routing', 'gamification']
        },
        {
          phase: 'impact',
          duration: 30000,
          script: 'Our system delivers measurable business impact.',
          actions: [{ type: 'analytics-show', delay: 1000, data: { metric: 'efficiency', value: 92 } }],
          highlights: ['behavioral-analytics']
        },
        {
          phase: 'close',
          duration: 20000,
          script: 'This is the future of retail intelligence.',
          actions: [],
          highlights: []
        }
      ]
    };

    this.scripts.set(defaultScript.id, defaultScript);
  }

  startDemo(scriptId: string = 'default-journey', mode: DemoMode = 'auto'): void {
    const script = this.scripts.get(scriptId);
    if (!script) return;

    this.state.mode = mode;
    this.state.currentScript = scriptId;
    this.state.isPlaying = true;
    this.state.progress = 0;
    this.currentActionIndex = 0;

    this.emit('script-start', scriptId);
    this.addNarrative('Demo Started', 'Beginning the smart store journey demonstration.', 'excitement');

    if (mode === 'auto') {
      this.runAutoDemo(script);
    }
  }

  private runAutoDemo(script: DemoScript): void {
    let phaseIndex = 0;
    
    const runNextPhase = () => {
      if (phaseIndex >= script.phases.length) {
        this.completeDemo();
        return;
      }

      const phase = script.phases[phaseIndex];
      this.setPhase(phase.phase);
      
      phase.actions.forEach((action, index) => {
        this.actionTimeout = setTimeout(() => {
          this.executeAction(action);
        }, action.delay);
      });

      this.phaseTimeout = setTimeout(() => {
        phaseIndex++;
        this.state.progress = (phaseIndex / script.phases.length) * 100;
        this.emit('progress-update', this.state.progress);
        runNextPhase();
      }, phase.duration);
    };

    runNextPhase();
  }

  private executeAction(action: DemoAction): void {
    switch (action.type) {
      case 'ble-move':
        signalBus.emit('position-estimate', { data: action.data });
        break;
      case 'zone-enter':
        signalBus.emit('zone-change', { data: { ...action.data, confidence: 0.95 } });
        this.addNarrative('Zone Detected', 'BLE sensors identify customer location.', 'curiosity');
        break;
      case 'ai-recommend':
        brainOrchestrator.emitSignal({
          type: 'recommendation_generated',
          source: 'ai',
          data: action.data,
          priority: 'medium',
          confidence: 0.85
        });
        this.addNarrative('AI Recommendation', 'Personalized product suggestion delivered.', 'wow');
        break;
      case 'route-calculate':
        brainOrchestrator.emitSignal({
          type: 'route_calculated',
          source: 'navigation',
          data: action.data,
          priority: 'high',
          confidence: 0.92
        });
        this.addNarrative('Route Optimized', 'Smart path calculated for efficiency.', 'satisfaction');
        break;
      case 'reward-trigger':
        const xp = (action.data as { xp: number }).xp;
        gamificationEngine.gainXp(xp, 'Demo Achievement');
        this.addNarrative('Reward Unlocked', 'Gamification increases engagement.', 'excitement');
        break;
    }
    
    this.emit('action-trigger', action);
  }

  setPhase(phase: DemoPhase): void {
    this.state.currentPhase = phase;
    this.emit('phase-change', phase);
  }

  private addNarrative(title: string, description: string, emotion: NarrativeMoment['emotion']): void {
    const moment: NarrativeMoment = {
      id: `nar-${Date.now()}`,
      timestamp: Date.now(),
      title,
      description,
      emotion
    };
    
    this.state.narrative.push(moment);
    this.emit('narrative-add', moment);
  }

  pauseDemo(): void {
    this.state.isPlaying = false;
    if (this.actionTimeout) clearTimeout(this.actionTimeout);
    if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
  }

  resumeDemo(): void {
    this.state.isPlaying = true;
  }

  completeDemo(): void {
    this.state.isPlaying = false;
    this.state.progress = 100;
    this.addNarrative('Demo Complete', 'The future of retail is here.', 'satisfaction');
    this.emit('demo-complete');
    this.emit('script-end', this.state.currentScript || '');
  }

  getState(): DemoState {
    return { ...this.state };
  }

  registerScript(script: DemoScript): void {
    this.scripts.set(script.id, script);
  }
}

export const demoOrchestrator = DemoOrchestrator.getInstance();

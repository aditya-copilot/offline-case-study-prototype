export type DemoPhase = 'intro' | 'problem' | 'solution' | 'demo' | 'tech' | 'impact' | 'future' | 'close';

export type DemoMode = 'manual' | 'auto' | 'pitch';

export type KillerFeature = 
  | 'ai-intelligence' 
  | 'offline-autonomy' 
  | 'ble-spatial' 
  | 'smart-routing' 
  | 'behavioral-analytics' 
  | 'gamification';

export interface DemoScript {
  id: string;
  name: string;
  phases: DemoPhaseConfig[];
  duration: number;
  autoAdvance: boolean;
}

export interface DemoPhaseConfig {
  phase: DemoPhase;
  duration: number;
  script: string;
  actions: DemoAction[];
  highlights: KillerFeature[];
}

export interface DemoAction {
  type: 'ble-move' | 'zone-enter' | 'ai-recommend' | 'route-calculate' | 'reward-trigger' | 'analytics-show';
  delay: number;
  data: unknown;
}

export interface FeatureHighlight {
  feature: KillerFeature;
  title: string;
  description: string;
  impact: string;
  metrics: { label: string; value: string }[];
  position: { x: number; y: number };
}

export interface InnovationScore {
  intelligence: number;
  engagement: number;
  efficiency: number;
  overall: number;
  projections: {
    label: string;
    current: number;
    projected: number;
    timeline: string;
  }[];
}

export interface NarrativeMoment {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  emotion: 'excitement' | 'curiosity' | 'satisfaction' | 'wow';
  feature?: KillerFeature;
}

export interface WowFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  readiness: 'ready' | 'beta' | 'roadmap';
  impact: string;
}

export interface PitchSlide {
  id: string;
  phase: DemoPhase;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  background?: string;
  duration: number;
}

export interface DemoState {
  mode: DemoMode;
  currentPhase: DemoPhase;
  currentScript: string | null;
  isPlaying: boolean;
  progress: number;
  highlights: FeatureHighlight[];
  narrative: NarrativeMoment[];
  scores: InnovationScore;
}

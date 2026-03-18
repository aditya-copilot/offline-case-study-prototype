import type { BrainSignal, RetailSessionContext } from '../types';

export class ContextFusionEngine {
  fuseContext(
    currentContext: RetailSessionContext,
    signals: BrainSignal[]
  ): RetailSessionContext {
    const context = { ...currentContext };
    
    for (const signal of signals) {
      switch (signal.type) {
        case 'position_updated':
          if (signal.data && typeof signal.data === 'object') {
            const pos = signal.data as { x: number; y: number; accuracy: number };
            context.location.position = { x: pos.x, y: pos.y };
            context.location.accuracy = pos.accuracy;
            context.location.lastUpdated = signal.timestamp;
          }
          break;
          
        case 'zone_changed':
          if (signal.data && typeof signal.data === 'object') {
            const zoneData = signal.data as { zoneId: string };
            context.analytics.zonesVisited.push(zoneData.zoneId);
          }
          break;
          
        case 'ui_interaction':
          context.ui.lastInteraction = signal.timestamp;
          context.analytics.interactionCount++;
          break;
          
        case 'route_calculated':
          if (signal.data && typeof signal.data === 'object') {
            context.navigation.currentRoute = (signal.data as { route: unknown }).route as any;
          }
          break;
      }
    }
    
    return context;
  }
}

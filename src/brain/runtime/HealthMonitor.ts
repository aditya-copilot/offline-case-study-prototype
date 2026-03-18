import type { SystemHealth, ModuleHealth } from '../types';

export class HealthMonitor {
  private modules: Map<string, ModuleHealth> = new Map();
  private startTime: number = Date.now();

  registerModule(name: string): void {
    this.modules.set(name, {
      name,
      status: 'online',
      lastPing: Date.now(),
      latency: 0,
      errorCount: 0
    });
  }

  pingModule(name: string, latency: number): void {
    const module = this.modules.get(name);
    if (module) {
      module.lastPing = Date.now();
      module.latency = latency;
    }
  }

  reportError(moduleName: string): void {
    const module = this.modules.get(moduleName);
    if (module) {
      module.errorCount++;
      if (module.errorCount > 5) {
        module.status = 'degraded';
      }
      if (module.errorCount > 10) {
        module.status = 'offline';
      }
    }
  }

  checkHealth(): SystemHealth {
    let onlineCount = 0;
    let degradedCount = 0;
    let offlineCount = 0;

    for (const module of this.modules.values()) {
      const timeSincePing = Date.now() - module.lastPing;
      if (timeSincePing > 5000 && module.status === 'online') {
        module.status = 'degraded';
      }

      if (module.status === 'online') onlineCount++;
      else if (module.status === 'degraded') degradedCount++;
      else offlineCount++;
    }

    const total = this.modules.size || 1;
    const healthRatio = (onlineCount + degradedCount * 0.5) / total;

    return {
      timestamp: Date.now(),
      modules: this.modules,
      overallStatus: healthRatio > 0.8 ? 'healthy' : healthRatio > 0.5 ? 'degraded' : 'critical',
      signalConfidence: healthRatio,
      cycleTime: Date.now() - this.startTime,
      memoryUsage: performance.memory?.usedJSHeapSize || 0
    };
  }
}

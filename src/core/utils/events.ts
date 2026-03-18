export type EventHandler<T = void> = (data: T) => void;

export class EventEmitter<Events extends Record<string, any> = {}> {
  private listeners: { [K in keyof Events]?: EventHandler<Events[K]>[] } = {};

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler);

    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    if (!this.listeners[event]) return;
    const index = this.listeners[event]!.indexOf(handler);
    if (index > -1) {
      this.listeners[event]!.splice(index, 1);
    }
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    if (!this.listeners[event]) return;
    this.listeners[event]!.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error);
      }
    });
  }

  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    const onceHandler: EventHandler<Events[K]> = (data) => {
      this.off(event, onceHandler);
      handler(data);
    };
    return this.on(event, onceHandler);
  }

  removeAllListeners<K extends keyof Events>(event?: K): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return this.listeners[event]?.length || 0;
  }

  hasListeners<K extends keyof Events>(event: K): boolean {
    return this.listenerCount(event) > 0;
  }
}

export const createEventEmitter = <Events extends Record<string, any> = {}>(): EventEmitter<Events> => {
  return new EventEmitter<Events>();
};

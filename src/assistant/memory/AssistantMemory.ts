import { cacheRepo } from '@services/db';
import type {
  AssistantMemory,
  AssistantMessage,
  AssistantContext,
  AssistantIntent,
  UserPreferenceContext
} from '../types';

interface MemoryEntry {
  id: string;
  timestamp: number;
  sessionId: string;
  type: 'message' | 'context' | 'preference';
  data: unknown;
}

interface SessionData {
  id: string;
  startedAt: number;
  lastActivity: number;
  messages: AssistantMessage[];
  context: AssistantContext;
  preferences: Record<string, unknown>;
}

const MEMORY_CACHE_KEY = 'assistant:memory';
const SESSION_CACHE_KEY = 'assistant:session';
const MAX_SESSION_MESSAGES = 100;
const MAX_MEMORY_ENTRIES = 1000;
const SESSION_TIMEOUT = 30 * 60 * 1000;

export class AssistantMemoryManager {
  private static instance: AssistantMemoryManager;
  private currentSession: SessionData | null = null;
  private memoryBuffer: MemoryEntry[] = [];
  private initialized = false;

  private constructor() {}

  static getInstance(): AssistantMemoryManager {
    if (!AssistantMemoryManager.instance) {
      AssistantMemoryManager.instance = new AssistantMemoryManager();
    }
    return AssistantMemoryManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadSession();
    await this.loadMemoryBuffer();

    this.currentSession = await this.createSession();
    this.initialized = true;
  }

  private async createSession(): Promise<SessionData> {
    const sessionId = this.generateSessionId();
    const session: SessionData = {
      id: sessionId,
      startedAt: Date.now(),
      lastActivity: Date.now(),
      messages: [],
      context: {
        viewedVehicles: [],
        searchHistory: [],
        intent: 'general-chat',
        confidence: 1.0,
        sessionDuration: 0,
        userPreferences: {
          preferredBrands: [],
          priorityFeatures: []
        }
      },
      preferences: {}
    };

    await this.saveSession(session);
    return session;
  }

  private async loadSession(): Promise<void> {
    try {
      const saved = await cacheRepo.get<SessionData>(SESSION_CACHE_KEY);
      if (saved) {
        const timeSinceLastActivity = Date.now() - saved.lastActivity;
        if (timeSinceLastActivity < SESSION_TIMEOUT) {
          this.currentSession = saved;
        }
      }
    } catch {
      return;
    }
  }

  private async saveSession(session: SessionData): Promise<void> {
    try {
      await cacheRepo.set(SESSION_CACHE_KEY, session, SESSION_TIMEOUT);
    } catch {
      return;
    }
  }

  private async loadMemoryBuffer(): Promise<void> {
    try {
      const saved = await cacheRepo.get<MemoryEntry[]>(MEMORY_CACHE_KEY);
      if (saved) {
        this.memoryBuffer = saved.slice(-MAX_MEMORY_ENTRIES);
      }
    } catch {
      return;
    }
  }

  private async saveMemoryBuffer(): Promise<void> {
    try {
      const trimmed = this.memoryBuffer.slice(-MAX_MEMORY_ENTRIES);
      await cacheRepo.set(MEMORY_CACHE_KEY, trimmed, 7 * 24 * 60 * 60 * 1000);
    } catch {
      return;
    }
  }

  async addMessage(message: AssistantMessage): Promise<void> {
    if (!this.currentSession) {
      await this.initialize();
    }

    if (this.currentSession) {
      this.currentSession.messages.push(message);
      this.currentSession.lastActivity = Date.now();

      if (this.currentSession.messages.length > MAX_SESSION_MESSAGES) {
        this.currentSession.messages = this.currentSession.messages.slice(-MAX_SESSION_MESSAGES);
      }

      await this.saveSession(this.currentSession);

      const entry: MemoryEntry = {
        id: this.generateId(),
        timestamp: Date.now(),
        sessionId: this.currentSession.id,
        type: 'message',
        data: message
      };

      this.memoryBuffer.push(entry);
      await this.saveMemoryBuffer();
    }
  }

  async updateContext(context: Partial<AssistantContext>): Promise<void> {
    if (!this.currentSession) {
      await this.initialize();
    }

    if (this.currentSession) {
      this.currentSession.context = {
        ...this.currentSession.context,
        ...context,
        sessionDuration: Date.now() - this.currentSession.startedAt
      };
      this.currentSession.lastActivity = Date.now();

      await this.saveSession(this.currentSession);

      const entry: MemoryEntry = {
        id: this.generateId(),
        timestamp: Date.now(),
        sessionId: this.currentSession.id,
        type: 'context',
        data: this.currentSession.context
      };

      this.memoryBuffer.push(entry);
      await this.saveMemoryBuffer();
    }
  }

  async learnPreference(key: string, value: unknown): Promise<void> {
    if (!this.currentSession) {
      await this.initialize();
    }

    if (this.currentSession) {
      this.currentSession.preferences[key] = value;
      this.currentSession.lastActivity = Date.now();

      await this.saveSession(this.currentSession);

      const entry: MemoryEntry = {
        id: this.generateId(),
        timestamp: Date.now(),
        sessionId: this.currentSession.id,
        type: 'preference',
        data: { key, value }
      };

      this.memoryBuffer.push(entry);
      await this.saveMemoryBuffer();
    }
  }

  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  getSessionMessages(): AssistantMessage[] {
    return this.currentSession?.messages ?? [];
  }

  getSessionContext(): AssistantContext | null {
    return this.currentSession?.context ?? null;
  }

  getRecentMessages(count: number = 10): AssistantMessage[] {
    const messages = this.currentSession?.messages ?? [];
    return messages.slice(-count);
  }

  getLearnedPreferences(): Record<string, unknown> {
    return this.currentSession?.preferences ?? {};
  }

  getUserPreferences(): UserPreferenceContext {
    return (
      this.currentSession?.context.userPreferences ?? {
        preferredBrands: [],
        priorityFeatures: []
      }
    );
  }

  async addViewedVehicle(vehicleId: string): Promise<void> {
    const current = this.getSessionContext();
    if (current) {
      const viewed = new Set(current.viewedVehicles);
      viewed.add(vehicleId);
      await this.updateContext({
        viewedVehicles: Array.from(viewed)
      });
    }
  }

  async addSearchQuery(query: string): Promise<void> {
    const current = this.getSessionContext();
    if (current) {
      const history = [...current.searchHistory, query].slice(-20);
      await this.updateContext({
        searchHistory: history
      });
    }
  }

  async setIntent(intent: AssistantIntent, confidence: number): Promise<void> {
    await this.updateContext({
      intent,
      confidence
    });
  }

  async updateUserPreferences(preferences: Partial<UserPreferenceContext>): Promise<void> {
    const current = this.getUserPreferences();
    await this.updateContext({
      userPreferences: {
        ...current,
        ...preferences
      }
    });
  }

  async clearSession(): Promise<void> {
    this.currentSession = await this.createSession();
    await this.saveSession(this.currentSession);
  }

  async exportSession(): Promise<string> {
    if (!this.currentSession) {
      return '{}';
    }

    return JSON.stringify({
      session: this.currentSession,
      exportedAt: Date.now()
    });
  }

  async importSession(data: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(data);
      if (parsed.session) {
        this.currentSession = {
          ...parsed.session,
          lastActivity: Date.now()
        };
        if (this.currentSession) {
          await this.saveSession(this.currentSession);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  getMemoryStats(): {
    totalEntries: number;
    sessionMessageCount: number;
    sessionDuration: number;
    preferenceCount: number;
  } {
    return {
      totalEntries: this.memoryBuffer.length,
      sessionMessageCount: this.currentSession?.messages.length ?? 0,
      sessionDuration: this.currentSession
        ? Date.now() - this.currentSession.startedAt
        : 0,
      preferenceCount: Object.keys(this.currentSession?.preferences ?? {}).length
    };
  }

  async cleanup(): Promise<void> {
    const cutoff = Date.now() - SESSION_TIMEOUT;
    this.memoryBuffer = this.memoryBuffer.filter((entry) => entry.timestamp > cutoff);
    await this.saveMemoryBuffer();
  }

  private generateSessionId(): string {
    return `session-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateId(): string {
    return `mem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const assistantMemory = AssistantMemoryManager.getInstance();

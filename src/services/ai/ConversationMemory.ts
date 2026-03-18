import type { AssistantMessage, AssistantIntent } from '@assistant/types';

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    intent?: AssistantIntent;
    confidence?: number;
    vehicleIds?: string[];
    actions?: Array<{ type: string; label: string; payload: unknown }>;
  };
}

export interface ConversationSession {
  id: string;
  turns: ConversationTurn[];
  startTime: number;
  lastActivityTime: number;
  context: {
    viewedVehicles: string[];
    searchQueries: string[];
    extractedPreferences: {
      budgetRange?: { min: number; max: number };
      fuelType?: string;
      bodyStyle?: string;
      brands?: string[];
      features?: string[];
      useCase?: string;
    };
    currentTopic?: string;
  };
}

export interface MemorySearchResult {
  turns: ConversationTurn[];
  relevance: number;
}

const MAX_TURNS_PER_SESSION = 50;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_SESSIONS = 10;

class ConversationMemory {
  private sessions: Map<string, ConversationSession> = new Map();
  private currentSessionId: string | null = null;
  private storageKey = 'ai_conversation_memory';

  constructor() {
    this.loadFromStorage();
    this.startCleanupInterval();
  }

  startNewSession(): string {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const session: ConversationSession = {
      id: sessionId,
      turns: [],
      startTime: now,
      lastActivityTime: now,
      context: {
        viewedVehicles: [],
        searchQueries: [],
        extractedPreferences: {}
      }
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    this.enforceSessionLimit();
    this.saveToStorage();

    return sessionId;
  }

  addTurn(turn: Omit<ConversationTurn, 'id' | 'timestamp'>): ConversationTurn {
    const session = this.getOrCreateCurrentSession();
    const fullTurn: ConversationTurn = {
      ...turn,
      id: this.generateTurnId(),
      timestamp: Date.now()
    };

    session.turns.push(fullTurn);
    session.lastActivityTime = Date.now();

    if (session.turns.length > MAX_TURNS_PER_SESSION) {
      session.turns = session.turns.slice(-MAX_TURNS_PER_SESSION);
    }

    this.extractAndUpdateContext(session, fullTurn);
    this.saveToStorage();

    return fullTurn;
  }

  getRecentTurns(count = 10): ConversationTurn[] {
    const session = this.getCurrentSession();
    if (!session) return [];

    return session.turns.slice(-count);
  }

  getContextForPrompt(maxTurns = 6): Array<{ role: string; content: string }> {
    const turns = this.getRecentTurns(maxTurns);

    return turns.map(turn => ({
      role: turn.role,
      content: turn.content
    }));
  }

  searchMemory(query: string, maxResults = 5): MemorySearchResult[] {
    const results: MemorySearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const session of this.sessions.values()) {
      for (const turn of session.turns) {
        if (turn.role === 'assistant') continue;

        const contentLower = turn.content.toLowerCase();
        const relevance = this.calculateRelevance(queryLower, contentLower);

        if (relevance > 0.3) {
          results.push({
            turns: this.getConversationThread(session.id, turn.id),
            relevance
          });
        }
      }
    }

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxResults);
  }

  getConversationThread(sessionId: string, turnId: string): ConversationTurn[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const turnIndex = session.turns.findIndex(t => t.id === turnId);
    if (turnIndex === -1) return [];

    const threadLength = 3;
    const startIndex = Math.max(0, turnIndex - threadLength + 1);

    return session.turns.slice(startIndex, turnIndex + 1);
  }

  getExtractedPreferences(): ConversationSession['context']['extractedPreferences'] {
    const session = this.getCurrentSession();
    return session?.context.extractedPreferences || {};
  }

  addViewedVehicle(vehicleId: string): void {
    const session = this.getOrCreateCurrentSession();
    if (!session.context.viewedVehicles.includes(vehicleId)) {
      session.context.viewedVehicles.push(vehicleId);
      this.saveToStorage();
    }
  }

  getViewedVehicles(): string[] {
    const session = this.getCurrentSession();
    return session?.context.viewedVehicles || [];
  }

  addSearchQuery(query: string): void {
    const session = this.getOrCreateCurrentSession();
    session.context.searchQueries.push(query);
    if (session.context.searchQueries.length > 20) {
      session.context.searchQueries = session.context.searchQueries.slice(-20);
    }
    this.saveToStorage();
  }

  getSearchQueries(): string[] {
    const session = this.getCurrentSession();
    return session?.context.searchQueries || [];
  }

  getCurrentSession(): ConversationSession | null {
    if (!this.currentSessionId) return null;
    return this.sessions.get(this.currentSessionId) || null;
  }

  private getOrCreateCurrentSession(): ConversationSession {
    let session = this.getCurrentSession();

    if (!session || this.isSessionExpired(session)) {
      this.startNewSession();
      session = this.getCurrentSession()!;
    }

    return session;
  }

  private isSessionExpired(session: ConversationSession): boolean {
    return Date.now() - session.lastActivityTime > SESSION_TIMEOUT_MS;
  }

  private extractAndUpdateContext(session: ConversationSession, turn: ConversationTurn): void {
    if (turn.role !== 'user') return;

    const content = turn.content.toLowerCase();

    const priceMatch = content.match(/(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*(k|thousand|lakh)?/i);
    if (priceMatch) {
      let price = parseFloat(priceMatch[1]);
      const unit = priceMatch[2]?.toLowerCase();
      if (unit === 'lakh') price *= 100000;
      else if (unit === 'k' || unit === 'thousand') price *= 1000;

      if (!session.context.extractedPreferences.budgetRange) {
        session.context.extractedPreferences.budgetRange = { min: 0, max: price * 1.2 };
      }
    }

    if (/electric|ev|battery/.test(content)) {
      session.context.extractedPreferences.fuelType = 'Electric';
    } else if (/petrol/.test(content)) {
      session.context.extractedPreferences.fuelType = 'Petrol';
    }

    if (/scooter/.test(content)) {
      session.context.extractedPreferences.bodyStyle = 'Scooter';
    } else if (/sports|bike/.test(content)) {
      session.context.extractedPreferences.bodyStyle = 'Sports';
    } else if (/cruiser/.test(content)) {
      session.context.extractedPreferences.bodyStyle = 'Cruiser';
    }

    const brands = ['hero', 'honda', 'tvs', 'bajaj', 'royal enfield', 'yamaha', 'suzuki', 'ktm'];
    const foundBrands = brands.filter(b => content.includes(b));
    if (foundBrands.length > 0) {
      session.context.extractedPreferences.brands = [
        ...(session.context.extractedPreferences.brands || []),
        ...foundBrands
      ];
    }

    const features = ['abs', 'disc brake', 'bluetooth', 'gps', 'led'];
    const foundFeatures = features.filter(f => content.includes(f));
    if (foundFeatures.length > 0) {
      session.context.extractedPreferences.features = [
        ...(session.context.extractedPreferences.features || []),
        ...foundFeatures
      ];
    }
  }

  private calculateRelevance(query: string, content: string): number {
    const queryWords = query.split(/\s+/).filter(w => w.length > 2);
    const contentWords = content.split(/\s+/);

    let matches = 0;
    for (const word of queryWords) {
      if (contentWords.some(cw => cw.includes(word) || word.includes(cw))) {
        matches++;
      }
    }

    return matches / Math.max(queryWords.length, 1);
  }

  private enforceSessionLimit(): void {
    if (this.sessions.size <= MAX_SESSIONS) return;

    const sortedSessions = Array.from(this.sessions.values())
      .sort((a, b) => a.lastActivityTime - b.lastActivityTime);

    const toDelete = sortedSessions.slice(0, this.sessions.size - MAX_SESSIONS);
    for (const session of toDelete) {
      this.sessions.delete(session.id);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTurnId(): string {
    return `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [id, session] of this.sessions) {
        if (now - session.lastActivityTime > SESSION_TIMEOUT_MS) {
          this.sessions.delete(id);
        }
      }
      this.saveToStorage();
    }, 5 * 60 * 1000);
  }

  private saveToStorage(): void {
    try {
      const data = {
        sessions: Array.from(this.sessions.entries()),
        currentSessionId: this.currentSessionId
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Storage might be full or unavailable
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      if (data.sessions) {
        this.sessions = new Map(data.sessions);
      }
      if (data.currentSessionId) {
        this.currentSessionId = data.currentSessionId;
      }
    } catch {
      // Invalid or no stored data
    }
  }

  clearCurrentSession(): void {
    if (this.currentSessionId) {
      this.sessions.delete(this.currentSessionId);
      this.currentSessionId = null;
      this.saveToStorage();
    }
  }

  clearAllSessions(): void {
    this.sessions.clear();
    this.currentSessionId = null;
    this.saveToStorage();
  }

  getStats(): {
    totalSessions: number;
    currentSessionTurns: number;
    viewedVehicles: number;
    searchQueries: number;
  } {
    const currentSession = this.getCurrentSession();
    return {
      totalSessions: this.sessions.size,
      currentSessionTurns: currentSession?.turns.length || 0,
      viewedVehicles: currentSession?.context.viewedVehicles.length || 0,
      searchQueries: currentSession?.context.searchQueries.length || 0
    };
  }
}

export const conversationMemory = new ConversationMemory();
export default conversationMemory;

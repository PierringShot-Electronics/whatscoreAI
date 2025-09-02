const { logWithTimestamp } = require('../utils/logger');
const { EventEmitter } = require('events');

class SessionManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    this.agentStates = new Map();
    this.contextWindow = 20; // Messages before context refresh
    this.personalityCache = new Map();
  }

  createSession(chatId) {
    const s = {
      chatId,
      history: [],
      activeWorkflow: null,
      currentState: null,
      workflowContext: {},
      messageCount: 0,
      lastAnalysis: new Date().toISOString(),
      personalityProfile: null,
      activeAgents: new Set(),
      emotionalState: { valence: 0, arousal: 0, dominance: 0 },
      intentHistory: [],
      contextualMemory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(chatId, s);
    return s;
  }

  async getSession(chatId) {
    const s = this.sessions.get(chatId);
    if (!s) return this.createSession(chatId);
    
    // Check if personality analysis is needed
    if (s.messageCount >= this.contextWindow) {
      await this.analyzePersonality(chatId);
      s.messageCount = 0;
    }
    
    return s;
  }

  async saveSession(chatId, patch) {
    const s = await this.getSession(chatId);
    
    // Update message count and check for analysis
    if (patch.history && patch.history.length > s.history.length) {
      s.messageCount += patch.history.length - s.history.length;
    }
    
    // Deep merge contextual memory
    if (patch.contextualMemory) {
      s.contextualMemory = [...s.contextualMemory, ...patch.contextualMemory]
        .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 100); // Keep top 100 memories
    }
    
    Object.assign(s, patch, { updatedAt: new Date().toISOString() });
    this.sessions.set(chatId, s);
    
    // Emit events for active agents
    this.emit('sessionUpdated', { chatId, changes: patch });
    
    return s;
  }

  removeSession(chatId) {
    const session = this.sessions.get(chatId);
    if (session) {
      // Clean up agent states
      session.activeAgents.forEach(agentId => {
        const agentState = this.agentStates.get(agentId);
        if (agentState) {
          agentState.sessions.delete(chatId);
        }
      });
    }
    this.sessions.delete(chatId);
    this.emit('sessionRemoved', chatId);
  }

  async analyzePersonality(chatId) {
    const session = await this.getSession(chatId);
    const recentMessages = session.history.slice(-this.contextWindow);
    
    // Perform deep personality analysis
    const analysis = {
      traits: await this.analyzeTraits(recentMessages),
      interests: await this.analyzeInterests(recentMessages),
      communication: await this.analyzeCommunicationStyle(recentMessages),
      emotional: await this.analyzeEmotionalPatterns(recentMessages)
    };
    
    // Update session with new analysis
    session.personalityProfile = analysis;
    session.lastAnalysis = new Date().toISOString();
    
    // Cache personality insights
    this.personalityCache.set(chatId, {
      timestamp: Date.now(),
      profile: analysis
    });
    
    this.emit('personalityAnalyzed', { chatId, analysis });
    return analysis;
  }

  async registerAgent(agentId, capabilities) {
    if (!this.agentStates.has(agentId)) {
      this.agentStates.set(agentId, {
        id: agentId,
        capabilities,
        sessions: new Set(),
        status: 'ready',
        lastActive: new Date().toISOString()
      });
    }
    return this.agentStates.get(agentId);
  }

  async activateAgent(chatId, agentId) {
    const session = await this.getSession(chatId);
    const agentState = this.agentStates.get(agentId);
    
    if (agentState) {
      session.activeAgents.add(agentId);
      agentState.sessions.add(chatId);
      agentState.lastActive = new Date().toISOString();
      this.emit('agentActivated', { chatId, agentId });
    }
  }

  listSessions() { 
    return Array.from(this.sessions.values())
      .map(s => ({
        ...s,
        activeAgents: Array.from(s.activeAgents),
        metrics: this.calculateSessionMetrics(s)
      }));
  }

  calculateSessionMetrics(session) {
    return {
      messageFrequency: session.history.length / 
        ((new Date(session.updatedAt) - new Date(session.createdAt)) / (1000 * 60 * 60)),
      engagementScore: this.calculateEngagement(session),
      sentimentTrend: this.analyzeSentimentTrend(session.history),
      topIntents: this.getTopIntents(session.intentHistory)
    };
  }
}

module.exports = new SessionManager();

/**
 * WhatsCore.AI - Maverick Edition
 * Agent Coordinator Service - Manages multi-agent orchestration
 */
const EventEmitter = require('events');
const sessionManager = require('./sessionManager');
const vectorStore = require('./vectorStore');
const { logWithTimestamp } = require('../utils/logger');

class AgentCoordinator extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.pipelines = new Map();
    this.subscriptions = new Map();
  }

  registerAgent(agentConfig) {
    const { id, capabilities, priority, triggers } = agentConfig;
    
    this.agents.set(id, {
      id,
      capabilities,
      priority,
      triggers,
      status: 'ready',
      metrics: {
        invocations: 0,
        successRate: 1,
        avgResponseTime: 0,
        lastActive: null
      }
    });

    // Set up event subscriptions
    if (triggers) {
      triggers.forEach(trigger => {
        if (!this.subscriptions.has(trigger)) {
          this.subscriptions.set(trigger, new Set());
        }
        this.subscriptions.get(trigger).add(id);
      });
    }

    return this.agents.get(id);
  }

  async dispatchEvent(eventType, payload) {
    const subscribers = this.subscriptions.get(eventType) || new Set();
    const results = [];

    for (const agentId of subscribers) {
      const agent = this.agents.get(agentId);
      if (!agent || agent.status !== 'ready') continue;

      try {
        const startTime = Date.now();
        const result = await this.invokeAgent(agentId, payload);
        
        // Update metrics
        const duration = Date.now() - startTime;
        agent.metrics.invocations++;
        agent.metrics.avgResponseTime = 
          (agent.metrics.avgResponseTime * (agent.metrics.invocations - 1) + duration) / 
          agent.metrics.invocations;
        agent.metrics.lastActive = new Date().toISOString();
        
        results.push({ agentId, result });
      } catch (error) {
        logWithTimestamp(`❌ Agent ${agentId} error:`, error.message);
        agent.metrics.successRate = 
          (agent.metrics.successRate * (agent.metrics.invocations - 1) + 0) / 
          agent.metrics.invocations;
      }
    }

    return results;
  }

  async invokeAgent(agentId, context) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    // Check if agent can handle the context
    if (!this.canHandleContext(agent, context)) {
      throw new Error(`Agent ${agentId} cannot handle this context`);
    }

    // Prepare agent context with relevant knowledge
    const enrichedContext = await this.enrichContext(context, agent.capabilities);
    
    // Execute agent logic
    const result = await this.executeAgentLogic(agent, enrichedContext);
    
    // Broadcast results to interested agents
    this.emit('agentResult', { agentId, context, result });
    
    return result;
  }

  async enrichContext(context, capabilities) {
    const enriched = { ...context };

    // Add relevant knowledge from vector store
    if (capabilities.includes('knowledgeAccess')) {
      const relevant = await vectorStore.search(
        context.query || context.text,
        { limit: 5, threshold: 0.7 }
      );
      enriched.relevantKnowledge = relevant;
    }

    // Add personality insights if available
    if (capabilities.includes('personalityAware') && context.chatId) {
      const session = await sessionManager.getSession(context.chatId);
      enriched.personalityProfile = session.personalityProfile;
    }

    return enriched;
  }

  async executeAgentLogic(agent, context) {
    // Execute agent-specific logic based on capabilities
    const pipeline = this.pipelines.get(agent.id);
    if (pipeline) {
      return await pipeline(context);
    }

    // Default handling
    return {
      success: true,
      agentId: agent.id,
      timestamp: new Date().toISOString(),
      result: `Agent ${agent.id} processed context`
    };
  }

  canHandleContext(agent, context) {
    // Check if agent has required capabilities
    for (const requirement of (context.requirements || [])) {
      if (!agent.capabilities.includes(requirement)) {
        return false;
      }
    }
    return true;
  }

  setPipeline(agentId, pipeline) {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} not registered`);
    }
    this.pipelines.set(agentId, pipeline);
  }

  getAgentMetrics(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    return agent.metrics;
  }

  getSystemMetrics() {
    const metrics = {
      totalAgents: this.agents.size,
      activeAgents: 0,
      totalInvocations: 0,
      overallSuccessRate: 0,
      avgResponseTime: 0
    };

    for (const agent of this.agents.values()) {
      if (agent.status === 'ready') metrics.activeAgents++;
      metrics.totalInvocations += agent.metrics.invocations;
      metrics.overallSuccessRate += agent.metrics.successRate;
      metrics.avgResponseTime += agent.metrics.avgResponseTime;
    }

    if (this.agents.size > 0) {
      metrics.overallSuccessRate /= this.agents.size;
      metrics.avgResponseTime /= this.agents.size;
    }

    return metrics;
  }
}

module.exports = new AgentCoordinator();

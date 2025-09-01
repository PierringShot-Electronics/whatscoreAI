/**
 * WhatsCore.AI - Maverick Edition
 * Base Agent Class - Foundation for all specialized AI agents
 */
const EventEmitter = require('events');
const { logWithTimestamp } = require('../../utils/logger');

class BaseAgent extends EventEmitter {
  constructor(config) {
    super();
    this.id = config.id;
    this.type = config.type;
    this.capabilities = Array.isArray(config.capabilities) ? config.capabilities : [];
    this.state = {
      status: 'initializing',
      lastActive: null,
      context: {},
      metrics: {
        invocations: 0,
        successRate: 1,
        avgResponseTime: 0,
        errorRate: 0
      }
    };
    this.initialize(config);
  }

  async initialize(config) {
    try {
      await this.loadResources(config);
      this.state.status = 'ready';
      this.emit('ready', { agentId: this.id });
    } catch (error) {
      this.state.status = 'error';
      logWithTimestamp(`❌ Agent ${this.id} initialization error:`, error.message);
      this.emit('error', { agentId: this.id, error });
    }
  }

  async loadResources(config) {
    // Override in specific agents to load models, data, etc.
  }

  async process(input, context = {}) {
    const startTime = Date.now();
    try {
      this.state.lastActive = new Date().toISOString();
      this.state.metrics.invocations++;

      // Pre-processing
      const processedInput = await this.preProcess(input, context);
      
      // Main processing
      const result = await this.execute(processedInput, context);
      
      // Post-processing
      const finalResult = await this.postProcess(result, context);

      // Update metrics
      const duration = Date.now() - startTime;
      this.updateMetrics('success', duration);

      return finalResult;
    } catch (error) {
      this.updateMetrics('error', Date.now() - startTime);
      throw error;
    }
  }

  async preProcess(input, context) {
    // Override in specific agents for input preparation
    return input;
  }

  async execute(input, context) {
    // Override in specific agents for main logic
    throw new Error('Execute method must be implemented by specific agents');
  }

  async postProcess(result, context) {
    // Override in specific agents for result refinement
    return result;
  }

  updateMetrics(outcome, duration) {
    const metrics = this.state.metrics;
    metrics.avgResponseTime = 
      (metrics.avgResponseTime * (metrics.invocations - 1) + duration) / 
      metrics.invocations;
    
    if (outcome === 'error') {
      metrics.errorRate = 
        (metrics.errorRate * (metrics.invocations - 1) + 1) / 
        metrics.invocations;
      metrics.successRate = 1 - metrics.errorRate;
    } else {
      metrics.errorRate = 
        (metrics.errorRate * (metrics.invocations - 1)) / 
        metrics.invocations;
      metrics.successRate = 1 - metrics.errorRate;
    }
  }

  hasCapability(capability) {
    return this.capabilities.has(capability);
  }

  addCapability(capability) {
    this.capabilities.add(capability);
  }

  removeCapability(capability) {
    this.capabilities.delete(capability);
  }

  getMetrics() {
    return {
      ...this.state.metrics,
      lastActive: this.state.lastActive,
      status: this.state.status
    };
  }

  async shutdown() {
    this.state.status = 'shutting_down';
    try {
      await this.cleanup();
      this.state.status = 'shutdown';
      this.emit('shutdown', { agentId: this.id });
    } catch (error) {
      this.state.status = 'error';
      logWithTimestamp(`❌ Agent ${this.id} shutdown error:`, error.message);
      throw error;
    }
  }

  async cleanup() {
    // Override in specific agents to clean up resources
  }
}

module.exports = BaseAgent;

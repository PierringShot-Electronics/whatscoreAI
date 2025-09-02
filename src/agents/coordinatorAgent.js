/**
 * WhatsCore.AI - Maverick Edition
 * Coordinator Agent - Master controller for all AI agents
 */
const BaseAgent = require('./baseAgent');
const EventEmitter = require('events');
const vectorStore = require('../vectorStore');
const sessionManager = require('../sessionManager');

class CoordinatorAgent extends BaseAgent {
  constructor(config) {
    super({
      id: 'coordinator_agent',
      type: 'orchestrator',
      capabilities: [
        'agent_orchestration',
        'task_delegation',
        'context_management',
        'system_optimization',
        'performance_monitoring'
      ],
      ...config
    });

    this.agents = new Map();
    this.pipelines = new Map();
    this.activeWorkflows = new Map();
    this.metrics = new MetricsCollector();
    this.eventBus = new EventEmitter();

    // Configure event handlers
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.eventBus.on('agent:ready', this.handleAgentReady.bind(this));
    this.eventBus.on('agent:error', this.handleAgentError.bind(this));
    this.eventBus.on('workflow:start', this.handleWorkflowStart.bind(this));
    this.eventBus.on('workflow:end', this.handleWorkflowEnd.bind(this));
    this.eventBus.on('task:complete', this.handleTaskComplete.bind(this));
  }

  async registerAgent(agent) {
    // Register agent with coordinator
    this.agents.set(agent.id, {
      instance: agent,
      status: 'initializing',
      capabilities: agent.capabilities,
      metrics: {
        tasks: 0,
        successes: 0,
        failures: 0,
        avgResponseTime: 0
      }
    });

    // Initialize agent
    try {
      await agent.initialize();
      this.agents.get(agent.id).status = 'ready';
      this.eventBus.emit('agent:ready', { agentId: agent.id });
    } catch (error) {
      this.agents.get(agent.id).status = 'error';
      this.eventBus.emit('agent:error', { agentId: agent.id, error });
    }
  }

  async process(input, context) {
    // Create workflow for this request
    const workflow = await this.createWorkflow(input, context);

    // Execute workflow
    const result = await this.executeWorkflow(workflow);

    // Update metrics
    this.metrics.recordWorkflow(workflow, result);

    return result;
  }

  async createWorkflow(input, context) {
    const workflowId = generateId();
    
    // Analyze input and determine required capabilities
    const requirements = await this.analyzeRequirements(input);
    
    // Create task pipeline
    const pipeline = await this.createPipeline(requirements);
    
    // Create workflow context
    const workflow = {
      id: workflowId,
      input,
      context,
      requirements,
      pipeline,
      state: 'created',
      startTime: Date.now(),
      metrics: {}
    };

    this.activeWorkflows.set(workflowId, workflow);
    return workflow;
  }

  async executeWorkflow(workflow) {
    this.eventBus.emit('workflow:start', { workflowId: workflow.id });
    workflow.state = 'running';

    try {
      // Execute pipeline stages
      let intermediateResult = workflow.input;
      for (const stage of workflow.pipeline) {
        intermediateResult = await this.executeStage(stage, intermediateResult, workflow);
      }

      // Finalize workflow
      workflow.state = 'completed';
      workflow.endTime = Date.now();
      this.eventBus.emit('workflow:end', { 
        workflowId: workflow.id,
        success: true
      });

      return intermediateResult;
    } catch (error) {
      workflow.state = 'failed';
      workflow.error = error;
      workflow.endTime = Date.now();
      this.eventBus.emit('workflow:end', {
        workflowId: workflow.id,
        success: false,
        error
      });
      throw error;
    } finally {
      this.cleanupWorkflow(workflow);
    }
  }

  async executeStage(stage, input, workflow) {
    // Find best agent for this stage
    const agent = await this.selectAgent(stage.requirements);
    if (!agent) {
      throw new Error(`No agent available for requirements: ${stage.requirements}`);
    }

    // Prepare context for agent
    const agentContext = await this.prepareAgentContext(agent, input, workflow);

    // Execute agent task
    const startTime = Date.now();
    try {
      const result = await agent.instance.process(input, agentContext);
      
      // Update metrics
      this.updateAgentMetrics(agent.id, true, Date.now() - startTime);
      
      return result;
    } catch (error) {
      this.updateAgentMetrics(agent.id, false, Date.now() - startTime);
      throw error;
    }
  }

  async selectAgent(requirements) {
    let bestAgent = null;
    let bestScore = -1;

    for (const [id, agent] of this.agents) {
      if (agent.status !== 'ready') continue;

      const score = this.calculateAgentScore(agent, requirements);
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  calculateAgentScore(agent, requirements) {
    let score = 0;
    
    // Check capabilities match
    const capabilityMatch = requirements.capabilities.every(
      cap => agent.capabilities.includes(cap)
    );
    if (!capabilityMatch) return -1;
    
    // Calculate base score from metrics
    const metrics = agent.metrics;
    const successRate = metrics.successes / (metrics.tasks || 1);
    const loadFactor = this.calculateAgentLoad(agent);
    
    score += successRate * 0.4;
    score += (1 - loadFactor) * 0.3;
    
    // Add bonus for specialized capabilities
    const specializationScore = this.calculateSpecializationScore(
      agent.capabilities,
      requirements.capabilities
    );
    score += specializationScore * 0.3;
    
    return score;
  }

  async analyzeRequirements(input) {
    const requirements = {
      capabilities: new Set(),
      priority: 'normal',
      constraints: {}
    };

    // Analyze input type
    if (input.media) {
      requirements.capabilities.add('media_processing');
      requirements.capabilities.add(input.media.type + '_processing');
    }

    if (input.text) {
      requirements.capabilities.add('text_processing');
      
      // Check for specific requirements in text
      if (input.text.includes('product')) {
        requirements.capabilities.add('product_knowledge');
      }
      if (input.text.includes('price')) {
        requirements.capabilities.add('price_calculation');
      }
    }

    // Add context-based requirements
    if (input.context) {
      if (input.context.personalityProfile) {
        requirements.capabilities.add('personality_aware');
      }
      if (input.context.salesHistory) {
        requirements.capabilities.add('sales_history_aware');
      }
    }

    // Determine priority
    requirements.priority = this.calculatePriority(input);

    return requirements;
  }

  async createPipeline(requirements) {
    const pipeline = [];

    // Create stages based on requirements
    if (requirements.capabilities.has('media_processing')) {
      pipeline.push({
        type: 'media_processing',
        requirements: {
          capabilities: ['media_processing'],
          priority: requirements.priority
        }
      });
    }

    if (requirements.capabilities.has('personality_aware')) {
      pipeline.push({
        type: 'personality_analysis',
        requirements: {
          capabilities: ['personality_analysis'],
          priority: requirements.priority
        }
      });
    }

    if (requirements.capabilities.has('product_knowledge')) {
      pipeline.push({
        type: 'product_handling',
        requirements: {
          capabilities: ['product_knowledge', 'sales_strategy'],
          priority: requirements.priority
        }
      });
    }

    // Add final response generation stage
    pipeline.push({
      type: 'response_generation',
      requirements: {
        capabilities: ['text_generation', 'context_aware'],
        priority: requirements.priority
      }
    });

    return pipeline;
  }

  async prepareAgentContext(agent, input, workflow) {
    const context = {
      workflowId: workflow.id,
      timestamp: Date.now(),
      agentId: agent.id,
      requirements: workflow.requirements,
      history: workflow.history || []
    };

    // Add session context if available
    if (input.sessionId) {
      context.session = await sessionManager.getSession(input.sessionId);
    }

    // Add relevant knowledge
    context.knowledge = await this.getRelevantKnowledge(input, agent.capabilities);

    return context;
  }

  async getRelevantKnowledge(input, capabilities) {
    const knowledge = {};

    // Get relevant vectors from vector store
    if (input.text) {
      const relevant = await vectorStore.search(input.text, {
        limit: 5,
        threshold: 0.7
      });
      knowledge.vectors = relevant;
    }

    // Add capability-specific knowledge
    if (capabilities.includes('product_knowledge')) {
      knowledge.products = await this.getRelevantProducts(input);
    }

    if (capabilities.includes('personality_aware')) {
      knowledge.personality = await this.getPersonalityInsights(input);
    }

    return knowledge;
  }

  updateAgentMetrics(agentId, success, duration) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const metrics = agent.metrics;
    metrics.tasks++;
    if (success) {
      metrics.successes++;
    } else {
      metrics.failures++;
    }

    metrics.avgResponseTime = 
      (metrics.avgResponseTime * (metrics.tasks - 1) + duration) / 
      metrics.tasks;
  }

  cleanupWorkflow(workflow) {
    // Remove from active workflows
    this.activeWorkflows.delete(workflow.id);
    
    // Cleanup any temporary resources
    if (workflow.resources) {
      Object.values(workflow.resources).forEach(resource => {
        if (resource.cleanup) {
          resource.cleanup().catch(() => {});
        }
      });
    }
  }

  // Event handlers
  handleAgentReady({ agentId }) {
    // Check for pending tasks that this agent can handle
    this.checkPendingTasks(agentId);
  }

  handleAgentError({ agentId, error }) {
    // Handle agent failures and potentially reassign tasks
    this.handleAgentFailure(agentId, error);
  }

  handleWorkflowStart({ workflowId }) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.metrics.startTime = Date.now();
    }
  }

  handleWorkflowEnd({ workflowId, success, error }) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.metrics.endTime = Date.now();
      workflow.metrics.success = success;
      if (error) workflow.metrics.error = error;
      
      // Record metrics
      this.metrics.recordWorkflowCompletion(workflow);
    }
  }

  handleTaskComplete({ workflowId, taskId, result }) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      this.progressWorkflow(workflow, taskId, result);
    }
  }
}

// Metrics collector class
class MetricsCollector {
  constructor() {
    this.metrics = {
      workflows: {
        total: 0,
        successful: 0,
        failed: 0,
        avgDuration: 0
      },
      agents: new Map()
    };
  }

  recordWorkflow(workflow, result) {
    const metrics = this.metrics.workflows;
    metrics.total++;
    
    if (result.success) {
      metrics.successful++;
    } else {
      metrics.failed++;
    }

    const duration = workflow.endTime - workflow.startTime;
    metrics.avgDuration = 
      (metrics.avgDuration * (metrics.total - 1) + duration) / 
      metrics.total;
  }

  recordAgentActivity(agentId, activity) {
    if (!this.metrics.agents.has(agentId)) {
      this.metrics.agents.set(agentId, {
        tasks: 0,
        successful: 0,
        failed: 0,
        avgDuration: 0
      });
    }

    const metrics = this.metrics.agents.get(agentId);
    metrics.tasks++;
    
    if (activity.success) {
      metrics.successful++;
    } else {
      metrics.failed++;
    }

    metrics.avgDuration = 
      (metrics.avgDuration * (metrics.tasks - 1) + activity.duration) / 
      metrics.tasks;
  }

  getMetrics() {
    return {
      workflows: { ...this.metrics.workflows },
      agents: Object.fromEntries(this.metrics.agents)
    };
  }
}

// Utility functions
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = CoordinatorAgent;

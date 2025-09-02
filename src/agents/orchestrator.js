/**
 * WhatsCore.AI - Maverick Edition
 * Agent Orchestrator - Advanced agent coordination and workflow management
 */
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class AgentOrchestrator {
  constructor() {
    this.agents = new Map();
    this.workflows = new Map();
    this.eventBus = new EventEmitter();
    this.metrics = new AgentMetricsCollector();
  }

  registerAgent(agent) {
    this.agents.set(agent.id, agent);
    this.metrics.registerAgent(agent);
    
    // Subscribe to agent events
    agent.on('task:complete', (task) => this.handleTaskCompletion(task));
    agent.on('task:error', (error) => this.handleTaskError(error));
    agent.on('metrics:update', (metrics) => this.metrics.updateAgentMetrics(agent.id, metrics));
  }

  async dispatch(task) {
    const { type, data, context } = task;
    
    // Create workflow for task
    const workflow = await this.createWorkflow(task);
    
    // Initialize workflow
    await this.initializeWorkflow(workflow);
    
    // Start execution
    return await this.executeWorkflow(workflow);
  }

  async createWorkflow(task) {
    const workflow = {
      id: uuidv4(),
      task,
      agents: [],
      state: 'created',
      metrics: {
        startTime: Date.now(),
        agentMetrics: new Map()
      }
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async initializeWorkflow(workflow) {
    // Determine required agents
    const requiredAgents = await this.analyzeTaskRequirements(workflow.task);
    
    // Assign agents to workflow
    workflow.agents = requiredAgents.map(agentId => ({
      id: agentId,
      agent: this.agents.get(agentId),
      state: 'pending',
      metrics: {
        duration: 0,
        errors: 0
      }
    }));
    
    workflow.state = 'initialized';
    return workflow;
  }

  async analyzeTaskRequirements(task) {
    const requiredCapabilities = new Set();
    
    // Analyze task type and data
    switch (task.type) {
      case 'message_processing':
        requiredCapabilities.add('nlp');
        requiredCapabilities.add('sentiment_analysis');
        break;
      
      case 'workflow_management':
        requiredCapabilities.add('workflow_management');
        requiredCapabilities.add('process_orchestration');
        break;
      
      case 'knowledge_retrieval':
        requiredCapabilities.add('rag');
        requiredCapabilities.add('knowledge_synthesis');
        break;
      
      case 'media_processing':
        requiredCapabilities.add('media_processing');
        break;
    }
    
    // Find agents with required capabilities
    const agents = Array.from(this.agents.values());
    return agents
      .filter(agent => 
        agent.capabilities.some(cap => requiredCapabilities.has(cap)))
      .map(agent => agent.id);
  }

  async executeWorkflow(workflow) {
    workflow.state = 'executing';
    workflow.metrics.startTime = Date.now();
    
    try {
      // Execute agents in parallel where possible
      const agentPromises = workflow.agents.map(async (agentInfo) => {
        const agent = agentInfo.agent;
        agentInfo.state = 'executing';
        
        const startTime = Date.now();
        
        try {
          const result = await agent.process(workflow.task.data, workflow.task.context);
          
          agentInfo.state = 'completed';
          agentInfo.result = result;
          agentInfo.metrics.duration = Date.now() - startTime;
          
          return result;
        } catch (error) {
          agentInfo.state = 'error';
          agentInfo.error = error;
          agentInfo.metrics.errors++;
          throw error;
        }
      });
      
      // Wait for all agents to complete
      const results = await Promise.all(agentPromises);
      
      // Process combined results
      const finalResult = await this.processCombinedResults(workflow, results);
      
      // Complete workflow
      return await this.completeWorkflow(workflow, finalResult);
      
    } catch (error) {
      return await this.handleWorkflowError(workflow, error);
    }
  }

  async processCombinedResults(workflow, results) {
    // Combine results based on task type
    switch (workflow.task.type) {
      case 'message_processing':
        return this.combineMessageProcessingResults(results);
      
      case 'workflow_management':
        return this.combineWorkflowResults(results);
      
      case 'knowledge_retrieval':
        return this.combineKnowledgeResults(results);
      
      case 'media_processing':
        return this.combineMediaResults(results);
      
      default:
        return results[0]; // Default to first result if no specific combination needed
    }
  }

  async completeWorkflow(workflow, result) {
    workflow.state = 'completed';
    workflow.result = result;
    workflow.metrics.endTime = Date.now();
    workflow.metrics.duration = workflow.metrics.endTime - workflow.metrics.startTime;
    
    // Generate workflow summary
    const summary = this.generateWorkflowSummary(workflow);
    
    // Update metrics
    this.metrics.recordWorkflowCompletion(workflow);
    
    return {
      workflowId: workflow.id,
      status: 'completed',
      result,
      summary
    };
  }

  async handleWorkflowError(workflow, error) {
    workflow.state = 'error';
    workflow.error = error;
    
    // Update metrics
    this.metrics.recordWorkflowError(workflow, error);
    
    return {
      workflowId: workflow.id,
      status: 'error',
      error: error.message
    };
  }

  generateWorkflowSummary(workflow) {
    return {
      id: workflow.id,
      type: workflow.task.type,
      duration: workflow.metrics.duration,
      agents: workflow.agents.map(agent => ({
        id: agent.id,
        state: agent.state,
        duration: agent.metrics.duration,
        errors: agent.metrics.errors
      })),
      metrics: this.metrics.getWorkflowMetrics(workflow.id)
    };
  }

  // Result combination methods
  combineMessageProcessingResults(results) {
    return results.reduce((combined, result) => {
      if (result.sentiment) combined.sentiment = result.sentiment;
      if (result.entities) combined.entities = [...(combined.entities || []), ...result.entities];
      if (result.intent) combined.intent = result.intent;
      return combined;
    }, {});
  }

  combineWorkflowResults(results) {
    return results.reduce((combined, result) => {
      if (result.actions) combined.actions = [...(combined.actions || []), ...result.actions];
      if (result.state) combined.state = { ...combined.state, ...result.state };
      return combined;
    }, {});
  }

  combineKnowledgeResults(results) {
    return results.reduce((combined, result) => {
      if (result.documents) combined.documents = [...(combined.documents || []), ...result.documents];
      if (result.relevance) combined.relevance = Math.max(combined.relevance || 0, result.relevance);
      return combined;
    }, {});
  }

  combineMediaResults(results) {
    return results.reduce((combined, result) => {
      if (result.processedFiles) combined.processedFiles = [...(combined.processedFiles || []), ...result.processedFiles];
      if (result.metadata) combined.metadata = { ...combined.metadata, ...result.metadata };
      return combined;
    }, {});
  }
}

class AgentMetricsCollector {
  constructor() {
    this.agentMetrics = new Map();
    this.workflowMetrics = new Map();
  }

  registerAgent(agent) {
    this.agentMetrics.set(agent.id, {
      tasks: 0,
      errors: 0,
      totalDuration: 0,
      avgDuration: 0
    });
  }

  updateAgentMetrics(agentId, metrics) {
    const current = this.agentMetrics.get(agentId);
    this.agentMetrics.set(agentId, {
      ...current,
      ...metrics
    });
  }

  recordWorkflowCompletion(workflow) {
    const metrics = {
      duration: workflow.metrics.duration,
      agentMetrics: Object.fromEntries(workflow.metrics.agentMetrics),
      completedAt: Date.now()
    };
    
    this.workflowMetrics.set(workflow.id, metrics);
    
    // Update agent metrics
    workflow.agents.forEach(agentInfo => {
      const current = this.agentMetrics.get(agentInfo.id);
      current.tasks++;
      current.totalDuration += agentInfo.metrics.duration;
      current.avgDuration = current.totalDuration / current.tasks;
    });
  }

  recordWorkflowError(workflow, error) {
    const metrics = this.workflowMetrics.get(workflow.id) || {};
    metrics.error = error;
    metrics.failedAt = Date.now();
    
    this.workflowMetrics.set(workflow.id, metrics);
    
    // Update agent error metrics
    workflow.agents.forEach(agentInfo => {
      if (agentInfo.state === 'error') {
        const current = this.agentMetrics.get(agentInfo.id);
        current.errors++;
      }
    });
  }

  getWorkflowMetrics(workflowId) {
    return this.workflowMetrics.get(workflowId);
  }

  getAgentMetrics(agentId) {
    return this.agentMetrics.get(agentId);
  }

  generateMetricsSummary() {
    return {
      agents: Object.fromEntries(this.agentMetrics),
      workflows: Object.fromEntries(this.workflowMetrics)
    };
  }
}

module.exports = AgentOrchestrator;

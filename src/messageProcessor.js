/**
 * WhatsCore.AI - Maverick Edition
 * Message Processor - Enhanced multi-agent message processing system
 */
const EventEmitter = require('events');
const { logWithTimestamp } = require('../utils/logger');
const coordinator = require('../src/agents/coordinatorAgent');
const sessionManager = require('../src/sessionManager');
const vectorStore = require('../src/vectorStore');

class MessageProcessor extends EventEmitter {
  constructor() {
    super();
    this.setup();
  }

  async setup() {
    // Register core agents
    await coordinator.registerAgent({
      id: 'personality',
      capabilities: ['personality_analysis', 'emotional_intelligence'],
      priority: 1
    });

    await coordinator.registerAgent({
      id: 'sales',
      capabilities: ['product_knowledge', 'sales_strategy', 'price_negotiation'],
      priority: 2
    });

    await coordinator.registerAgent({
      id: 'media',
      capabilities: ['media_processing', 'content_extraction'],
      priority: 1
    });
  }

  async processMessage(message, context = {}) {
    const sessionId = message.from;
    const session = await sessionManager.getSession(sessionId);

    try {
      // Prepare input for processing
      const input = await this.prepareInput(message, session);

      // Create processing context
      const processingContext = await this.createContext(input, session);

      // Process through coordinator
      const result = await coordinator.process(input, processingContext);

      // Post-process result
      const response = await this.postProcess(result, session);

      // Update session
      await this.updateSession(session, input, result);

      return response;
    } catch (error) {
      logWithTimestamp(`❌ Message processing error:`, error);
      throw error;
    }
  }

  async prepareInput(message, session) {
    const input = {
      id: message.id,
      type: message.type,
      timestamp: message.timestamp,
      text: message.body,
      sessionId: session.chatId,
      context: {
        history: session.history,
        personality: session.personalityProfile,
        activeWorkflow: session.activeWorkflow
      }
    };

    // Handle media content
    if (message.hasMedia) {
      input.media = await this.prepareMedia(message);
    }

    // Handle special message types
    if (message.quotedMsg) {
      input.quoted = await this.prepareQuoted(message.quotedMsg);
    }

    return input;
  }

  async prepareMedia(message) {
    const media = await message.downloadMedia();
    return {
      type: message.type,
      mimetype: media.mimetype,
      filename: media.filename,
      data: media.data
    };
  }

  async prepareQuoted(quotedMsg) {
    return {
      id: quotedMsg.id,
      type: quotedMsg.type,
      text: quotedMsg.body,
      timestamp: quotedMsg.timestamp
    };
  }

  async createContext(input, session) {
    return {
      sessionId: session.chatId,
      timestamp: Date.now(),
      requirements: await this.determineRequirements(input, session),
      state: {
        messageCount: session.messageCount,
        lastAnalysis: session.lastAnalysis,
        activeAgents: Array.from(session.activeAgents)
      }
    };
  }

  async determineRequirements(input, session) {
    const requirements = {
      capabilities: new Set(),
      priority: 'normal'
    };

    // Add basic requirements
    requirements.capabilities.add('text_processing');
    requirements.capabilities.add('context_aware');

    // Add media-specific requirements
    if (input.media) {
      requirements.capabilities.add('media_processing');
      requirements.capabilities.add(`${input.media.type}_processing`);
    }

    // Add personality requirements if needed
    if (session.messageCount >= 20 || !session.personalityProfile) {
      requirements.capabilities.add('personality_analysis');
    }

    // Add sales requirements if needed
    if (input.text?.toLowerCase().includes('product') || 
        input.text?.toLowerCase().includes('price')) {
      requirements.capabilities.add('product_knowledge');
      requirements.capabilities.add('sales_strategy');
    }

    // Determine priority
    if (input.type === 'order' || input.text?.toLowerCase().includes('urgent')) {
      requirements.priority = 'high';
    }

    return requirements;
  }

  async postProcess(result, session) {
    // Prepare response
    let response = result;

    // Handle different result types
    if (result.type === 'media_analysis') {
      response = await this.formatMediaResponse(result);
    } else if (result.type === 'product_info') {
      response = await this.formatProductResponse(result);
    }

    // Add personality-aware modifications if available
    if (session.personalityProfile) {
      response = await this.personalizeResponse(response, session.personalityProfile);
    }

    return response;
  }

  async formatMediaResponse(result) {
    let response = '';

    switch (result.mediaType) {
      case 'image':
        response = `Şəkildə aşkar edilənlər: ${result.description}\n`;
        if (result.text) {
          response += `Mətn məzmunu: ${result.text}\n`;
        }
        break;

      case 'video':
        response = `Video məzmunu: ${result.description}\n`;
        if (result.transcription) {
          response += `Audio transkripsiya: ${result.transcription}\n`;
        }
        break;

      case 'audio':
        response = `Audio transkripsiya: ${result.transcription}\n`;
        break;

      case 'document':
        response = `Sənəd məzmunu: ${result.text}\n`;
        break;
    }

    return response;
  }

  async formatProductResponse(result) {
    let response = '';

    if (result.products.length > 0) {
      response = 'Tapılan məhsullar:\n\n';
      for (const product of result.products) {
        response += `📦 ${product.name}\n`;
        response += `💰 Qiymət: ${product.price} ${product.currency}\n`;
        if (product.description) {
          response += `📝 ${product.description}\n`;
        }
        response += '\n';
      }
    } else {
      response = 'Təəssüf ki, bu sorğuya uyğun məhsul tapılmadı.';
    }

    return response;
  }

  async personalizeResponse(response, personality) {
    // Add personality-based modifications
    let personalized = response;

    // Adjust formality based on personality
    if (personality.traits.formality > 0.7) {
      personalized = this.makeMoreFormal(personalized);
    } else if (personality.traits.formality < 0.3) {
      personalized = this.makeMoreCasual(personalized);
    }

    // Adjust detail level based on personality
    if (personality.traits.detail_oriented > 0.7) {
      personalized = this.addMoreDetail(personalized);
    } else if (personality.traits.detail_oriented < 0.3) {
      personalized = this.makeMoreConcise(personalized);
    }

    return personalized;
  }

  async updateSession(session, input, result) {
    // Update message count
    session.messageCount++;

    // Update history
    session.history.push({
      timestamp: Date.now(),
      input,
      result
    });

    // Trim history if needed
    if (session.history.length > 100) {
      session.history = session.history.slice(-100);
    }

    // Update session
    await sessionManager.saveSession(session.chatId, {
      messageCount: session.messageCount,
      history: session.history
    });
  }

  // Helper methods for response personalization
  makeMoreFormal(text) {
    // Add formal language patterns
    return text.replace(/salam/gi, 'Hörmətli müştəri')
              .replace(/sagol/gi, 'Təşəkkür edirik');
  }

  makeMoreCasual(text) {
    // Add casual language patterns
    return text.replace(/Hörmətli müştəri/gi, 'Salam')
              .replace(/Təşəkkür edirik/gi, 'Təşəkkürlər');
  }

  addMoreDetail(text) {
    // Add more detailed explanations
    // This is a simplified example
    return text + '\n\nƏlavə məlumat üçün bizimlə əlaqə saxlaya bilərsiniz.';
  }

  makeMoreConcise(text) {
    // Simplify and shorten the response
    // This is a simplified example
    return text.split('\n').slice(0, 3).join('\n');
  }
}

module.exports = new MessageProcessor();

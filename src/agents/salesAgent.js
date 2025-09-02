/**
 * WhatsCore.AI - Maverick Edition
 * Sales Agent - Handles product recommendations and sales interactions
 */
const BaseAgent = require('./baseAgent');
const vectorStore = require('../vectorStore');
const productManager = require('../../services/productManager');

class SalesAgent extends BaseAgent {
  constructor(config) {
    super({
      id: 'sales_agent',
      type: 'specialist',
      capabilities: [
        'product_knowledge',
        'sales_strategy',
        'price_negotiation',
        'inventory_management',
        'recommendation_engine'
      ],
      ...config
    });

    this.productCache = new Map();
    this.userPreferences = new Map();
    this.salesHistory = new Map();
    this.promotions = new Set();
  }

  async loadResources(config) {
    // Load product catalog into vector store
    const products = await productManager.getAllProducts();
    for (const product of products) {
      const embedding = await this.generateProductEmbedding(product);
      vectorStore.add(
        `product_${product.id}`,
        embedding,
        { type: 'product', ...product }
      );
    }
  }

  async preProcess(input, context) {
    const { message, userId } = input;
    
    // Extract product-related intent
    const intent = await this.extractProductIntent(message);
    
    // Get user preferences
    const preferences = this.userPreferences.get(userId) || {};
    
    // Get relevant sales history
    const history = this.salesHistory.get(userId) || [];

    return {
      intent,
      preferences,
      history,
      message
    };
  }

  async execute(input, context) {
    const { intent, preferences, history, message } = input;
    const userId = context.userId;

    // Handle different sales-related intents
    switch (intent.type) {
      case 'product_inquiry':
        return await this.handleProductInquiry(intent, preferences);
      
      case 'price_query':
        return await this.handlePriceQuery(intent.product, preferences);
      
      case 'availability_check':
        return await this.handleAvailabilityCheck(intent.product);
      
      case 'comparison_request':
        return await this.handleProductComparison(intent.products, preferences);
      
      case 'recommendation_request':
        return await this.generateRecommendations(preferences, history);
      
      case 'negotiation':
        return await this.handleNegotiation(intent, preferences, history);
      
      default:
        return await this.handleGeneralSalesQuery(message, preferences);
    }
  }

  async postProcess(result, context) {
    const userId = context.userId;
    
    // Update user preferences based on interaction
    await this.updatePreferences(userId, result);
    
    // Record interaction in sales history
    this.recordInteraction(userId, result);
    
    // Enhance response with personalized elements
    const enhanced = await this.enhanceResponse(result, context);
    
    return enhanced;
  }

  async extractProductIntent(message) {
    // Analyze message for product-related intent
    const intent = {
      type: 'unknown',
      confidence: 0,
      products: [],
      attributes: [],
      constraints: {}
    };

    // Extract product mentions
    const productMentions = await this.extractProductMentions(message);
    if (productMentions.length > 0) {
      intent.products = productMentions;
      intent.confidence += 0.3;
    }

    // Identify intent type
    if (message.toLowerCase().includes('price')) {
      intent.type = 'price_query';
      intent.confidence += 0.4;
    } else if (message.toLowerCase().includes('available')) {
      intent.type = 'availability_check';
      intent.confidence += 0.4;
    } else if (message.toLowerCase().includes('compare')) {
      intent.type = 'comparison_request';
      intent.confidence += 0.4;
    } else if (message.toLowerCase().includes('recommend')) {
      intent.type = 'recommendation_request';
      intent.confidence += 0.4;
    } else if (productMentions.length > 0) {
      intent.type = 'product_inquiry';
      intent.confidence += 0.3;
    }

    // Extract attributes and constraints
    intent.attributes = await this.extractProductAttributes(message);
    intent.constraints = await this.extractConstraints(message);

    return intent;
  }

  async handleProductInquiry(intent, preferences) {
    const { products, attributes } = intent;
    
    // Get detailed product information
    const productDetails = await Promise.all(
      products.map(async (productId) => {
        const cached = this.productCache.get(productId);
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
          return cached.data;
        }
        const details = await productManager.getProduct(productId);
        this.productCache.set(productId, {
          timestamp: Date.now(),
          data: details
        });
        return details;
      })
    );

    // Filter relevant attributes
    const relevantInfo = productDetails.map(product => {
      const filtered = { id: product.id, name: product.name };
      for (const attr of attributes) {
        if (product[attr]) filtered[attr] = product[attr];
      }
      return filtered;
    });

    // Enhance with recommendations if applicable
    const enhanced = await this.enhanceWithRecommendations(
      relevantInfo,
      preferences
    );

    return {
      type: 'product_info',
      products: enhanced,
      suggestions: await this.generateRelatedSuggestions(products, preferences)
    };
  }

  async handlePriceQuery(product, preferences) {
    const details = await productManager.getProduct(product);
    const pricing = await this.calculatePersonalizedPricing(
      details,
      preferences
    );

    return {
      type: 'price_info',
      basePrice: details.price,
      personalizedPrice: pricing.final,
      discounts: pricing.discounts,
      currency: details.currency,
      validUntil: pricing.validUntil
    };
  }

  async handleAvailabilityCheck(product) {
    const inventory = await productManager.checkInventory(product);
    const restockInfo = inventory.quantity < 5 ? 
      await this.getRestockInformation(product) : null;

    return {
      type: 'availability_info',
      inStock: inventory.quantity > 0,
      quantity: inventory.quantity,
      location: inventory.location,
      restock: restockInfo,
      alternatives: inventory.quantity < 1 ? 
        await this.findAlternatives(product) : []
    };
  }

  async handleProductComparison(products, preferences) {
    const details = await Promise.all(
      products.map(p => productManager.getProduct(p))
    );

    // Generate comparison matrix
    const comparisonMatrix = this.generateComparisonMatrix(details);
    
    // Highlight differences and similarities
    const analysis = this.analyzeComparison(comparisonMatrix, preferences);
    
    return {
      type: 'comparison',
      products: details.map(p => ({
        id: p.id,
        name: p.name,
        highlight: analysis.highlights[p.id]
      })),
      matrix: comparisonMatrix,
      analysis: analysis.summary,
      recommendation: analysis.recommendation
    };
  }

  async generateRecommendations(preferences, history) {
    // Get user's preferred categories
    const categories = this.extractPreferredCategories(preferences, history);
    
    // Find similar products to past interactions
    const similarProducts = await this.findSimilarProducts(history);
    
    // Get trending products in relevant categories
    const trending = await this.getTrendingProducts(categories);
    
    // Personalize recommendations
    const personalized = await this.personalizeRecommendations(
      [...similarProducts, ...trending],
      preferences
    );

    return {
      type: 'recommendations',
      items: personalized,
      reasoning: this.generateRecommendationReasoning(personalized, preferences)
    };
  }

  async handleNegotiation(intent, preferences, history) {
    const { product, proposedPrice } = intent;
    
    // Calculate acceptable price range
    const priceRange = await this.calculateAcceptableRange(
      product,
      preferences,
      history
    );
    
    // Generate negotiation strategy
    const strategy = this.determineNegotiationStrategy(
      proposedPrice,
      priceRange,
      preferences
    );
    
    return {
      type: 'negotiation',
      acceptable: proposedPrice >= priceRange.minimum,
      counterOffer: strategy.counterOffer,
      reasoning: strategy.reasoning,
      additionalValue: strategy.additionalValue
    };
  }

  async handleGeneralSalesQuery(message, preferences) {
    // Extract topic and context
    const topic = await this.extractSalesTopic(message);
    
    // Get relevant product knowledge
    const knowledge = await this.getRelevantKnowledge(topic);
    
    // Personalize response
    const response = this.personalizeResponse(knowledge, preferences);
    
    return {
      type: 'general_info',
      topic,
      information: response.info,
      suggestions: response.suggestions
    };
  }

  // Helper methods
  async generateProductEmbedding(product) {
    // Generate vector embedding for product
    const features = [
      product.name,
      product.description,
      product.category,
      ...product.tags || [],
      ...product.features || []
    ].join(' ');
    
    // Use proper embedding service here
    return []; // Placeholder
  }

  async enhanceWithRecommendations(products, preferences) {
    // Add personalized recommendations
    return products.map(product => ({
      ...product,
      personalizedScore: this.calculatePersonalizedScore(product, preferences),
      similarItems: this.findSimilarItems(product, preferences)
    }));
  }

  calculatePersonalizedScore(product, preferences) {
    // Calculate how well product matches user preferences
    let score = 0.5; // Base score
    
    // Adjust based on category preference
    if (preferences.preferredCategories?.includes(product.category)) {
      score += 0.2;
    }
    
    // Adjust based on price preference
    if (preferences.priceRange) {
      const priceScore = this.calculatePriceScore(product.price, preferences.priceRange);
      score = (score + priceScore) / 2;
    }
    
    return Math.min(1, Math.max(0, score));
  }

  async updatePreferences(userId, interaction) {
    const current = this.userPreferences.get(userId) || {};
    
    // Update based on interaction type
    switch (interaction.type) {
      case 'product_info':
        this.updateProductInterests(current, interaction.products);
        break;
      case 'price_info':
        this.updatePricePreferences(current, interaction);
        break;
      case 'comparison':
        this.updateComparisonPreferences(current, interaction);
        break;
    }
    
    this.userPreferences.set(userId, current);
  }

  recordInteraction(userId, interaction) {
    const history = this.salesHistory.get(userId) || [];
    history.push({
      timestamp: new Date().toISOString(),
      type: interaction.type,
      details: interaction
    });
    this.salesHistory.set(userId, history.slice(-100)); // Keep last 100 interactions
  }
}

module.exports = SalesAgent;

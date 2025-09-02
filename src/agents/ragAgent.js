/**
 * WhatsCore.AI - Maverick Edition
 * RAG Agent - Advanced knowledge retrieval and processing
 */
const BaseAgent = require('./baseAgent');
const { ChromaClient } = require('chromadb');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { Document } = require('langchain/document');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

class RagAgent extends BaseAgent {
  constructor(config) {
    super({
      id: 'rag_agent',
      type: 'knowledge',
      capabilities: [
        'knowledge_retrieval',
        'context_enrichment',
        'semantic_search',
        'knowledge_synthesis',
        'document_processing'
      ],
      ...config
    });

    this.collections = new Map();
    this.embeddings = new OpenAIEmbeddings();
    this.chromaClient = new ChromaClient();
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
  }

  async loadResources(config) {
    // Initialize collections
    await this.initializeCollections([
      'products',
      'services',
      'faqs',
      'procedures',
      'chat_history'
    ]);
  }

  async initializeCollections(collectionNames) {
    for (const name of collectionNames) {
      const collection = await this.chromaClient.createCollection({
        name: `whatscore_${name}`,
        metadata: { description: `WhatsCore.AI ${name} knowledge base` }
      });
      this.collections.set(name, collection);
    }
  }

  async process(input, context) {
    const { query, type, filters } = input;

    // Process query through multiple collections
    const results = await Promise.all([
      this.searchCollection('products', query, filters),
      this.searchCollection('services', query, filters),
      this.searchCollection('faqs', query, filters),
      this.searchCollection('procedures', query, filters),
      this.searchRelevantHistory(query, context.sessionId)
    ]);

    // Merge and rank results
    const mergedResults = await this.mergeResults(results, query);

    // Synthesize knowledge
    const synthesis = await this.synthesizeKnowledge(mergedResults, query);

    return {
      type: 'knowledge_response',
      results: mergedResults,
      synthesis,
      confidence: this.calculateConfidence(mergedResults),
      sources: this.extractSources(mergedResults)
    };
  }

  async searchCollection(collectionName, query, filters = {}) {
    const collection = this.collections.get(collectionName);
    if (!collection) return [];

    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 5,
      where: filters
    });

    return results.map(result => ({
      ...result,
      collection: collectionName
    }));
  }

  async searchRelevantHistory(query, sessionId) {
    const collection = this.collections.get('chat_history');
    if (!collection) return [];

    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: 3,
      where: { sessionId }
    });

    return results.map(result => ({
      ...result,
      collection: 'chat_history'
    }));
  }

  async mergeResults(results, query) {
    // Flatten results
    const flattened = results.flat();

    // Calculate relevance scores
    const scored = await Promise.all(
      flattened.map(async result => ({
        ...result,
        relevanceScore: await this.calculateRelevance(result, query)
      }))
    );

    // Sort by relevance
    return scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  async calculateRelevance(result, query) {
    // Base score from vector similarity
    let score = result.distance;

    // Adjust based on collection type
    const collectionWeights = {
      products: 1.2,
      services: 1.2,
      faqs: 1.0,
      procedures: 0.9,
      chat_history: 0.8
    };
    score *= collectionWeights[result.collection] || 1.0;

    // Adjust based on recency (if timestamp available)
    if (result.metadata?.timestamp) {
      const age = Date.now() - new Date(result.metadata.timestamp).getTime();
      const recencyScore = Math.exp(-age / (1000 * 60 * 60 * 24 * 30)); // 30-day half-life
      score *= (1 + recencyScore) / 2;
    }

    // Adjust based on exact keyword matches
    const keywordMatches = this.countKeywordMatches(result.text, query);
    score *= (1 + keywordMatches * 0.1);

    return Math.min(1, Math.max(0, score));
  }

  countKeywordMatches(text, query) {
    const keywords = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    return keywords.filter(keyword => textLower.includes(keyword)).length;
  }

  async synthesizeKnowledge(results, query) {
    // Group results by topic
    const topics = this.groupByTopic(results);

    // Synthesize each topic
    const syntheses = await Promise.all(
      Object.entries(topics).map(async ([topic, items]) => ({
        topic,
        content: await this.synthesizeTopic(items, query)
      }))
    );

    // Combine syntheses
    return {
      topics: syntheses,
      summary: await this.generateOverallSummary(syntheses, query)
    };
  }

  groupByTopic(results) {
    const topics = {};
    for (const result of results) {
      const topic = result.metadata?.topic || 'general';
      if (!topics[topic]) topics[topic] = [];
      topics[topic].push(result);
    }
    return topics;
  }

  async synthesizeTopic(items, query) {
    // Combine and summarize topic-specific information
    const combinedText = items
      .map(item => item.text)
      .join('\n\n');

    // Use text splitter for long content
    const docs = await this.textSplitter.createDocuments([combinedText]);
    
    // Synthesize content (implement actual synthesis logic)
    return {
      summary: "Topic synthesis", // Replace with actual synthesis
      keyPoints: [],
      confidence: this.calculateConfidence(items)
    };
  }

  calculateConfidence(results) {
    if (results.length === 0) return 0;

    // Calculate weighted average of relevance scores
    const totalWeight = results.reduce((sum, r) => sum + r.relevanceScore, 0);
    const weightedSum = results.reduce((sum, r) => sum + r.relevanceScore * r.relevanceScore, 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  extractSources(results) {
    return results.map(result => ({
      id: result.id,
      collection: result.collection,
      metadata: result.metadata,
      relevance: result.relevanceScore
    }));
  }

  async addDocument(document, collection = 'general') {
    const texts = await this.textSplitter.splitText(document.text);
    const embeddings = await this.embeddings.embedDocuments(texts);

    const collection = this.collections.get(collection);
    if (!collection) throw new Error(`Collection ${collection} not found`);

    await collection.add({
      ids: texts.map((_, i) => `${document.id}_chunk_${i}`),
      embeddings,
      metadatas: texts.map(() => document.metadata),
      documents: texts
    });
  }

  async updateDocument(documentId, newContent, collection = 'general') {
    const collection = this.collections.get(collection);
    if (!collection) throw new Error(`Collection ${collection} not found`);

    // Delete old chunks
    await collection.delete({
      where: { documentId }
    });

    // Add new content
    await this.addDocument({
      id: documentId,
      text: newContent,
      metadata: { documentId, updated: new Date().toISOString() }
    }, collection);
  }

  async deleteDocument(documentId, collection = 'general') {
    const collection = this.collections.get(collection);
    if (!collection) throw new Error(`Collection ${collection} not found`);

    await collection.delete({
      where: { documentId }
    });
  }
}

module.exports = RagAgent;

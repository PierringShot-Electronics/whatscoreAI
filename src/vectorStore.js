const { logWithTimestamp } = require('../utils/logger');

function dot(a, b) { return a.reduce((s, v, i) => s + v * (b[i] || 0), 0); }
function magnitude(a) { return Math.sqrt(a.reduce((s, v) => s + v * v, 0)); }

class VectorStore {
  constructor() {
    this.items = []; // { id, vector, metadata }
  }

  add(id, vector, metadata = {}) {
    this.items.push({ id, vector, metadata });
  }

  search(queryVector, topN = 5) {
    const results = this.items.map(item => {
      const score = (dot(queryVector, item.vector) / (magnitude(queryVector) * magnitude(item.vector))) || 0;
      return { id: item.id, score, metadata: item.metadata };
    }).sort((a,b) => b.score - a.score).slice(0, topN);
    return results;
  }

  clear() { this.items = []; }
}

module.exports = new VectorStore();

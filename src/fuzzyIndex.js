const Fuse = require('fuse.js');
const { logWithTimestamp } = require('../utils/logger');

class FuzzyIndex {
  constructor() { this.index = null; this.data = []; }

  build(items = []) {
    this.data = items;
    const options = { keys: ['name', 'aliases', 'keywords'], threshold: 0.4 };
    this.index = new Fuse(items, options);
    logWithTimestamp(`🔎 Fuzzy index built with ${items.length} items`);
  }

  normalizeQuery(q, threshold = 0.25) {
    if (!this.index) return null;
    const res = this.index.search(q, { limit: 1 });
    if (!res || res.length === 0) return null;
    const match = res[0];
    if (match.score !== undefined && match.score <= threshold) return match.item;
    return null;
  }
}

module.exports = new FuzzyIndex();

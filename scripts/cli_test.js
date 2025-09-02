#!/usr/bin/env node
const { loadProducts, searchKnowledgeBase, getProductById } = require('../services/productManager');
const { createOrder } = require('../services/orderManager');
const { logWithTimestamp } = require('../utils/logger');

(async () => {
  await loadProducts();
  logWithTimestamp('CLI test: products loaded. Searching for "telefon"...');
  const results = searchKnowledgeBase('telefon', { limit: 5 });
  console.log('Search results:', results.map(r => ({ id: r.id, name: r.name, price: r.sale_price })));

  if (results.length > 0) {
    const p = results[0];
    try {
      const order = await createOrder('lead-cli-1', '994501234567', p.id, 1);
      console.log('Created order:', order);
    } catch (e) {
      console.error('Order creation failed:', e.message);
    }
  } else {
    console.log('No product found to create order.');
  }
})();

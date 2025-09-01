const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Fuse = require('fuse.js');
const { logWithTimestamp } = require('../utils/logger');

const productsFilePath = path.join(__dirname, '..', 'data', 'products.csv');
let products = [];
let fuse = null;

function getAllProducts() {
  return products;
}

function loadProducts() {
  return new Promise((resolve) => {
    const temp = [];

    if (!fs.existsSync(productsFilePath)) {
      logWithTimestamp(`⚠️ products.csv faylı tapılmadı: ${productsFilePath}`);
      products = [];
      fuse = null;
      return resolve();
    }

    fs.createReadStream(productsFilePath)
      .pipe(csv({ separator: ',' }))
      .on('data', (row) => {
        try {
          // Normalize and coerce types
          row.id = row.id || row.ID || row.Id || '';
          row.name = (row.name || row.title || '').toString();
          row.description = (row.description || row.desc || '').toString();
          row.category = (row.category || '').toString();
          row.cost_price = parseFloat(row.cost_price || row.cost || 0) || 0;
          row.profit_margin = parseFloat(row.profit_margin || 0) || 0;
          row.stock = parseInt(row.stock || '0', 10) || 0;
          row.tags = (row.tags || '').toString().split('|').map(s => s.trim()).filter(Boolean);
          row.sale_price = +(row.sale_price || (row.cost_price * (1 + row.profit_margin))).toFixed(2);
          temp.push(row);
        } catch (e) {
          // ignore malformed row
        }
      })
      .on('end', () => {
        products = temp;
        try {
          fuse = new Fuse(products, { includeScore: true, keys: ['name', 'description', 'tags', 'category', 'id'] });
        } catch (e) {
          fuse = null;
        }
        logWithTimestamp(`✅ ${products.length} məhsul/xidmət CSV-dən yükləndi və axtarış indeksi yaradıldı.`);
        resolve();
      })
      .on('error', (err) => {
        logWithTimestamp('❌ CSV faylını oxuma xətası:', err);
        products = [];
        fuse = null;
        resolve();
      });
  });
}

function searchKnowledgeBase(query, options = {}) {
  if (!fuse) return [];
  if (!query || typeof query !== 'string' || query.trim().length === 0) return [];

  const limit = options.limit || 5;
  const results = fuse.search(query, { limit });

  // return only reasonably relevant items (score may be undefined depending on Fuse options)
  return results
    .filter(r => typeof r.score === 'number' ? r.score < 0.6 : true)
    .map(r => r.item);
}

function getProductById(id) {
  if (!id) return null;
  return products.find(p => String(p.id).toLowerCase() === String(id).toLowerCase()) || null;
}

function getProducts() {
  return products;
}

function getProductByName(name) {
  if (!name) return null;
  const results = searchProducts(name, { limit: 1 });
  return results.length > 0 ? results[0] : null;
}

function updateProduct(productId, updates) {
  const index = products.findIndex(p => String(p.id) === String(productId));
  if (index === -1) return false;

  products[index] = { ...products[index], ...updates };
  return true;
}

// Backwards-compatible alias: some modules import `searchProducts`
const searchProducts = searchKnowledgeBase;

module.exports = {
  loadProducts,
  searchProducts,
  // Backwards-compat: some modules/tests expect these names
  searchKnowledgeBase,
  getProductById,
  getProductByName,
  updateProduct,
  getAllProducts,
  getProducts,
  getProductCategories: () => Array.from(new Set(products.map(p => (p.category || '').trim()).filter(Boolean))),
};

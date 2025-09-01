const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parse/sync');
const { logWithTimestamp } = require('../utils/logger');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUT_FILE = path.join(DATA_DIR, 'knowledge_base.json');

function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  return csv.parse(raw, { columns: true, skip_empty_lines: true });
}

async function buildKnowledge() {
  const productsCsv = parseCSV(path.join(DATA_DIR, 'products.csv'));
  const servicesCsv = parseCSV(path.join(DATA_DIR, 'services.csv'));
  const docsText = fs.existsSync(path.join(__dirname, '..', 'docs', 'deep_research_cleaned.txt')) ? fs.readFileSync(path.join(__dirname, '..', 'docs', 'deep_research_cleaned.txt'), 'utf8') : '';

  const items = [];
  productsCsv.forEach(p => {
    items.push({ id: p.id || p.id, type: 'product', name: p.name, description: p.tags || '', price: p.sale_price || null, stock: p.stock || null, keywords: (p.tags || '').split('|').filter(Boolean) });
  });
  servicesCsv.forEach(s => {
    items.push({ id: s.id || s.id, type: 'service', name: s.title || s.name, description: s.description || '', price: s.sale_price || s.price || null, keywords: (s.description || '').split(/\s+/).slice(0,10) });
  });

  // naive extraction of FAQ-like lines from docsText (split by \n\n)
  const blocks = docsText.split('\n\n').map(b => b.trim()).filter(Boolean).slice(0,200);
  blocks.forEach((blk, i) => {
    if (blk.length < 30) return;
    items.push({ id: `doc-${i}`, type: 'doc', name: blk.split('\n')[0].slice(0,80), description: blk, keywords: blk.split(/\s+/).slice(0,10) });
  });

  fs.ensureDirSync(DATA_DIR);
  fs.writeJsonSync(OUT_FILE, items, { spaces: 2 });
  logWithTimestamp(`✅ knowledge_base.json yazıldı: ${OUT_FILE} (items: ${items.length})`);
}

if (require.main === module) buildKnowledge().catch(e => { console.error(e); process.exit(1); });

module.exports = { buildKnowledge };

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = __dirname + '/..';
const dataDir = path.join(root, 'data');
const fixturesDir = path.join(dataDir, 'fixtures');

const productsTarget = path.join(dataDir, 'products.csv');
const servicesTarget = path.join(dataDir, 'services.csv');
const productsSample = path.join(fixturesDir, 'products.sample.csv');
const servicesSample = path.join(fixturesDir, 'services.sample.csv');

const force = process.argv.includes('--force') || String(process.env.FORCE_SEED || '').toLowerCase() === 'true';

function copyIfNeeded(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Fixture not found: ${src}`);
    return;
  }
  if (!fs.existsSync(dest) || force) {
    if (fs.existsSync(dest) && force) {
      fs.copyFileSync(dest, `${dest}.bak`);
      console.log(`Backed up existing ${dest} -> ${dest}.bak`);
    }
    fs.copyFileSync(src, dest);
    console.log(`Seeded ${path.basename(dest)} from fixtures.`);
  } else {
    console.log(`${path.basename(dest)} exists; skipping. Use --force to overwrite.`);
  }
}

copyIfNeeded(productsSample, productsTarget);
copyIfNeeded(servicesSample, servicesTarget);
console.log('Seeding complete.');


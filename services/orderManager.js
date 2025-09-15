const fs = require('fs');
const path = require('path');
const { logWithTimestamp } = require('../utils/logger');
const { getProductById } = require('./productManager');

// Allow overriding the orders file during tests
const ordersFilePath = process.env.TEST_ORDERS_FILE || path.join(__dirname, '..', 'data', 'orders.csv');

function ensureOrdersFile() {
  if (!fs.existsSync(ordersFilePath)) {
    const header = 'order_id,lead_id,customer_phone,item_id,quantity,total_price,status,created_at\n';
    fs.writeFileSync(ordersFilePath, header, { encoding: 'utf8' });
  }
}

/**
 * Create an order. Accepts either positional args or a single payload object.
 * Examples:
 *   createOrder('lead-1', '994501234567', 'P001', 2)
 *   createOrder({ lead_id: 'lead-1', customer_phone: '994501234567', item_id: 'P001', quantity: 2 })
 */
async function createOrder(leadId, customerPhone, itemId, quantity = 1) {
  let payload = {};
  if (typeof leadId === 'object' && leadId !== null) {
    payload = {
      lead_id: leadId.lead_id || leadId.leadId || leadId.lead || '',
      customer_phone: leadId.customer_phone || leadId.customerPhone || leadId.customer || '',
      item_id: leadId.item_id || leadId.itemId || leadId.item || null,
      quantity: typeof leadId.quantity !== 'undefined' ? Number(leadId.quantity) : 1,
    };
  } else {
    payload = {
      lead_id: leadId || '',
      customer_phone: customerPhone || '',
      item_id: itemId || null,
      quantity: typeof quantity !== 'undefined' ? Number(quantity) : 1,
    };
  }

  // Basic validation
  // Basic validation — allow filling dummy values when ALLOW_DUMMY_ORDERS=true
  const allowDummy = String(process.env.ALLOW_DUMMY_ORDERS || '').toLowerCase() === 'true';
  if (!payload.customer_phone) {
    if (allowDummy) {
      logWithTimestamp('⚠️ customer_phone missing — filling dummy value because ALLOW_DUMMY_ORDERS=true');
      payload.customer_phone = '0000000000';
    } else {
      throw new Error('customer_phone is required');
    }
  }
  if (!payload.item_id) {
    if (allowDummy) {
      logWithTimestamp('⚠️ item_id missing — filling dummy value because ALLOW_DUMMY_ORDERS=true');
      payload.item_id = 'UNKNOWN';
    } else {
      throw new Error('item_id is required');
    }
  }
  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) payload.quantity = 1;

  // Validate product exists; optionally create a dummy product when allowed
  let product = getProductById(payload.item_id);
  if (!product) {
    if (allowDummy) {
      logWithTimestamp(`⚠️ item_id not found (${payload.item_id}) — using dummy product because ALLOW_DUMMY_ORDERS=true`);
      product = {
        id: payload.item_id,
        name: `DUMMY-${payload.item_id}`,
        cost: 0,
        cost_price: 0,
        profit_margin: 0,
        profit: 0,
        sale_price: 0,
      };
    } else {
      throw new Error(`item_id not found: ${payload.item_id}`);
    }
  }

  // Compute sale price per unit
  const cost = Number(product.cost_price || product.cost || 0) || 0;
  const margin = (() => {
    const m = product.profit_margin || product.profit || 0;
    return isNaN(Number(m)) ? 0 : Number(m);
  })();
  const salePricePerUnit = Number(product.sale_price || (cost * (1 + margin)));
  const total_price = (salePricePerUnit * payload.quantity).toFixed(2);

  ensureOrdersFile();

  const orderId = `PSE-${Date.now()}`;
  const created_at = new Date().toISOString();
  const status = 'pending';

  const row = `${orderId},${payload.lead_id},${payload.customer_phone},${payload.item_id},${payload.quantity},${total_price},${status},${created_at}\n`;
  fs.appendFileSync(ordersFilePath, row, { encoding: 'utf8' });
  logWithTimestamp(`✅ Yeni sifariş yaradıldı: ${orderId}`);

  return {
    order_id: orderId,
    lead_id: payload.lead_id || null,
    customer_phone: payload.customer_phone,
    item_id: payload.item_id,
    quantity: payload.quantity,
    total_price: Number(total_price),
    status,
    created_at,
  };
}

function getAllOrders() {
    ensureOrdersFile();

    const fileContents = fs.readFileSync(ordersFilePath, { encoding: 'utf8' });
    if (!fileContents) return [];

    const lines = fileContents
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (lines.length <= 1) return [];

    return lines
        .slice(1)
        .map(line => {
            const [
                order_id,
                lead_id,
                customer_phone,
                item_id,
                quantity,
                total_price,
                status,
                created_at,
            ] = line.split(',');

            if (!order_id) return null;

            return {
                order_id: order_id.trim(),
                lead_id: (lead_id || '').trim() || null,
                customer_phone: (customer_phone || '').trim(),
                item_id: (item_id || '').trim(),
                quantity: Number(quantity) || 0,
                total_price: Number(total_price) || 0,
                status: (status || '').trim(),
                created_at: (created_at || '').trim(),
            };
        })
        .filter(Boolean);
}

module.exports = { createOrder, getAllOrders };

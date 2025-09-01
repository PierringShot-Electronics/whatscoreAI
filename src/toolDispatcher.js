const { logWithTimestamp } = require('../utils/logger');
const { createRepairTicket } = require('./leadManager');
const { getProductById } = require('./productManager');
const orderManager = require('./orderManager');

const handlers = {
  async get_service_details(args) {
    const name = args.service_name;
    // try product first
    const p = getProductById(name) || getProductById(args.service_name);
    if (p) return { status: 'success', data: p };
    // fallback: search services
    return { status: 'error', message: 'Service not found' };
  },

  async create_repair_ticket(args) {
    // Use leadManager's createLead-like function to create a ticket
    try {
      const ticket = await createRepairTicket(args.customer_name || 'Anon', args.device_type || 'Unknown', args.issue_description || 'No description');
      return { status: 'success', data: ticket };
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  },

  async get_ticket_status(args) {
    // placeholder: leadManager.getTicket
    return { status: 'success', data: { ticket_id: args.ticket_id, status: 'pending_diagnosis' } };
  },

  async send_payment_details(args) {
    // Mock sending payment details: create an order or return success
    try {
      // if it's a sale
      if (args.reason && args.amount) {
        return { status: 'success', data: { status: 'sent' } };
      }
      return { status: 'error', message: 'Invalid payment args' };
    } catch (e) { return { status: 'error', message: e.message }; }
  }
};

async function dispatch(toolName, args) {
  const h = handlers[toolName];
  if (!h) return { status: 'error', message: 'Unknown tool' };
  try {
    const res = await h(args || {});
    return res;
  } catch (e) {
    logWithTimestamp('Tool execution error', e);
    return { status: 'error', message: e.message };
  }
}

module.exports = { dispatch };

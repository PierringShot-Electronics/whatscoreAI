(async () => {
  const request = require('supertest');
  process.env.SKIP_WHATSAPP = 'true';
  const exported = require('../index.js');
  const app = exported.app || require('../index.js').app;
  const payload = { lead_id: 'ci-test', customer_phone: '994501234567', item_id: 'S001', quantity: 1 };
  const res = await request(app).post('/api/orders').send(payload);
  console.log('status', res.status);
  console.log('body', res.body);
})();

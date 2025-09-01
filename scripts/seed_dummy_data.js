const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const chatDir = path.join(dataDir, 'chat_histories');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(chatDir)) fs.mkdirSync(chatDir, { recursive: true });

// orders.csv
const ordersFile = path.join(dataDir, 'orders.csv');
if (!fs.existsSync(ordersFile)) {
  const header = 'order_id,lead_id,customer_phone,item_id,quantity,total_price,status,created_at\n';
  fs.writeFileSync(ordersFile, header, 'utf8');
}

const now = new Date();
const sampleOrders = [
  `PSE-${now.getTime()},lead-1,994501234567,P001,1,99.00,completed,${now.toISOString()}`,
  `PSE-${now.getTime()+1},lead-2,994501234568,P002,2,198.00,pending,${new Date(now.getTime()+1000).toISOString()}`,
  `PSE-${now.getTime()+2},,0000000000,UNKNOWN,1,0.00,dummy,${new Date(now.getTime()+2000).toISOString()}`,
];
fs.appendFileSync(ordersFile, sampleOrders.map(s=>s+'\n').join(''), 'utf8');

// services.csv (minimal) if missing
const servicesFile = path.join(dataDir, 'services.csv');
if (!fs.existsSync(servicesFile)) {
  const servicesHeader = 'id,title,description,price,cost,profit_margin,sale_price\n';
  const servicesRows = [
    'S001,Screen Repair,Phone screen repair service,30,15,0.2,36',
    'S002,Battery Replacement,Replace battery with new one,20,8,0.3,26',
  ];
  fs.writeFileSync(servicesFile, servicesHeader + servicesRows.join('\n') + '\n', 'utf8');
}

// sample chat history
const sampleChat = {
  chat_id: '994501234567@c.us',
  messages: [
    { sender: 'user', content: 'Salam, P001 haqqında məlumat verə bilərsiniz?', timestamp: now.toISOString() },
    { sender: 'assistant', content: 'Əlbəttə, P001 modelimiz mövcuddur. Qiymət 99 AZN-dir.', timestamp: new Date(now.getTime()+500).toISOString() }
  ]
};
fs.writeFileSync(path.join(chatDir, '994501234567.json'), JSON.stringify(sampleChat, null, 2), 'utf8');

// blacklist and stop lists
const blFile = path.join(dataDir, 'blacklist.json');
const stopFile = path.join(dataDir, 'stop_list.json');
if (!fs.existsSync(blFile)) fs.writeFileSync(blFile, JSON.stringify([], null, 2), 'utf8');
if (!fs.existsSync(stopFile)) fs.writeFileSync(stopFile, JSON.stringify([], null, 2), 'utf8');

console.log('✅ Dummy data seeded:');
console.log(' -', ordersFile);
console.log(' -', servicesFile);
console.log(' -', path.join(chatDir, '994501234567.json'));
console.log(' -', blFile);
console.log(' -', stopFile);

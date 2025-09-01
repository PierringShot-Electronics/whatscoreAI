/**
 * WhatsCore.AI - Maverick Edition
 *
 * WhatsApp API Controller - v5.0.0 (FINAL & COMPLETE)
 * YENİLİK: Bütün orijinal funksiyalar qorunub saxlanılıb və hamısı düzgün export edilib.
 * Bütün servislər (Order, Product, Service) tam inteqrasiya olunub.
 * Bu, sistemin son, stabil və tam versiyasıdır.
 */
// Lazy-load WhatsApp-specific classes to avoid pulling heavy deps during tests
let MessageMedia = null;
let Location = null;
function ensureWhatsAppClasses() {
  if (MessageMedia && Location) return;
  // In test mode, avoid requiring the library; only load when truly needed
  if (String(process.env.SKIP_WHATSAPP).toLowerCase() === 'true') {
    // Create stubs that throw if misused during tests
    MessageMedia = class { constructor() { throw new Error('MessageMedia unavailable in SKIP_WHATSAPP mode'); } static async fromUrl() { throw new Error('MessageMedia.fromUrl unavailable in SKIP_WHATSAPP mode'); } };
    Location = class { constructor() { throw new Error('Location unavailable in SKIP_WHATSAPP mode'); } };
    return;
  }
  ({ MessageMedia, Location } = require('whatsapp-web.js'));
}
const { logWithTimestamp } = require("../utils/logger");
const productManager = require("../services/productManager");
const serviceManager = require("../services/serviceManager");
const orderManager = require("../services/orderManager");

let whatsappClient;

function setWhatsAppClient(client) {
  whatsappClient = client;
  logWithTimestamp("✅ WhatsApp Klient instansiyası API kontrollerinə ötürüldü.");
}

// --- Status və Sessiya ---
async function getClientStatus(req, res) {
  if (!whatsappClient) return res.status(503).json({ status: "Error", message: "WhatsApp Klienti hazır deyil." });
  try {
    const state = await whatsappClient.getState();
    res.status(200).json({ status: "OK", clientState: state });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Klient statusunu almaq mümkün olmadı.", error: error.message });
  }
}

async function logoutClient(req, res) {
    if (!whatsappClient) return res.status(503).json({ status: "Error", message: "Klient hazır deyil." });
    try {
      await whatsappClient.logout();
      logWithTimestamp("🚪 WhatsApp Klientindən uğurla çıxış edildi.");
      res.status(200).json({ status: "OK", message: "WhatsApp Klientindən uğurla çıxış edildi." });
    } catch (error) {
      res.status(500).json({ status: "Error", message: "Çıxış etmək mümkün olmadı.", error: error.message });
    }
}

async function resetClientSession(req, res) {
  if (!whatsappClient) return res.status(503).json({ status: "Error", message: "WhatsApp Klient instansiyası hazır deyil." });
  try {
    await whatsappClient.destroy();
    logWithTimestamp("🔄 WhatsApp Klient sessiyası sıfırlandı. Tətbiqi yenidən başladın.");
    res.status(200).json({ status: "OK", message: "Sessiya sıfırlandı. Tətbiqi yenidən başladın." });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Sessiyanı sıfırlamaq mümkün olmadı.", error: error.message });
  }
}


// --- Mesaj Göndərmə ---
async function sendText(req, res) {
  const { number, message } = req.body;
  if (!number || !message) return res.status(400).json({ status: "Error", message: "Nömrə və mesaj boş ola bilməz." });
  try {
    const chatId = `${number}@c.us`;
    await whatsappClient.sendMessage(chatId, message);
    res.status(200).json({ status: "OK", message: "Mətn mesajı uğurla göndərildi." });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Mesaj göndərmək mümkün olmadı.", error: error.message });
  }
}

async function sendMedia(req, res) {
  const { number, fileUrl, caption } = req.body;
  if (!number || !fileUrl) return res.status(400).json({ status: "Error", message: "Nömrə və fayl URL-i boş ola bilməz." });
  try {
    ensureWhatsAppClasses();
    const media = await MessageMedia.fromUrl(fileUrl, { unsafeMime: true });
    await whatsappClient.sendMessage(`${number}@c.us`, media, { caption: caption });
    res.status(200).json({ status: "OK", message: "Media mesajı uğurla göndərildi." });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Media mesajı göndərmək mümkün olmadı.", error: error.message });
  }
}

async function sendLocation(req, res) {
  const { number, latitude, longitude, description } = req.body;
  if (!number || !latitude || !longitude) return res.status(400).json({ status: "Error", message: "Nömrə, enlik və uzunluq boş ola bilməz." });
  try {
    ensureWhatsAppClasses();
    const location = new Location(latitude, longitude, description);
    await whatsappClient.sendMessage(`${number}@c.us`, location);
    res.status(200).json({ status: "OK", message: "Məkan uğurla göndərildi." });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Məkan göndərmək mümkün olmadı.", error: error.message });
  }
}

async function sendContact(req, res) {
    const { number, contactId } = req.body;
    if (!number || !contactId) return res.status(400).json({ status: "Error", message: "Nömrə və ya kontakt ID-si boş ola bilməz." });
    try {
        const contact = await whatsappClient.getContactById(contactId);
        await whatsappClient.sendMessage(`${number}@c.us`, contact);
        res.status(200).json({ status: "OK", message: "Kontakt uğurla göndərildi." });
    } catch (error) {
        res.status(500).json({ status: "Error", message: "Kontakt göndərmək mümkün olmadı.", error: error.message });
    }
}

// Flexible send endpoint: supports GET and POST. Query/body params: type=text|media|location|contact, number, message, fileUrl, caption, latitude, longitude
async function sendAny(req, res) {
  const data = Object.assign({}, req.query || {}, req.body || {});
  const { type = 'text', number } = data;
  if (!number) return res.status(400).json({ status: 'Error', message: 'number is required' });
  try {
    const chatId = `${number}@c.us`;
    if (!whatsappClient) return res.status(503).json({ status: 'Error', message: 'WhatsApp client not initialized' });
    if (type === 'text') {
      await whatsappClient.sendMessage(chatId, data.message || data.text || '');
    } else if (type === 'media') {
      const media = await MessageMedia.fromUrl(data.fileUrl, { unsafeMime: true });
      await whatsappClient.sendMessage(chatId, media, { caption: data.caption });
    } else if (type === 'location') {
      const loc = new Location(data.latitude, data.longitude, data.description || '');
      await whatsappClient.sendMessage(chatId, loc);
    } else if (type === 'contact') {
      const contact = await whatsappClient.getContactById(data.contactId);
      await whatsappClient.sendMessage(chatId, contact);
    } else {
      return res.status(400).json({ status: 'Error', message: 'Unsupported type' });
    }
    return res.status(200).json({ status: 'OK', message: 'Sent' });
  } catch (error) {
    return res.status(500).json({ status: 'Error', message: error.message });
  }
}

// Blacklist / STOP management via API
function addToBlacklistApi(req, res) {
  const { chatId, reason } = Object.assign({}, req.body || {}, req.query || {});
  if (!chatId) return res.status(400).json({ status: 'Error', message: 'chatId is required' });
  try { require('../services/historyManager').addToBlacklist(chatId, reason); return res.status(200).json({ status: 'OK' }); } catch (e) { return res.status(500).json({ status: 'Error', message: e.message }); }
}

function removeFromBlacklistApi(req, res) {
  const { chatId } = Object.assign({}, req.body || {}, req.query || {});
  if (!chatId) return res.status(400).json({ status: 'Error', message: 'chatId is required' });
  try { require('../services/historyManager').removeFromBlacklist(chatId); return res.status(200).json({ status: 'OK' }); } catch (e) { return res.status(500).json({ status: 'Error', message: e.message }); }
}

function addStopApi(req, res) {
  const { chatId } = Object.assign({}, req.body || {}, req.query || {});
  if (!chatId) return res.status(400).json({ status: 'Error', message: 'chatId is required' });
  try { require('../services/historyManager').addStop(chatId); return res.status(200).json({ status: 'OK' }); } catch (e) { return res.status(500).json({ status: 'Error', message: e.message }); }
}

function removeStopApi(req, res) {
  const { chatId } = Object.assign({}, req.body || {}, req.query || {});
  if (!chatId) return res.status(400).json({ status: 'Error', message: 'chatId is required' });
  try { require('../services/historyManager').removeStop(chatId); return res.status(200).json({ status: 'OK' }); } catch (e) { return res.status(500).json({ status: 'Error', message: e.message }); }
}

// --- Məlumatların İdarəsi (Products, Services, Orders) ---
function getProducts(req, res) {
  const q = req.query.q;
  if (q) {
    const results = productManager.searchKnowledgeBase(q, { limit: 10 });
    return res.status(200).json({ status: "OK", query: q, count: results.length, data: results });
  }
  res.status(200).json({ status: "OK", data: productManager.getProducts() });
}

function getServices(req, res) {
    res.status(200).json({ status: "OK", data: serviceManager.getServices() });
}

function getAllOrders(req, res) {
    res.status(200).json({ status: "OK", data: orderManager.getAllOrders() });
}

async function createOrder(req, res) {
  try {
    // Normalize payload to support item_id/itemId/item and customer_phone variants
    const body = req.body || {};
    const payload = {
      lead_id: body.lead_id || body.leadId || body.lead || '',
      customer_phone: body.customer_phone || body.customerPhone || body.customer || '',
      item_id: body.item_id || body.itemId || (body.item && (body.item.id || body.itemId)) || body.item || null,
      quantity: typeof body.quantity !== 'undefined' ? body.quantity : (body.qty || 1),
    };

    const newOrder = await orderManager.createOrder(payload);
    if (whatsappClient && newOrder.customer_phone) {
      const phoneForSend = newOrder.customer_phone.includes('@') ? newOrder.customer_phone : `${newOrder.customer_phone}@c.us`;
      const confirmationMessage = `Hörmətli müştəri, ${newOrder.order_id} nömrəli sifarişiniz uğurla qeydə alındı. Təşəkkür edirik!`;
      try { await whatsappClient.sendMessage(phoneForSend, confirmationMessage); } catch (e) { /* ignore send errors */ }
    }
    res.status(201).json({ status: "OK", message: "Sifariş yaradıldı.", data: newOrder });
  } catch (error) {
    res.status(400).json({ status: "Error", message: error.message });
  }
}

// --- Söhbət (Chat) İdarəetməsi ---
async function getChats(req, res) {
  try {
    const chats = await whatsappClient.getChats();
    res.status(200).json({
      status: "OK",
      data: chats.map(c => ({ id: c.id._serialized, name: c.name, isGroup: c.isGroup, unreadCount: c.unreadCount })),
    });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Söhbətləri almaq mümkün olmadı.", error: error.message });
  }
}

async function archiveChat(req, res) {
  const { chatId } = req.body;
  if (!chatId) return res.status(400).json({ status: "Error", message: "Söhbət ID-si boş ola bilməz." });
  try {
    const chat = await whatsappClient.getChatById(chatId);
    await chat.archive();
    res.status(200).json({ status: "OK", message: `Söhbət ${chatId} uğurla arxivləndi.` });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Söhbəti arxivləmək mümkün olmadı.", error: error.message });
  }
}

async function unarchiveChat(req, res) {
  const { chatId } = req.body;
  if (!chatId) return res.status(400).json({ status: "Error", message: "Söhbət ID-si boş ola bilməz." });
  try {
    const chat = await whatsappClient.getChatById(chatId);
    await chat.unarchive();
    res.status(200).json({ status: "OK", message: `Söhbət ${chatId} uğurla arxivdən çıxarıldı.` });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Söhbəti arxivdən çıxarmaq mümkün olmadı.", error: error.message });
  }
}

async function pinMessage(req, res) {
    const { messageId } = req.body;
    if (!messageId) return res.status(400).json({ status: "Error", message: "Mesaj ID-si boş ola bilməz." });
    try {
      const message = await whatsappClient.getMessageById(messageId);
      await message.pin();
      res.status(200).json({ status: "OK", message: `Mesaj ${messageId} uğurla pinləndi.` });
    } catch (error) {
      res.status(500).json({ status: "Error", message: "Mesajı pinləmək mümkün olmadı.", error: error.message });
    }
}

async function unpinMessage(req, res) {
    const { messageId } = req.body;
    if (!messageId) return res.status(400).json({ status: "Error", message: "Mesaj ID-si boş ola bilməz." });
    try {
        const message = await whatsappClient.getMessageById(messageId);
        await message.unpin();
        res.status(200).json({ status: "OK", message: `Mesaj ${messageId} pini uğurla ləğv edildi.` });
    } catch (error) {
        res.status(500).json({ status: "Error", message: "Mesajın pinini ləğv etmək mümkün olmadı.", error: error.message });
    }
}

async function markChatAsRead(req, res) {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ status: "Error", message: "Söhbət ID-si boş ola bilməz." });
    try {
      const chat = await whatsappClient.getChatById(chatId);
      await chat.sendSeen();
      res.status(200).json({ status: "OK", message: `Söhbət ${chatId} oxunmuş kimi işarələndi.` });
    } catch (error) {
      res.status(500).json({ status: "Error", message: "Söhbəti oxunmuş kimi işarələmək mümkün olmadı.", error: error.message });
    }
}
  
async function markChatAsUnread(req, res) {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ status: "Error", message: "Söhbət ID-si boş ola bilməz." });
    try {
        const chat = await whatsappClient.getChatById(chatId);
        await chat.markUnread();
        res.status(200).json({ status: "OK", message: `Söhbət ${chatId} oxunmamış kimi işarələndi.` });
    } catch (error) {
        res.status(500).json({ status: "Error", message: "Söhbəti oxunmamış kimi işarələmək mümkün olmadı.", error: error.message });
    }
}

// --- Kontakt (Contact) İdarəetməsi ---
async function getContactInfo(req, res) {
  const { number } = req.query;
  if (!number) return res.status(400).json({ status: "Error", message: "Nömrə boş ola bilməz." });
  try {
    const contact = await whatsappClient.getContactById(`${number}@c.us`);
    res.status(200).json({ status: "OK", data: { id: contact.id._serialized, name: contact.name || contact.pushname, isBlocked: contact.isBlocked, isBusiness: contact.isBusiness }});
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Kontakt məlumatını almaq mümkün olmadı.", error: error.message });
  }
}

async function getProfilePicUrl(req, res) {
  const { number } = req.query;
  if (!number) return res.status(400).json({ status: "Error", message: "Nömrə boş ola bilməz." });
  try {
    const url = await whatsappClient.getProfilePicUrl(`${number}@c.us`);
    res.status(200).json({ status: "OK", data: { profilePicUrl: url } });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Profil şəkli URL-i almaq mümkün olmadı.", error: error.message });
  }
}

async function getAllContacts(req, res) {
  try {
    const contacts = await whatsappClient.getContacts();
    res.status(200).json({
      status: "OK",
      data: contacts.map(c => ({ id: c.id._serialized, name: c.name || c.pushname || c.id._serialized, isBusiness: c.isBusiness })),
    });
  } catch (error) {
    res.status(500).json({ status: "Error", message: "Bütün kontaktları almaq mümkün olmadı.", error: error.message });
  }
}

module.exports = {
  setWhatsAppClient,
  // Sessiya və Status
  getClientStatus,
  logoutClient,
  resetClientSession,
  // Mesajlar
  sendText,
  sendMedia,
  sendLocation,
  sendContact,
  // Məlumatlar
  getProducts,
  getServices,
  getAllOrders,
  createOrder,
  // Söhbətlər
  getChats,
  archiveChat,
  unarchiveChat,
  pinMessage,
  unpinMessage,
  markChatAsRead,
  markChatAsUnread,
  // Kontaktlar
  getContactInfo,
  getProfilePicUrl,
  getAllContacts,
  // Flexible send and moderation
  sendAny,
  addToBlacklistApi,
  removeFromBlacklistApi,
  addStopApi,
  removeStopApi,
};

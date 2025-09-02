/**
 * WhatsCore.AI - Maverick Edition
 *
 * API Routes - v5.0.2 (FINAL & STABLE)
 * YENİLİK: Bütün marşrutlar (routes) ən son whatsappController ilə tam sinxronlaşdırıldı.
 * 'Undefined' callback xətası və köhnəlmiş endpointlər tamamilə aradan qaldırıldı.
 */
const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { logWithTimestamp } = require('../utils/logger');
const { validate } = require('../middleware/validate');
const orderSchema = require('../schemas/order.schema.json');
const sendSchema = require('../schemas/send.schema.json');

// Middleware: Bütün API sorğularını loglayır
router.use((req, res, next) => {
    logWithTimestamp(`🌐 API Sorğusu Alındı: ${req.method} ${req.originalUrl}`);
    next();
});

// Health
router.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// --- Status və Sessiya Marşrutları ---
router.get('/status', whatsappController.getClientStatus);
router.post('/logout', whatsappController.logoutClient);
router.post('/reset', whatsappController.resetClientSession);

// --- Mesaj Göndərmə Marşrutları ---
router.post('/send/text', validate(sendSchema), whatsappController.sendText);
router.post('/send/media', validate(sendSchema), whatsappController.sendMedia);
router.post('/send/location', validate(sendSchema), whatsappController.sendLocation);
router.post('/send/contact', validate(sendSchema), whatsappController.sendContact);
// Flexible endpoints: GET/POST /send will call sendAny (validate POST bodies)
router.get('/send', whatsappController.sendAny);
router.post('/send', validate(sendSchema), whatsappController.sendAny);

// Blacklist and STOP management
router.post('/moderation/blacklist/add', whatsappController.addToBlacklistApi);
router.post('/moderation/blacklist/remove', whatsappController.removeFromBlacklistApi);
router.post('/moderation/stop/add', whatsappController.addStopApi);
router.post('/moderation/stop/remove', whatsappController.removeStopApi);

// --- Məlumatların İdarəsi Marşrutları ---
router.get('/products', whatsappController.getProducts);
router.get('/services', whatsappController.getServices);
router.get('/products/categories', whatsappController.getProductCategories);
router.get('/services/categories', whatsappController.getServiceCategories);
router.get('/orders', whatsappController.getAllOrders);
router.post('/orders', validate(orderSchema), whatsappController.createOrder);

// --- Söhbət (Chat) İdarəetmə Marşrutları ---
router.get('/chats', whatsappController.getChats);
router.post('/chats/archive', whatsappController.archiveChat);
router.post('/chats/unarchive', whatsappController.unarchiveChat);
router.post('/chats/pin', whatsappController.pinMessage);
router.post('/chats/unpin', whatsappController.unpinMessage);
router.post('/chats/mark-read', whatsappController.markChatAsRead);
router.post('/chats/mark-unread', whatsappController.markChatAsUnread);

// --- Kontakt (Contact) İdarəetmə Marşrutları ---
router.get('/contacts', whatsappController.getAllContacts);
router.get('/contacts/info', whatsappController.getContactInfo);
router.get('/contacts/profile-pic', whatsappController.getProfilePicUrl);

module.exports = router;

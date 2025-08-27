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

// Middleware: Bütün API sorğularını loglayır
router.use((req, res, next) => {
    logWithTimestamp(`🌐 API Sorğusu Alındı: ${req.method} ${req.originalUrl}`);
    next();
});

// --- Status və Sessiya Marşrutları ---
router.get('/status', whatsappController.getClientStatus);
router.post('/logout', whatsappController.logoutClient);
router.post('/reset', whatsappController.resetClientSession);

// --- Mesaj Göndərmə Marşrutları ---
router.post('/send/text', whatsappController.sendText);
router.post('/send/media', whatsappController.sendMedia);
router.post('/send/location', whatsappController.sendLocation);
router.post('/send/contact', whatsappController.sendContact);

// --- Məlumatların İdarəsi Marşrutları ---
router.get('/products', whatsappController.getProducts);
router.get('/services', whatsappController.getServices);
router.get('/orders', whatsappController.getAllOrders);
router.post('/orders', whatsappController.createOrder);

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

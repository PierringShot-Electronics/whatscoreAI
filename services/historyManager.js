/**
 * WhatsCore.AI - Maverick Edition
 *
 * Söhbət Tarixçəsi Meneceri (Lokal Fayl Sistemi ilə) - v4.5.2
 * YENİLİK: Söhbət tarixçəsini və mesajları lokal JSON fayllarında saxlayır.
 */
const fs = require('fs-extra'); // fs-extra istifadə edirik ki, qovluq yaratmaq asan olsun
const path = require('path');
const { logWithTimestamp } = require('../utils/logger');

// Çat tarixçələrinin saxlanılacağı qovluq
const CHAT_HISTORIES_DIR = path.join(__dirname, '..', 'data', 'chat_histories');

// Qovluğun mövcud olmasını təmin edirik
fs.ensureDirSync(CHAT_HISTORIES_DIR);
logWithTimestamp(`✅ Çat tarixçəsi qovluğu hazır: ${CHAT_HISTORIES_DIR}`);
// Blacklist & STOP lists
const BLACKLIST_FILE = path.join(__dirname, '..', 'data', 'blacklist.json');
const STOP_LIST_FILE = path.join(__dirname, '..', 'data', 'stop_list.json');
fs.ensureFileSync(BLACKLIST_FILE);
fs.ensureFileSync(STOP_LIST_FILE);

function readJsonSafe(file) {
    try { const raw = fs.readFileSync(file, 'utf8'); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
}

function writeJsonSafe(file, obj) {
    fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8');
}

function isBlacklisted(chatId) {
    const data = readJsonSafe(BLACKLIST_FILE) || {};
    return !!data[chatId];
}

function addToBlacklist(chatId, reason = '') {
    const data = readJsonSafe(BLACKLIST_FILE) || {};
    data[chatId] = { since: new Date().toISOString(), reason };
    writeJsonSafe(BLACKLIST_FILE, data);
}

function removeFromBlacklist(chatId) {
    const data = readJsonSafe(BLACKLIST_FILE) || {};
    delete data[chatId];
    writeJsonSafe(BLACKLIST_FILE, data);
}

function hasStopped(chatId) {
    const data = readJsonSafe(STOP_LIST_FILE) || {};
    return !!data[chatId];
}

function addStop(chatId) {
    const data = readJsonSafe(STOP_LIST_FILE) || {};
    data[chatId] = { since: new Date().toISOString() };
    writeJsonSafe(STOP_LIST_FILE, data);
}

function removeStop(chatId) {
    const data = readJsonSafe(STOP_LIST_FILE) || {};
    delete data[chatId];
    writeJsonSafe(STOP_LIST_FILE, data);
}

/**
 * Verilmiş söhbət üçün lokal JSON faylından mesaj tarixçəsini oxuyur.
 * @param {string} chatId - Söhbət ID-si (məsələn, WhatsApp nömrəsi).
 * @returns {Promise<Array<Object>>} Söhbət mesajlarının massivi.
 */
async function getHistory(chatId) {
    const filePath = path.join(CHAT_HISTORIES_DIR, `${chatId}.json`);
    try {
        if (await fs.pathExists(filePath)) {
            const fileContent = await fs.readFile(filePath, 'utf8');
            const history = JSON.parse(fileContent);
            logWithTimestamp(`📜 Lokal fayldan tarixçə alındı [${chatId}]: ${history.length} mesaj.`);
            return history;
        } else {
            logWithTimestamp(`ℹ️ Lokal tarixçə faylı tapılmadı [${chatId}]. Yeni tarixçə yaradılır.`);
            return [];
        }
    } catch (error) {
        logWithTimestamp(`❌ Lokal tarixçə faylını oxuma xətası [${chatId}]:`, error.message);
        return [];
    }
}

/**
 * Yeni mesajı lokal JSON faylına əlavə edir.
 * Hər mesaj, mövcud tarixçəyə əlavə olunaraq fayla yenidən yazılır.
 * @param {string} chatId - Söhbət ID-si.
 * @param {Object} messageData - Saxlanılacaq mesaj məlumatları (type, content, sender, quotedMsgId, mediaInfo, vb.).
 * @param {string} messageId - Mesajın unikal ID-si (message.id._serialized).
 */
async function saveMessage(chatId, messageData, messageId) {
    const filePath = path.join(CHAT_HISTORIES_DIR, `${chatId}.json`);
    try {
        let history = await getHistory(chatId);
        
        // Eyni mesajı təkrar yaza bilmə ehtimalını azaltmaq üçün yoxlama
        const existingMessage = history.find(msg => msg.messageId === messageId);
        if (existingMessage) {
            logWithTimestamp(`⚠️ Mesaj artıq mövcuddur, təkrar saxlanılmır [${chatId}][${messageId}].`);
            return;
        }

        const newMessage = {
            ...messageData,
            messageId: messageId,
            timestamp: new Date().getTime() // Mesajın göndərilmə vaxtı
        };
        
        history.push(newMessage);
        await fs.writeFile(filePath, JSON.stringify(history, null, 2), 'utf8'); // Səliqəli format üçün null, 2
        logWithTimestamp(`💾 Lokal fayla mesaj saxlanıldı [${chatId}][${messageId}].`);
    } catch (error) {
        logWithTimestamp(`❌ Lokal fayla mesaj saxlama xətası [${chatId}][${messageId}]:`, error.message);
    }
}

// Modulun export etdiyi funksiyalar
async function appendMediaEntry(chatId, mediaType, textRepresentation, messageId) {
    // mediaType e.g. 'image'|'audio'|'video' ; textRepresentation is a caption/transcript
    const entry = {
        type: 'media',
        mediaType,
        content: textRepresentation,
    };
    await saveMessage(chatId, entry, messageId || `media-${Date.now()}`);
}

module.exports = {
    getHistory,
    saveHistory: saveMessage, // 'saveHistory' adı ilə 'saveMessage' funksiyasını təqdim edirik
    appendMediaEntry,
    // Exporting blacklist/stop functions
    isBlacklisted,
    addToBlacklist,
    removeFromBlacklist,
    hasStopped,
    addStop,
    removeStop
};


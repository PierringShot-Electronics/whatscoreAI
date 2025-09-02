const AgentOrchestrator = require('../src/agents/orchestrator');
const WorkflowAgent = require('../src/agents/workflowAgent');
const historyManager = require('../services/historyManager');
const leadManager = require('../services/leadManager');
const productManager = require('../services/productManager');
const orderManager = require('../services/orderManager');
const ai = require('../services/ai');
const { logWithTimestamp } = require('../utils/logger');
const { getSystemPrompt } = require('../prompts/assistant_prompt');

// Initialize the agent orchestrator
const orchestrator = new AgentOrchestrator();
const workflowAgent = new WorkflowAgent();

async function handleMessage(client, message) {
    const chatId = message.from;
    const customerPhone = String(chatId).split('@')[0];

    try {
        if (!message || message.fromMe || message.isStatus || message.isGroup) return;

        // Check blacklist/STOP
        if (historyManager.isBlacklisted && historyManager.isBlacklisted(chatId)) {
            logWithTimestamp(`⛔ Mesaj emalından kənarlaşdırılmış [${chatId}]`);
            return;
        }

        logWithTimestamp(`📨 Yeni mesaj alındı: [${chatId}] | Tip: [${message.type}]`);

        let lead = null;
        if (leadManager.findOrCreateLead) {
            try { lead = await leadManager.findOrCreateLead(chatId); } catch (e) { /* ignore */ }
        }

        let history = [];
        if (historyManager.getHistory) {
            try { history = await historyManager.getHistory(chatId) || []; } catch (e) { history = []; }
        }

        let userContent = message.body || '';

        // Detect STOP command (case-insensitive)
        if (typeof userContent === 'string' && userContent.trim().toLowerCase() === 'stop') {
            if (historyManager.addStop) historyManager.addStop(chatId);
            if (client && typeof client.sendMessage === 'function') {
                try { await client.sendMessage(chatId, 'Söhbəti dayandırmaq üçün tələb qəbul edildi. Yenidən başlatmaq üçün START yazın.'); } catch (_) {}
            }
            return;
        }

        // If user has previously asked to stop, do not process
        if (historyManager.hasStopped && historyManager.hasStopped(chatId)) {
            logWithTimestamp(`⏸️ Bu istifadəçi ilə cavablar dayandırılıb [${chatId}].`);
            return;
        }

        try {
            // Process message through the workflow system
            const task = {
                type: 'message_processing',
                data: {
                    message,
                    lead,
                    history,
                    customerPhone
                },
                context: {
                    chatId,
                    client,
                    systemPrompt: getSystemPrompt()
                }
            };

            // Register workflow agent if not already registered
            if (!orchestrator.agents.has(workflowAgent.id)) {
                orchestrator.registerAgent(workflowAgent);
            }

            const result = await orchestrator.dispatch(task);

            if (result.status === 'completed' && result.result) {
                if (typeof result.result === 'string') {
                    await client.sendMessage(chatId, result.result);
                } else if (result.result.message) {
                    await client.sendMessage(chatId, result.result.message);
                }
            }
        } catch (error) {
            logWithTimestamp(`❌ Mesaj emalı xətası:`, error);
            await client.sendMessage(chatId, 'Bağışlayın, mesajınızı emal edərkən xəta baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.');
        }

        if (message.hasMedia) {
            try {
                // Notify the user that media arrived and is being processed
                if (client && typeof client.sendMessage === 'function') {
                    try { await client.sendMessage(chatId, '⏳ Media faylı qəbul edildi, emal edilir...'); } catch (_) {}
                }
                if (client && client.sendStateTyping && typeof client.sendStateTyping === 'function') {
                    try { await client.sendStateTyping(chatId); } catch (_) {}
                }

                const media = await message.downloadMedia();
                if (media && media.mimetype && media.mimetype.startsWith('image/')) {
                    if (ai.getVisionResponse) {
                        try {
                            const v = await ai.getVisionResponse(media);
                            const caption = (v && (v.caption || v.text)) ? (v.caption || v.text) : '(image)';
                            userContent += '\n' + caption;
                            if (historyManager.appendMediaEntry) await historyManager.appendMediaEntry(chatId, 'image', caption, message.id && message.id._serialized);
                            if (client && typeof client.sendMessage === 'function') {
                                try { await client.sendMessage(chatId, '✅ Şəkil emalı tamamlandı.'); } catch (_) {}
                            }
                        } catch (e) { /* ignore */ }
                    }
                } else if (media && media.mimetype && media.mimetype.startsWith('audio/')) {
                    if (ai.transcribeAudio) {
                        try {
                            const t = await ai.transcribeAudio(media);
                            const transcript = t || '(audio)';
                            userContent += '\n' + transcript;
                            if (historyManager.appendMediaEntry) await historyManager.appendMediaEntry(chatId, 'audio', transcript, message.id && message.id._serialized);
                            if (client && typeof client.sendMessage === 'function') {
                                try { await client.sendMessage(chatId, '✅ Səs transkripsiyası tamamlandı.'); } catch (_) {}
                            }
                        } catch (e) { /* ignore */ }
                    }
                } else {
                    // For other media types, store a generic media entry
                    const mt = media.mimetype ? media.mimetype.split('/')[0] : 'file';
                    const label = `(${mt})`;
                    userContent += '\n' + label;
                    if (historyManager.appendMediaEntry) await historyManager.appendMediaEntry(chatId, mt, label, message.id && message.id._serialized);
                    if (client && typeof client.sendMessage === 'function') {
                        try { await client.sendMessage(chatId, `✅ Media (${mt}) qəbul edildi.`); } catch (_) {}
                    }
                }
            } catch (e) { /* ignore media errors */ }
        }

        if (!userContent || !userContent.trim()) {
            logWithTimestamp('Boş mesaj, emal dayandırıldı.');
            return;
        }

        history.push({ role: 'user', content: userContent });
        const systemPrompt = getSystemPrompt ? getSystemPrompt() : '';
        let aiResponse = null;
        if (ai && ai.getAIResponse) {
            try {
                // Indicate typing while AI processes
                if (client && client.sendStateTyping && typeof client.sendStateTyping === 'function') {
                    try { await client.sendStateTyping(chatId); } catch (_) {}
                }
                aiResponse = await ai.getAIResponse(systemPrompt, history);
            } catch (e) { aiResponse = null; }
        }

        let finalReply = aiResponse ? (typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse)) : 'Üzr istəyirəm, sistemdə AI xidməti mövcud deyil.';

        try {
            const parsed = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
            if (parsed && parsed.action) {
                if (parsed.action === 'search_knowledge_base') {
                    const q = parsed.details?.query || userContent;
                    const results = productManager.searchKnowledgeBase(q, { limit: 6 });
                    finalReply = results.length ? `Bilik bazasından tapılanlar (${results.length}):\n` + results.map(r => `- ${r.id}: ${r.name} — ${r.sale_price}₼`).join('\n') : 'Üzr istəyirəm, sorğunuzla uyğun məhsul/xidmət tapılmadı.';
                } else if (parsed.action === 'create_order') {
                    const details = parsed.details || parsed;
                    const payload = {
                        lead_id: lead?.lead_id || '',
                        customer_phone: customerPhone,
                        item_id: details.item?.id || details.item_id || details.itemId,
                        quantity: details.item?.quantity || details.quantity || 1,
                    };
                    try { const order = await orderManager.createOrder(payload); finalReply = `Sifarişiniz qəbul edildi. Sifariş nömrəsi: ${order.order_id}. Təşəkkür edirik!`; } catch (e) { finalReply = `Sifariş yaradıla bilmədi: ${e.message}`; }
                }
            }
        } catch (e) { /* ignore parse errors */ }

        if (client && typeof client.sendMessage === 'function') {
            try { await client.sendMessage(chatId, finalReply); } catch (e) { /* ignore send errors */ }
        }

        try { history.push({ role: 'assistant', content: finalReply }); if (historyManager.saveHistory) await historyManager.saveHistory(chatId, history); } catch (e) {}

    } catch (error) {
        logWithTimestamp(`❌ Mesaj emalı zamanı kritik xəta [${chatId}]:`, error);
        try { if (client && typeof client.sendMessage === 'function') await client.sendMessage(chatId, '🤖 Xəta baş verdi. Sistemdə müvəqqəti problem yaranıb. Zəhmət olmasa bir az sonra yenidən cəhd edin.'); } catch (_) {}
    }
}

module.exports = { handleMessage };

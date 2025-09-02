/**
 * WhatsCore.AI - Maverick Edition
 *
 * Lead Manager (Service) - v1.0.0
 * Bu servis, müştəri müraciətlərini (lead) yaratmaq, izləmək və
 * statuslarını idarə etmək üçün məsuliyyət daşıyır.
 * Məlumatlar müvəqqəti olaraq data/leads.json faylında saxlanılır.
 */

const fs = require('fs-extra');
const path = require('path');
const { logWithTimestamp } = require('../utils/logger');

// Bütün lead-lərin saxlanacağı JSON faylının yolu
const leadsFilePath = path.join(__dirname, '..', 'data', 'leads.json');

/**
 * Bütün lead-ləri JSON faylından oxuyur. Fayl yoxdursa, yaradır.
 * @returns {Promise<object>} Lead obyektlərini ehtiva edən bir obyekt.
 */
async function getAllLeads() {
    try {
        // Faylın mövcud olduğundan əmin oluruq, yoxdursa yaradır.
        await fs.ensureFile(leadsFilePath);
        const data = await fs.readFile(leadsFilePath, 'utf8');
        // Fayl boşdursa, boş obyekt qaytarırıq.
        return data ? JSON.parse(data) : {};
    } catch (error) {
        logWithTimestamp('❌ Lead faylını oxumaq mümkün olmadı:', error);
        return {};
    }
}

/**
 * Verilmiş lead obyektini JSON faylına yazır.
 * @param {object} leads - Yazılacaq lead-lərin tam obyekti.
 */
async function saveAllLeads(leads) {
    try {
        await fs.writeJson(leadsFilePath, leads, { spaces: 2 });
    } catch (error) {
        logWithTimestamp('❌ Lead faylına yazmaq mümkün olmadı:', error);
    }
}

/**
 * Verilmiş telefon nömrəsi (chatId) üçün mövcud lead-i tapır.
 * Əgər tapılmazsa, yeni bir lead yaradır.
 * @param {string} chatId - Müştərinin WhatsApp nömrəsi.
 * @returns {Promise<object>} Tapılmış və ya yeni yaradılmış lead obyekti.
 */
async function findOrCreateLead(chatId) {
    const leads = await getAllLeads();
    // Nömrəyə görə mövcud lead-i axtarırıq
    let lead = Object.values(leads).find(l => l.customer_phone === chatId);

    if (lead) {
        logWithTimestamp(`ℹ️ Mövcud lead tapıldı: [${lead.lead_id}] üçün [${chatId}]`);
        return lead;
    }

    // Yeni lead üçün unikal ID generasiya edirik
    const date = new Date();
    const lead_id = `PS-${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    lead = {
        lead_id: lead_id,
        customer_phone: chatId,
        status: 'yeni', // İlkin status
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
        // Gələcəkdə bu lead ilə bağlı əsas hadisələri bura yaza bilərik
        notes: [] 
    };

    leads[lead_id] = lead;
    await saveAllLeads(leads);
    logWithTimestamp(`✅ Yeni lead yaradıldı: [${lead.lead_id}] üçün [${chatId}]`);
    return lead;
}

/**
 * Müəyyən bir lead-in statusunu yeniləyir.
 * @param {string} leadId - Yenilənəcək lead-in ID-si.
 * @param {string} newStatus - Təyin ediləcək yeni status.
 * @returns {Promise<object|null>} Yenilənmiş lead obyekti və ya tapılmadıqda null.
 */
async function updateLeadStatus(leadId, newStatus) {
    const leads = await getAllLeads();
    if (leads[leadId]) {
        leads[leadId].status = newStatus;
        leads[leadId].updated_at = new Date().toISOString();
        await saveAllLeads(leads);
        logWithTimestamp(`🔄 Lead statusu yeniləndi: [${leadId}] -> ${newStatus}`);
        return leads[leadId];
    }
    logWithTimestamp(`❌ Statusu yeniləmək üçün Lead tapılmadı: [${leadId}]`);
    return null;
}

module.exports = {
    findOrCreateLead,
    updateLeadStatus
};


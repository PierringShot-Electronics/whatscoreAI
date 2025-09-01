/**
 * WhatsCore.AI - Maverick Edition
 *
 * Xidmət Meneceri (Service Manager) - v4.5
 * YENİLİK: services.csv faylından məlumatları oxuyur və axtarış funksiyası təmin edir.
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { logWithTimestamp } = require('../utils/logger');

const SERVICES_DB_PATH = path.join(__dirname, '..', 'data', 'services.csv');
let services = [];

try {
    if (fs.existsSync(SERVICES_DB_PATH)) {
        const fileContent = fs.readFileSync(SERVICES_DB_PATH);
        services = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: (value, context) => {
                if (context.column === 'price') {
                    return parseFloat(value) || 0;
                }
                return value;
            }
        });
        logWithTimestamp(`✅ ${services.length} xidmət CSV verilənlər bazasından uğurla yükləndi.`);
    } else {
        logWithTimestamp(`⚠️ Xidmət verilənlər bazası tapılmadı: ${SERVICES_DB_PATH}`);
    }
} catch (error) {
    logWithTimestamp(`❌ Xidmət verilənlər bazasını oxumaq mümkün olmadı:`, error);
    services = [];
}

/**
 * Xidmətləri açar sözlərə görə axtarır.
 * @param {string} query - Axtarış üçün istifadəçi sorğusu və ya xidmət ID-si.
 * @returns {Array} - Tapılan xidmətlərin massivi.
 */
function searchServices(query) {
    if (!query || query.length < 3) return [];

    const lowerCaseQuery = query.toLowerCase().trim();

    // Dəqiq ID ilə axtarış
    const byId = services.find(s => s.id && s.id.toLowerCase() === lowerCaseQuery);
    if (byId) return [byId];

    // Ad, təsvir və etiketlərdə (tags) axtarış
    const searchTerms = lowerCaseQuery.split(/\s+/).filter(term => term.length > 2);
    if (searchTerms.length === 0) return [];

    return services.filter(service => {
        const serviceName = (service.name || '').toLowerCase();
        const serviceDescription = (service.description || '').toLowerCase();
        const serviceCategory = (service.category || '').toLowerCase();
        const serviceTags = (service.tags || '').toLowerCase();

        // Bütün axtarış sözləri məhsul məlumatlarında mövcud olmalıdır
        return searchTerms.every(term =>
            serviceName.includes(term) ||
            serviceDescription.includes(term) ||
            serviceCategory.includes(term) ||
            serviceTags.includes(term)
        );
    });
}

module.exports = { searchServices, services };

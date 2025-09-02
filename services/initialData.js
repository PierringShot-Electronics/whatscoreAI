// filepath: /home/pierring/Tools/WhatsCore.AI_4.5.0/services/initialData.js

// Bu fayl sistemin başlanğıc məlumatlarını yükləmək üçün istifadə olunur.

const fs = require('fs-extra');
const path = require('path');

// Məlumatların saxlanacağı qovluq
const DATA_DIR = path.join(__dirname, '..', 'data');

// Başlanğıc məlumatlarını yükləyən funksiya
async function loadInitialData() {
    try {
        // Məhsul məlumatlarını yükləyin
        const productsPath = path.join(DATA_DIR, 'products.json');
        if (!fs.existsSync(productsPath)) {
            await fs.writeJson(productsPath, [], { spaces: 2 });
            console.log('✅ Başlanğıc məhsul məlumatları yaradıldı.');
        }

        // Sifariş məlumatlarını yükləyin
        const ordersPath = path.join(DATA_DIR, 'orders.json');
        if (!fs.existsSync(ordersPath)) {
            await fs.writeJson(ordersPath, [], { spaces: 2 });
            console.log('✅ Başlanğıc sifariş məlumatları yaradıldı.');
        }

        // Lead məlumatlarını yükləyin
        const leadsPath = path.join(DATA_DIR, 'leads.json');
        if (!fs.existsSync(leadsPath)) {
            await fs.writeJson(leadsPath, {}, { spaces: 2 });
            console.log('✅ Başlanğıc lead məlumatları yaradıldı.');
        }

        // Xidmət məlumatlarını yükləyin
        const servicesPath = path.join(DATA_DIR, 'services.json');
        if (!fs.existsSync(servicesPath)) {
            await fs.writeJson(servicesPath, [], { spaces: 2 });
            console.log('✅ Başlanğıc xidmət məlumatları yaradıldı.');
        }
    } catch (error) {
        console.error('❌ Başlanğıc məlumatlarını yükləmək mümkün olmadı:', error);
    }
}

module.exports = { loadInitialData };
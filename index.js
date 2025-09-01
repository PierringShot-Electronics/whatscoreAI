require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { logWithTimestamp } = require('./utils/logger');
const whatsappController = require('./controllers/whatsappController'); // whatsappController-i import et
// Lazily require WhatsApp client only when not skipping (avoids heavy deps in tests)
let initializeWhatsAppClient = null;
const { loadProducts } = require('./services/productManager'); // məhsulları yaddaşa yükləmək üçün


const app = express();
// Unique port selection to avoid interference across instances
const PORT_BASE = Number(process.env.PORT_BASE || 5051);
const INSTANCE_OFFSET = Number(process.env.NODE_APP_INSTANCE || process.env.INSTANCE || 0) || 0;
const port = Number(process.env.PORT) || (PORT_BASE + INSTANCE_OFFSET);

// runtime instances for graceful shutdown
let whatsappClientInstance = null;
let serverInstance = null;

app.use(bodyParser.json());
// Serve static admin UI under /static and protect /admin
const path = require('path');
const basicAuth = require('./middleware/basicAuth');
// Protect static admin assets with basic auth as well
app.use('/static', basicAuth, express.static(path.join(__dirname, 'public')));

// Swagger UI
try {
    const swaggerUi = require('swagger-ui-express');
    const yaml = require('yamljs');
    const openapiDoc = yaml.load('./docs/openapi.yaml');
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
} catch (e) { /* optional dev dependency */ }

// API route-larını aktivləşdiririk
const apiRoutes = require('./api/routes');
app.use('/api', apiRoutes);

// Admin UI route (protected)
app.get('/admin', basicAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

async function startServer() {
    try {
        logWithTimestamp('----------------------------------------------------');
        // Məhsul və xidmətləri yaddaşa yükləyirik
        await loadProducts();

        // WhatsApp klientini başlatmaq opt-in: SKIP_WHATSAPP=true ilə atla
        if (process.env.SKIP_WHATSAPP !== 'true') {
            if (!initializeWhatsAppClient) {
                ({ initializeWhatsAppClient } = require('./services/whatsappClient'));
            }
            // WhatsApp klientini başlatırıq
            const client = await initializeWhatsAppClient();
            // Klient instansiyasını WhatsApp kontrollerə ötürürük
            whatsappController.setWhatsAppClient(client);
            whatsappClientInstance = client;
        } else {
            logWithTimestamp('ℹ️ SKIP_WHATSAPP=true olduğuna görə WhatsApp klienti başlamadı (test modu).');
        }
        
        // Express serverini port toqquşmalarını nəzərə alaraq işə salırıq
        const bindServer = (basePort, attempt = 0) => new Promise((resolve, reject) => {
            const candidate = basePort + attempt;
            const s = app.listen(candidate, () => resolve({ s, candidate }));
            s.on('error', (err) => {
                if (err && err.code === 'EADDRINUSE' && attempt < 10) {
                    // try next port up to 10 times
                    setTimeout(() => {
                        bindServer(basePort, attempt + 1).then(resolve).catch(reject);
                    }, 100);
                } else {
                    reject(err);
                }
            });
        });

        const { s, candidate } = await bindServer(port);
        serverInstance = s;
        logWithTimestamp(`✅ Express serveri http://localhost:${candidate} ünvanında işə düşdü.`);
        logWithTimestamp('----------------------------------------------------');
        if (typeof process.send === 'function') {
            try { process.send('ready'); } catch (e) { /* ignore */ }
        }
    } catch (error) {
        logWithTimestamp('❌ Serverin işə salınması zamanı kritik xəta:', error);
        process.exit(1); // Xəta olarsa proqramı dayandır
    }
}

// If this file is the main module, start server. Otherwise export for tests.
if (require.main === module) {
    startServer();
} else {
    module.exports = { app, startServer };
}

// Graceful shutdown for PM2 / container signals
async function shutdown(signal) {
    logWithTimestamp(`🛑 Alındı shutdown siqnalı: ${signal}`);
    try {
        if (whatsappClientInstance && typeof whatsappClientInstance.destroy === 'function') {
            logWithTimestamp('🔌 WhatsApp client bağlanır...');
            await whatsappClientInstance.destroy();
        }
    } catch (e) { logWithTimestamp('⚠️ WhatsApp client bağlanarkən xəta:', e); }

    try {
        if (serverInstance) {
            logWithTimestamp('🔒 HTTP server bağlanır...');
            serverInstance.close(() => logWithTimestamp('✅ HTTP server dayandırıldı.'));
        }
    } catch (e) { logWithTimestamp('⚠️ HTTP server bağlanarkən xəta:', e); }

    setTimeout(() => {
        logWithTimestamp('🔚 Proses çıxışı (0)');
        process.exit(0);
    }, 3000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
    logWithTimestamp('❗ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    logWithTimestamp('❗ Uncaught Exception:', err);
    // allow logs to flush then exit non-zero
    setTimeout(() => process.exit(1), 1000);
});

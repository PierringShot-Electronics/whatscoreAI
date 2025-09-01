const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { handleMessage } = require("../controllers/messageController");
const { logWithTimestamp } = require("../utils/logger");

async function initializeWhatsAppClient() {
  logWithTimestamp("🔄 WhatsApp klienti başladılır...");

  // --- WhatsApp Client-in qurulması ---
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: "whatscore_client",
      dataPath: "./.wwebjs_auth",
    }),
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-dbus",
      ],
    },
  });

  client.on("qr", (qr) => {
    logWithTimestamp("⚡ QR Kod Gəldi! WhatsApp-ı telefonda açaraq skan edin:");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    logWithTimestamp("====================================================");
    logWithTimestamp(
      "🚀 WhatsApp Asistanı Tam Hazırdır və Mesajları Gözləyir!",
    );
    logWithTimestamp("====================================================");
  });

  client.on("authenticated", () => {
    logWithTimestamp("✅ Autentifikasiya uğurludur!");
  });

  client.on("message_create", async (message) => {
    // Statusları və öz mesajlarımızı ignor edirik
    if (message.fromMe || message.isStatus) {
      return;
    }
    logWithTimestamp(
      `📨 Yeni mesaj alındı: [${message.from}] | Tip: [${message.type}]`,
    );
    await handleMessage(client, message);
  });

  client.on("disconnected", (reason) => {
    logWithTimestamp(
      `❌ Klient bağlantını itirdi: ${reason}. Yenidən başlatmağa çalışın.`,
    );
  });

  await client.initialize();
  return client;
}

module.exports = { initializeWhatsAppClient };

//    const client = new Client({
//        authStrategy: new LocalAuth({
//            clientId: process.env.SESSION_CLIENT_ID,
//            dataPath: './wwebjs_auth'
//        }),
//        puppeteer: {
//            headless: true,
//            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
//            args: [
//                '--no-sandbox',
//                '--disable-setuid-sandbox',
//                '--disable-dev-shm-usage',
//                '--disable-accelerated-2d-canvas',
//                '--no-first-run',
//                '--no-zygote',
//                '--disable-gpu'
//            ],
//        },
//    });
//

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { logWithTimestamp } = require('./utils/logger');
const whatsappController = require('./controllers/whatsappController'); // whatsappController-i import et
const { initializeWhatsAppClient } = require('./services/whatsappClient'); // whatsappClient-dən import et


const app = express();
const port = process.env.PORT || 9876;

app.use(bodyParser.json());

// API route-larını aktivləşdiririk
const apiRoutes = require('./api/routes');
app.use('/api', apiRoutes); 

async function startServer() {
    try {
        logWithTimestamp('----------------------------------------------------');
        // WhatsApp klientini başlatırıq
        const client = await initializeWhatsAppClient();
        // Klient instansiyasını WhatsApp kontrollerə ötürürük
        whatsappController.setWhatsAppClient(client); 
        
        // Express serverini təyin olunmuş portda işə salırıq
        app.listen(port, () => {
            logWithTimestamp(`✅ Express serveri http://localhost:${port} ünvanında işə düşdü.`);
            logWithTimestamp('----------------------------------------------------');
        });
    } catch (error) {
        logWithTimestamp('❌ Serverin işə salınması zamanı kritik xəta:', error);
        process.exit(1); // Xəta olarsa proqramı dayandır
    }
}

// Serveri başlat
startServer();


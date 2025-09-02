const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR);
}
const LOG_FILE = path.join(LOGS_DIR, 'whatscore.log');

function logWithTimestamp(message, ...optionalParams) {
    const timestamp = new Date().toLocaleString('az-AZ', { timeZone: 'Asia/Baku' });
    const logMessage = `[${timestamp}] - ${message}`;

    console.log(logMessage, ...optionalParams);

    // Fayla yazmaq üçün string-ə çeviririk
    const paramsString = optionalParams.map(p => {
        if (typeof p === 'object') return JSON.stringify(p, null, 2);
        return p;
    }).join(' ');

    fs.appendFileSync(LOG_FILE, `${logMessage} ${paramsString}\n`);
}

module.exports = { logWithTimestamp };
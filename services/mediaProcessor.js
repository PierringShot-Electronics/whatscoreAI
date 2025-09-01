/**
 * WhatsCore.AI - Maverick Edition
 *
 * Media Emalı Servisi - v4.4 (Video Kadrı Çıxarmaqla)
 */
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const { logWithTimestamp } = require('../utils/logger');

const TEMP_DIR = process.env.MEDIA_TEMP_DIR || path.join(__dirname, '..', 'media', 'temp');
fs.ensureDirSync(TEMP_DIR);

async function saveMedia(message) {
    try {
        const media = await message.downloadMedia();
        if (!media) throw new Error('Media endirilə bilmədi.');
        const extension = (media.mimetype.split('/')[1] || 'tmp').split(';')[0];
        const fileName = `${uuidv4()}.${extension}`;
        const filePath = path.join(TEMP_DIR, fileName);
        await fs.writeFile(filePath, media.data, { encoding: 'base64' });
        logWithTimestamp(`📥 Media faylı saxlanıldı: ${filePath}`);
        return filePath;
    } catch (error) {
        logWithTimestamp(`❌ Media saxlama xətası:`, error.message);
        throw error;
    }
}

/**
 * Videonu emal edir: səsini və ilk kadrını ayırır.
 * @param {string} videoPath - Videonun yolu.
 * @returns {Promise<{audioPath: string|null, framePath: string|null}>}
 */
async function processVideo(videoPath) {
    const baseName = path.basename(videoPath, path.extname(videoPath));
    const audioPath = path.join(TEMP_DIR, `${baseName}_audio.mp3`);
    const framePath = path.join(TEMP_DIR, `${baseName}_frame.png`);
    
    const extractAudio = new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .noVideo()
            .audioCodec('libmp3lame')
            .save(audioPath)
            .on('end', () => { logWithTimestamp(`✅ Videodan səs ayrıldı: ${audioPath}`); resolve(audioPath); })
            .on('error', (err) => { logWithTimestamp(`❌ Səs ayırma xətası:`, err.message); resolve(null); });
    });

    const extractFrame = new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .screenshots({
                timestamps: ['1%'],
                filename: `${baseName}_frame.png`,
                folder: TEMP_DIR,
                size: '640x480'
            })
            .on('end', () => { logWithTimestamp(`✅ Videodan kadr çıxarıldı: ${framePath}`); resolve(framePath); })
            .on('error', (err) => { logWithTimestamp(`❌ Kadr çıxarma xətası:`, err.message); resolve(null); });
    });

    const [audioResult, frameResult] = await Promise.all([extractAudio, extractFrame]);
    return { audioPath: audioResult, framePath: frameResult };
}

module.exports = { saveMedia, processVideo };
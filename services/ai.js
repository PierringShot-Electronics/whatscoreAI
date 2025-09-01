/**
 * WhatsCore.AI - Maverick Edition
 *
 * AI Service - v5.0.2 (Token & Stability Patch)
 * YENİLİK: Token limitini aşmamaq üçün tarixçə limiti daha da optimallaşdırıldı (MAX_MESSAGES = 10).
 * Bütün əvvəlki düzəlişlər qorunub saxlanılıb.
 */
const Groq = require("groq-sdk");
const fs = require("fs-extra");
const path = require("path");
const mime = require("mime-types");
const { getHistory } = require("./historyManager");
const { searchProducts } = require("./productManager");
const { searchServices } = require("./serviceManager");
const { logWithTimestamp } = require("../utils/logger");
const { getSystemPrompt } = require("../prompts/assistant_prompt");

// Note: Heavy agent modules are intentionally not imported here to keep
// the service lightweight in test and minimal environments. If needed,
// they should be required lazily within specific functions.

const groqKeys = (process.env.GROQ_API_KEYS || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);
// Do not throw at import-time — allow tests to stub AI functions.
if (groqKeys.length === 0) {
  logWithTimestamp('ℹ️ GROQ_API_KEYS not set — AI calls will fail unless MOCK_AI=true or functions are stubbed.');
}
let currentGroqKeyIndex = 0;
let groq = new Groq({ apiKey: groqKeys[currentGroqKeyIndex] || 'NO_KEY' });

// Tunable concurrency + retries (can be tuned via env)
const GROQ_CONCURRENCY = process.env.GROQ_CONCURRENCY ? Number(process.env.GROQ_CONCURRENCY) : 1;
const GROQ_MAX_RETRIES = process.env.GROQ_MAX_RETRIES ? Number(process.env.GROQ_MAX_RETRIES) : 5; // increased default
const GROQ_BASE_BACKOFF = process.env.GROQ_BASE_BACKOFF_MS ? Number(process.env.GROQ_BASE_BACKOFF_MS) : 1200; // increased default

// Metrics
const metrics = {
  queued: 0,
  processed: 0,
  retries: 0,
};

// In-process queue fallback
const groqQueue = [];
let groqActive = 0;

function processGroqQueue() {
  while (groqActive < GROQ_CONCURRENCY && groqQueue.length > 0) {
    const item = groqQueue.shift();
    groqActive++;
    metrics.queued = Math.max(0, metrics.queued - 1);
    item
      .fn()
      .then((res) => {
        groqActive--;
        metrics.processed++;
        item.resolve(res);
        setImmediate(processGroqQueue);
      })
      .catch((err) => {
        groqActive--;
        item.reject(err);
        setImmediate(processGroqQueue);
      });
  }
}

function enqueueLocalCall(fn) {
  return new Promise((resolve, reject) => {
    groqQueue.push({ fn, resolve, reject });
    metrics.queued++;
    processGroqQueue();
  });
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function callWithRetries(fn, attempt = 0) {
  try {
    return await fn();
  } catch (err) {
    const status = err && err.status;
    metrics.retries++;
    if (attempt >= GROQ_MAX_RETRIES - 1) {
      throw err;
    }
    if (status === 429) {
      logWithTimestamp(`⚠️ Groq 429 detected, rotating key and retrying (attempt ${attempt + 1})`);
      rotateGroqKey();
    }
    const backoff = GROQ_BASE_BACKOFF * Math.pow(2, attempt) + Math.floor(Math.random() * 500);
    await sleep(backoff);
    return callWithRetries(fn, attempt + 1);
  }
}

// Optional Redis-backed distributed queue (request-reply). Uses ioredis if available.
let redis = null;
let usingRedisQueue = false;
try {
  if (process.env.REDIS_URL) {
    const IORedis = require('ioredis');
    redis = new IORedis(process.env.REDIS_URL);
    usingRedisQueue = true;
    logWithTimestamp('🔌 Redis found — distributed Groq queue enabled.');
  }
} catch (e) {
  logWithTimestamp('ℹ️ ioredis not installed or REDIS_URL not set — using local in-process queue. To enable distributed queue, install ioredis and set REDIS_URL.');
}

// Start a local worker to pop jobs from Redis if configured
if (usingRedisQueue && redis) {
  const JOB_QUEUE_KEY = 'wcai:groq:jobs';
  (async function redisWorker() {
    while (true) {
      try {
        const res = await redis.blpop(JOB_QUEUE_KEY, 0);
        if (!res || !res[1]) continue;
        const payload = JSON.parse(res[1]);
        const { id, type, job } = payload;
        try {
          let result = null;
          if (process.env.MOCK_AI === 'true') {
            // quick canned response
            result = { ok: true, data: type === 'transcribe' ? 'MOCK TRANSCRIPT' : 'MOCK RESPONSE' };
          } else {
            if (type === 'chat') {
              const resp = await callWithRetries(() => groq.chat.completions.create(job));
              result = { ok: true, data: resp };
            } else if (type === 'transcribe') {
              const resp = await callWithRetries(() => groq.audio.transcriptions.create(job));
              result = { ok: true, data: resp };
            }
          }
          // push result
          await redis.rpush(`wcai:groq:res:${id}`, JSON.stringify(result));
          await redis.expire(`wcai:groq:res:${id}`, 60);
          metrics.processed++;
        } catch (err) {
          await redis.rpush(`wcai:groq:res:${id}`, JSON.stringify({ ok: false, error: String(err) }));
          await redis.expire(`wcai:groq:res:${id}`, 60);
        }
      } catch (e) {
        logWithTimestamp('❌ Redis worker error:', e.message || e);
        await sleep(1000);
      }
    }
  })();
}

async function enqueueRedisCall(type, jobPayload) {
  if (!redis) throw new Error('Redis not available');
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const q = { id, type, job: jobPayload };
  await redis.rpush('wcai:groq:jobs', JSON.stringify(q));
  metrics.queued++;
  // wait for result (with timeout)
  const res = await redis.blpop(`wcai:groq:res:${id}`, 30); // 30s
  if (!res || !res[1]) throw new Error('Redis job timeout');
  const parsed = JSON.parse(res[1]);
  if (!parsed.ok) throw new Error(parsed.error || 'unknown');
  return parsed.data;
}

function getQueueMetrics() {
  return Object.assign({}, metrics, { usingRedisQueue });
}

async function doChatJob(job) {
  if (process.env.MOCK_AI === 'true') {
    return { choices: [{ message: { content: 'MOCK AI RESPONSE' } }] };
  }
  if (usingRedisQueue && redis) {
    // enqueue as 'chat'
    const res = await enqueueRedisCall('chat', job);
    return res;
  }
  // local queue
  return await enqueueLocalCall(() => callWithRetries(() => groq.chat.completions.create(job)));
}

async function doTranscribeJob(job) {
  if (process.env.MOCK_AI === 'true') {
    return 'MOCK TRANSCRIPT';
  }
  if (usingRedisQueue && redis) {
    const res = await enqueueRedisCall('transcribe', job);
    return res;
  }
  return await enqueueLocalCall(() => callWithRetries(() => groq.audio.transcriptions.create(job)));
}

function rotateGroqKey() {
  currentGroqKeyIndex = (currentGroqKeyIndex + 1) % groqKeys.length;
  groq = new Groq({ apiKey: groqKeys[currentGroqKeyIndex] });
  logWithTimestamp(
    `🔄 Groq API açarı dəyişdirildi: ...${groqKeys[currentGroqKeyIndex].slice(-4)}`,
  );
}

const AUDITION_PROMPT_PATH = path.join(
  __dirname,
  "..",
  "prompts",
  "audition_prompt.md",
);
let auditionPromptContent = "";
try {
  if (fs.existsSync(AUDITION_PROMPT_PATH)) {
    auditionPromptContent = fs.readFileSync(AUDITION_PROMPT_PATH, "utf8");
    logWithTimestamp("✅ Audition prompt uğurla yükləndi.");
  }
} catch (error) {
  logWithTimestamp(`❌ Audition promptu oxunarkən xəta:`, error);
}

async function analyzeImage(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return "";
  logWithTimestamp(`🖼️ Şəkil/kadr analizi başladı: ${path.basename(filePath)}`);
  try {
    const imageAsBase64 = fs.readFileSync(filePath, "base64");
    const job = {
      temperature: 0.22,
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Bu şəkili və ya video kadrını detallı analiz et. Üzərindəki hər hansı bir mətni, modeli, markanı, zədəni və ya qeyri-adi detalı qeyd et.",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageAsBase64}` },
            },
          ],
        },
      ],
    };
    const response = await doChatJob(job);
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    logWithTimestamp(`❌ Şəkil analizi xətası:`, error.message);
    return "Şəkili analiz edərkən xəta baş verdi.";
  }
}

async function transcribeAudio(filePath) {
  const allowedMimeTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/opus",
    "audio/mp4",
    "audio/m4a",
    "audio/webm",
  ];
  const fileMimeType = mime.lookup(filePath);
  if (!filePath || !allowedMimeTypes.includes(fileMimeType)) return "";
  logWithTimestamp(
    `🎤 Səs transkripsiyası başladı: ${path.basename(filePath)}`,
  );
  try {
    const job = {
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3-turbo",
      prompt: auditionPromptContent,
      language: "az",
      temperature: 0.02,
    };
    const transcription = await doTranscribeJob(job);
    return transcription.text || (typeof transcription === 'string' ? transcription : '');
  } catch (error) {
    logWithTimestamp(`❌ Audio transkripsiya xətası:`, error.message);
    return "Səs faylını analiz edərkən xəta baş verdi.";
  }
}

// Helper to accept a media object (from whatsapp message.downloadMedia())
// media: { mimetype, data } where data is base64 string
const os = require('os');
const crypto = require('crypto');

async function getVisionResponse(media) {
  if (!media || !media.data) return { caption: '' };
  const ext = mime.extension(media.mimetype || 'image/jpeg') || 'jpg';
  const tmp = path.join(os.tmpdir(), `wcai-img-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`);
  try {
    fs.writeFileSync(tmp, media.data, 'base64');
  const res = await analyzeImage(tmp);
    return { caption: res };
  } catch (err) {
    logWithTimestamp('❌ getVisionResponse error:', err.message || err);
    return { caption: '' };
  } finally {
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (e) {}
  }
}

async function transcribeAudioFromMedia(media) {
  if (!media || !media.data) return '';
  const ext = mime.extension(media.mimetype || 'audio/mpeg') || 'mp3';
  const tmp = path.join(os.tmpdir(), `wcai-aud-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`);
  try {
    fs.writeFileSync(tmp, media.data, 'base64');
    const res = await transcribeAudio(tmp);
    return res;
  } catch (err) {
    logWithTimestamp('❌ transcribeAudioFromMedia error:', err.message || err);
    return '';
  } finally {
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (e) {}
  }
}

async function getAIResponse(chatId, userInput) {
  for (let i = 0; i < groqKeys.length; i++) {
    try {
      let history = await getHistory(chatId);
      const MAX_MESSAGES = 10; // LİMİTİ DAHA DA AZALTDIQ!
      if (history.length > MAX_MESSAGES) {
        history = history.slice(-MAX_MESSAGES);
        logWithTimestamp(
          `⚠️ Token limitini aşmamaq üçün söhbət tarixçəsi ${MAX_MESSAGES} mesaja qısaldıldı.`,
        );
      }

      let mediaAnalysisResults = "";
      let transcriptionResults = "";
      if (userInput.media && userInput.media.length > 0) {
        const imagePromises = userInput.media
          .filter((m) => mime.lookup(m.path).startsWith("image/"))
          .map((m) => analyzeImage(m.path));
        const audioPromises = userInput.media
          .filter((m) => mime.lookup(m.path).startsWith("audio/"))
          .map((m) => transcribeAudio(m.path));
        mediaAnalysisResults = (await Promise.all(imagePromises))
          .filter(Boolean)
          .join("\n---\n");
        transcriptionResults = (await Promise.all(audioPromises))
          .filter(Boolean)
          .join(" ");
      }

      let combinedUserInput = userInput.text || "";
      if (transcriptionResults)
        combinedUserInput =
          `${combinedUserInput} [Səsli mesajdan transkripsiya: ${transcriptionResults}]`.trim();

      const productResults = searchProducts(combinedUserInput);
      const serviceResults = searchServices(combinedUserInput);
      let knowledgeBaseContent = "";
      if (productResults.length > 0 || serviceResults.length > 0) {
        knowledgeBaseContent = `[BİLİK BAZASI NƏTİCƏLƏRİ]:\n`;
        if (productResults.length > 0)
          knowledgeBaseContent += `TAPILAN MƏHSULLAR:\n${productResults.map((p) => `- ID: ${p.id}, Ad: ${p.name}, Qiymət: ${p.price} AZN`).join("\n")}\n`;
        if (serviceResults.length > 0)
          knowledgeBaseContent += `TAPILAN XİDMƏTLƏR:\n${serviceResults.map((s) => `- ID: ${s.id}, Ad: ${s.name}, Qiymət: ${s.price} AZN`).join("\n")}\n`;
      }

      const messages = [
        { role: "system", content: getSystemPrompt() },
        ...history.map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        {
          role: "user",
          content:
            `${knowledgeBaseContent}\n[MEDİA ANALİZİ NƏTİCƏLƏRİ]:\n${mediaAnalysisResults}\n\n[İSTİFADƏÇİ SORĞUSU]:\n${combinedUserInput}`.trim(),
        },
      ];

      const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-maverick-17b-128e-instruct",
        temperature: 0.27,
        messages,
      });
      return (
        response.choices[0]?.message?.content ||
        "Anlaşılmadı, zəhmət olmasa fərqli şəkildə ifadə edin."
      );
    } catch (error) {
      logWithTimestamp(
        `❌ Groq AI servis xətası [${chatId}]: ${error.message}`,
      );
      if (error.status === 429 || error.status === 413) {
        rotateGroqKey();
        logWithTimestamp(
          `Cəhd ${i + 1}/${groqKeys.length} uğursuz oldu. Növbəti açar yoxlanılır...`,
        );
      } else {
        return "🤖 Üzr istəyirəm, AI ilə əlaqədə naməlum bir problem yarandı.";
      }
    }
  }
  return "⚠️ Sistemdə müvəqqəti yüklənmə var. Bütün API açarları məşğuldur. Zəhmət olmasa, bir neçə dəqiqə sonra yenidən cəhd edin.";
}

module.exports = { getAIResponse, getVisionResponse, transcribeAudio: transcribeAudioFromMedia };

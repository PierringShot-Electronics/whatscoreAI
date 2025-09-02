const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { logWithTimestamp } = require('../utils/logger');

class GroqClient {
  constructor() {
    const keys = (process.env.GROQ_API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
    this.keys = keys.length ? keys : (process.env.GROQ_API_KEY ? [process.env.GROQ_API_KEY] : []);
    this.index = 0;
  }

  get activeKey() { return this.keys.length ? this.keys[this.index % this.keys.length] : null; }

  rotateKey() {
    if (!this.keys.length) return;
    this.index = (this.index + 1) % this.keys.length;
    logWithTimestamp('🔄 Groq API key rotated');
  }

  async request(path, options = {}) {
    const url = path.startsWith('http') ? path : `https://api.groq.com${path}`;
    let lastErr = null;

    for (let attempt = 0; attempt < 4; attempt++) {
      const key = this.activeKey;
      try {
        const res = await fetch(url, {
          headers: Object.assign({ 'Authorization': key ? `Bearer ${key}` : '', 'Content-Type': 'application/json' }, options.headers || {}),
          method: options.method || 'POST',
          body: options.body ? JSON.stringify(options.body) : undefined,
          // node-fetch uses signal for timeout; keep simple
        });

        if ([401,403,429].includes(res.status)) {
          lastErr = new Error(`Key error ${res.status}`);
          this.rotateKey();
          continue;
        }

        if ([500,502,503,504].includes(res.status)) {
          lastErr = new Error(`Server error ${res.status}`);
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data ? JSON.stringify(data) : `HTTP ${res.status}`);
        return { status: res.status, data };
      } catch (err) {
        lastErr = err;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
    }

    logWithTimestamp('❌ Groq request failed after retries:', lastErr && lastErr.message);
    throw lastErr;
  }
}

module.exports = new GroqClient();

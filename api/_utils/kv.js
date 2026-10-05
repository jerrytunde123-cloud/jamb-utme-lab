/**
 * Shared Vercel KV helpers (Upstash Redis REST API)
 */

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvCmd(cmd) {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error('KV not configured (missing KV_REST_API_URL or KV_REST_API_TOKEN)');
  }
  const r = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + KV_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cmd)
  });
  const j = await r.json();
  return (j && 'result' in j) ? j.result : null;
}

async function getJSON(key) {
  const raw = await kvCmd(['GET', key]);
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch (e) { return raw; }
  }
  return raw;
}

async function setJSON(key, value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return kvCmd(['SET', key, str]);
}

async function del(key) {
  return kvCmd(['DEL', key]);
}

async function incr(key) {
  return kvCmd(['INCR', key]);
}

async function sadd(key, member) {
  return kvCmd(['SADD', key, member]);
}

async function scard(key) {
  return kvCmd(['SCARD', key]);
}

async function keys(pattern) {
  return kvCmd(['KEYS', pattern]);
}

module.exports = { kvCmd, getJSON, setJSON, del, incr, sadd, scard, keys };

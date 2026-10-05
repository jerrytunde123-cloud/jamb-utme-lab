/**
 * Shared auth helpers
 */

const crypto = require('crypto');

const COOKIE_NAME = 'jamb_admin_session';
const SESSION_HOURS = 24;

function getSecret() {
  return process.env.SESSION_SECRET || 'CHANGE-ME-IN-VERCEL';
}

function sign(data) {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

function createSession() {
  const payload = { iat: Date.now(), exp: Date.now() + SESSION_HOURS * 3600 * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = sign(body);
  return body + '.' + sig;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (sign(body) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      try { out[k] = decodeURIComponent(v); } catch (e) { out[k] = v; }
    }
  });
  return out;
}

function setSessionCookie(res, token) {
  const maxAge = SESSION_HOURS * 3600;
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
}

function requireAuth(req, res) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return false;
  }
  return true;
}

module.exports = {
  createSession,
  verifyToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  COOKIE_NAME
};

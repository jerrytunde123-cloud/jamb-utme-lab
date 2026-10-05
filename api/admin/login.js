/**
 * POST /api/admin/login
 * Body: { password }
 */

const auth = require('../_utils/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ success: false, message: 'Password required' });

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return res.status(500).json({ success: false, message: 'Server not configured' });

  if (password !== expected) {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }

  const token = auth.createSession();
  auth.setSessionCookie(res, token);
  return res.status(200).json({ success: true });
};

/**
 * GET  /api/admin/pins   → returns all PINs
 * POST /api/admin/pins   → replaces all PINs
 *   body: { pins: { "JAMB-XXXX-110": { points: 110, used: false, usedBy: null, usedAt: null, createdAt } } }
 */

const auth = require('../_utils/auth');
const kv = require('../_utils/kv');

const KEY = 'jamb:pins';

module.exports = async function handler(req, res) {
  if (!auth.requireAuth(req, res)) return;

  if (req.method === 'GET') {
    const pins = (await kv.getJSON(KEY)) || {};
    return res.status(200).json({ success: true, pins });
  }

  if (req.method === 'POST') {
    const { pins } = req.body || {};
    if (!pins || typeof pins !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid pins' });
    }
    await kv.setJSON(KEY, pins);
    return res.status(200).json({ success: true, count: Object.keys(pins).length });
  }

  return res.status(405).json({ success: false });
};

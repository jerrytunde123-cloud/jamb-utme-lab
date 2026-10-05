/**
 * GET /api/admin/users → returns user list from ping tracking
 * Query params: ?limit=100&sort=lastSeen
 */

const auth = require('../_utils/auth');
const kv = require('../_utils/kv');

module.exports = async function handler(req, res) {
  if (!auth.requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ success: false });

  const users = (await kv.getJSON('jamb:users')) || {};
  const list = Object.entries(users).map(([uid, info]) => ({ uid, ...info }));

  // Default sort: most recent activity first
  list.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));

  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
  const slice = list.slice(0, limit);

  return res.status(200).json({
    success: true,
    total: list.length,
    showing: slice.length,
    users: slice
  });
};

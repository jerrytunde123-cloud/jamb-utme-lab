/**
 * GET  /api/admin/tasks   → returns tasks list
 * POST /api/admin/tasks   → replaces tasks list
 *   body: { tasks: [ { key, label, url, points, channelId, type: 'telegram'|'whatsapp', active } ] }
 */

const auth = require('../_utils/auth');
const kv = require('../_utils/kv');

const KEY = 'jamb:tasks';

module.exports = async function handler(req, res) {
  if (!auth.requireAuth(req, res)) return;

  if (req.method === 'GET') {
    const tasks = (await kv.getJSON(KEY)) || [];
    return res.status(200).json({ success: true, tasks });
  }

  if (req.method === 'POST') {
    const { tasks } = req.body || {};
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ success: false, message: 'Invalid tasks' });
    }
    await kv.setJSON(KEY, tasks);
    return res.status(200).json({ success: true, count: tasks.length });
  }

  return res.status(405).json({ success: false });
};

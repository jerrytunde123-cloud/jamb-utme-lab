/**
 * GET /api/admin/export-pins
 * Downloads all PINs as CSV
 */

const auth = require('../_utils/auth');
const kv = require('../_utils/kv');

module.exports = async function handler(req, res) {
  if (!auth.requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ success: false });

  const pins = (await kv.getJSON('jamb:pins')) || {};

  const rows = ['code,points,used,used_by,used_at,created_at'];
  Object.entries(pins).forEach(([code, info]) => {
    rows.push([
      code,
      info.points || 0,
      info.used ? 'yes' : 'no',
      info.usedBy || '',
      info.usedAt || '',
      info.createdAt || ''
    ].map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(','));
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="jamb-pins.csv"');
  return res.status(200).send(rows.join('\n'));
};

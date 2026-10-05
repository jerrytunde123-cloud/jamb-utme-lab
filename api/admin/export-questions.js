/**
 * GET /api/admin/export-questions
 * Downloads the current question bank as question-bank.json
 */

const auth = require('../_utils/auth');
const kv = require('../_utils/kv');

module.exports = async function handler(req, res) {
  if (!auth.requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ success: false });

  const bank = (await kv.getJSON('jamb:questions')) || {};

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="question-bank.json"');
  return res.status(200).send(JSON.stringify(bank, null, 2));
};

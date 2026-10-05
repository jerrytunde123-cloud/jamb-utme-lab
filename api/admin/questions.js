/**
 * GET  /api/admin/questions       → returns entire question bank (JSON)
 * POST /api/admin/questions       → replaces entire question bank
 *   body: { bank: { subjectKey: { name, icon, questions: [...] }, ... } }
 *
 * All edits happen client-side; the whole bank is sent back on save.
 */

const auth = require('../_utils/auth');
const kv = require('../_utils/kv');

const KEY = 'jamb:questions';

module.exports = async function handler(req, res) {
  if (!auth.requireAuth(req, res)) return;

  if (req.method === 'GET') {
    const bank = (await kv.getJSON(KEY)) || {};
    return res.status(200).json({ success: true, bank });
  }

  if (req.method === 'POST') {
    const { bank } = req.body || {};
    if (!bank || typeof bank !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid bank' });
    }
    await kv.setJSON(KEY, bank);
    const subjectCount = Object.keys(bank).length;
    const questionCount = Object.values(bank).reduce((sum, s) => sum + ((s.questions && s.questions.length) || 0), 0);
    return res.status(200).json({
      success: true,
      subjects: subjectCount,
      questions: questionCount
    });
  }

  return res.status(405).json({ success: false });
};

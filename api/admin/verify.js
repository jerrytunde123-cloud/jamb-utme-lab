const auth = require('../_utils/auth');

module.exports = async function handler(req, res) {
  if (!auth.requireAuth(req, res)) return;
  return res.status(200).json({ success: true, valid: true });
};

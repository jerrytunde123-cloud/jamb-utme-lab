/**
 * POST /api/ping
 * Body: { uid: "ABCD12" }
 *
 * Records:
 *   - jamb:traffic:total         → total pings
 *   - jamb:traffic:YYYY-MM-DD    → daily pings
 *   - jamb:visitors:YYYY-MM-DD   → unique visitor set
 *   - jamb:users                 → { [uid]: { firstSeen, lastSeen, pings } }
 */

const kv = require('./_utils/kv');

function today() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

module.exports = async function handler(req, res) {
  // CORS (live site is on a different domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { uid } = req.body || {};
  const safeUid = (typeof uid === 'string' && uid.length > 0 && uid.length <= 32) ? uid : 'anon';

  try {
    const dateKey = today();

    // Traffic counters
    await kv.incr('jamb:traffic:total');
    await kv.incr('jamb:traffic:' + dateKey);

    // Unique visitors per day
    await kv.sadd('jamb:visitors:' + dateKey, safeUid);

    // User database
    if (safeUid !== 'anon') {
      const users = (await kv.getJSON('jamb:users')) || {};
      const now = Date.now();
      if (!users[safeUid]) {
        users[safeUid] = { firstSeen: now, lastSeen: now, pings: 1 };
      } else {
        users[safeUid].lastSeen = now;
        users[safeUid].pings = (users[safeUid].pings || 0) + 1;
      }
      // Cap user DB to avoid unbounded growth
      const userKeys = Object.keys(users);
      if (userKeys.length > 5000) {
        // Sort by lastSeen desc, keep newest 5000
        const sorted = userKeys.sort((a, b) => (users[b].lastSeen || 0) - (users[a].lastSeen || 0));
        const keep = {};
        sorted.slice(0, 5000).forEach((k) => { keep[k] = users[k]; });
        await kv.setJSON('jamb:users', keep);
      } else {
        await kv.setJSON('jamb:users', users);
      }
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('ping error:', e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

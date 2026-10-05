/**
 * GET /api/admin/stats
 * Returns dashboard KPIs + 14-day traffic history.
 */

const auth = require('../_utils/auth');
const kv = require('../_utils/kv');

function dayOffset(offset) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

module.exports = async function handler(req, res) {
  if (!auth.requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ success: false });

  try {
    // Traffic
    const totalPings = parseInt(await kv.getJSON('jamb:traffic:total'), 10) || 0;

    // Last 14 days
    const daily = [];
    for (let i = 13; i >= 0; i--) {
      const dateKey = dayOffset(i);
      const pings = parseInt(await kv.getJSON('jamb:traffic:' + dateKey), 10) || 0;
      const unique = parseInt(await kv.scard('jamb:visitors:' + dateKey), 10) || 0;
      daily.push({ date: dateKey, pings, unique });
    }

    // Users
    const users = (await kv.getJSON('jamb:users')) || {};
    const userKeys = Object.keys(users);
    const today = dayOffset(0);
    const todayStart = new Date(today + 'T00:00:00').getTime();
    const activeToday = userKeys.filter((k) => (users[k].lastSeen || 0) >= todayStart).length;

    // Questions
    const bank = (await kv.getJSON('jamb:questions')) || {};
    const subjectCount = Object.keys(bank).length;
    const questionCount = Object.values(bank).reduce((sum, s) => sum + ((s.questions && s.questions.length) || 0), 0);

    // Pins
    const pins = (await kv.getJSON('jamb:pins')) || {};
    const pinKeys = Object.keys(pins);
    const usedPins = pinKeys.filter((k) => pins[k].used).length;
    const unusedPins = pinKeys.length - usedPins;

    // Tasks
    const tasks = (await kv.getJSON('jamb:tasks')) || [];

    return res.status(200).json({
      success: true,
      stats: {
        traffic: {
          totalPings,
          daily
        },
        users: {
          total: userKeys.length,
          activeToday
        },
        questions: {
          subjects: subjectCount,
          total: questionCount
        },
        pins: {
          total: pinKeys.length,
          used: usedPins,
          unused: unusedPins
        },
        tasks: {
          total: tasks.length,
          active: tasks.filter((t) => t.active !== false).length
        }
      }
    });
  } catch (e) {
    console.error('stats error:', e.message);
    return res.status(500).json({ success: false, message: e.message });
  }
};

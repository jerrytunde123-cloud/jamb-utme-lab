/**
 * PIN manager — generate, list, mark used
 */

let pins = {};

document.addEventListener('DOMContentLoaded', async function() {
  if (!(await ADMIN.requireLogin())) return;

  document.getElementById('sideLinks').innerHTML = ADMIN.renderSidebar('pins');
  document.getElementById('logoutBtn').addEventListener('click', ADMIN.logout);
  document.getElementById('genBtn').addEventListener('click', generatePins);
  document.getElementById('saveBtn').addEventListener('click', savePins);

  await loadPins();
});

async function loadPins() {
  const data = await ADMIN.apiGet('/api/admin/pins');
  if (data && data.success) {
    pins = data.pins || {};
    renderPins();
  }
}

function renderPins() {
  const entries = Object.entries(pins);
  const used = entries.filter(([_, p]) => p.used).length;
  const unused = entries.length - used;

  document.getElementById('pinStats').textContent = entries.length + ' total · ' + unused + ' unused · ' + used + ' used';

  const list = document.getElementById('pinList');
  if (!entries.length) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-key"></i><br>No PINs yet. Use the form above to generate.</div>';
    return;
  }

  // Sort newest first
  entries.sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));

  list.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Code</th><th>Points</th><th>Status</th><th>Used By</th><th>Used At</th><th style="text-align:right;">Actions</th></tr></thead><tbody>' +
    entries.map(([code, info]) =>
      '<tr>' +
      '<td class="mono">' + ADMIN.escapeHtml(code) + '</td>' +
      '<td><strong>' + (info.points || 0) + '</strong></td>' +
      '<td>' + (info.used ? '<span class="pill pill-red">Used</span>' : '<span class="pill pill-green">Available</span>') + '</td>' +
      '<td>' + (info.usedBy ? '<span class="mono">' + ADMIN.escapeHtml(info.usedBy) + '</span>' : '—') + '</td>' +
      '<td>' + (info.usedAt ? ADMIN.formatDate(info.usedAt) : '—') + '</td>' +
      '<td style="text-align:right;white-space:nowrap;">' +
      '<button class="btn btn-muted btn-sm" onclick="copyPin(\'' + code.replace(/'/g, "\\'") + '\')"><i class="fas fa-copy"></i></button> ' +
      (info.used ? '<button class="btn btn-warning btn-sm" onclick="togglePin(\'' + code.replace(/'/g, "\\'") + '\')"><i class="fas fa-undo"></i></button>' : '') +
      '<button class="btn btn-danger btn-sm" onclick="deletePin(\'' + code.replace(/'/g, "\\'") + '\')"><i class="fas fa-trash"></i></button>' +
      '</td></tr>'
    ).join('') + '</tbody></table></div>';
}

window.copyPin = function(code) {
  navigator.clipboard.writeText(code).then(() => ADMIN.showToast('Copied: ' + code, 'green'));
};

window.togglePin = function(code) {
  if (!confirm('Reset PIN "' + code + '" to unused?')) return;
  pins[code].used = false;
  pins[code].usedBy = null;
  pins[code].usedAt = null;
  renderPins();
  ADMIN.showToast('PIN reset — remember to Save', 'amber');
};

window.deletePin = function(code) {
  if (!confirm('Delete PIN "' + code + '"?')) return;
  delete pins[code];
  renderPins();
  ADMIN.showToast('PIN deleted — remember to Save', 'amber');
};

function generatePins() {
  const points = parseInt(document.getElementById('pinPoints').value, 10);
  const count = Math.min(parseInt(document.getElementById('pinCount').value, 10), 500);
  const prefix = (document.getElementById('pinPrefix').value || 'JAMB').toUpperCase();

  if (!points || points < 1) { ADMIN.showToast('Invalid points', 'red'); return; }
  if (!count || count < 1) { ADMIN.showToast('Invalid quantity', 'red'); return; }

  let created = 0;
  let attempts = 0;
  while (created < count && attempts < count * 10) {
    attempts++;
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = prefix + '-' + rand + '-' + points;
    if (!pins[code]) {
      pins[code] = { points, used: false, usedBy: null, usedAt: null, createdAt: Date.now() };
      created++;
    }
  }

  renderPins();
  ADMIN.showToast('Generated ' + created + ' PINs — remember to Save', 'green');
}

async function savePins() {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving…';
  const res = await ADMIN.apiPost('/api/admin/pins', { pins });
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  if (res && res.success) {
    ADMIN.showToast('Saved! ' + res.count + ' PINs total', 'green');
  } else {
    ADMIN.showToast('Save failed', 'red');
  }
}

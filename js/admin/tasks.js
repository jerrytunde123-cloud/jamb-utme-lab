/**
 * Tasks manager — bonus channels list
 */

let tasks = [];

document.addEventListener('DOMContentLoaded', async function() {
  if (!(await ADMIN.requireLogin())) return;

  document.getElementById('sideLinks').innerHTML = ADMIN.renderSidebar('tasks');
  document.getElementById('logoutBtn').addEventListener('click', ADMIN.logout);
  document.getElementById('addBtn').addEventListener('click', addTask);
  document.getElementById('saveBtn').addEventListener('click', saveTasks);

  await loadTasks();
});

async function loadTasks() {
  const data = await ADMIN.apiGet('/api/admin/tasks');
  if (data && data.success) {
    tasks = data.tasks || [];
    if (!tasks.length) {
      tasks = [
        { key: 'tg_channel', label: 'Join JAMB Telegram', url: 'https://t.me/jambvip', points: 15, type: 'telegram', channelId: '', active: true },
        { key: 'waec_tutorial', label: 'Join WAEC Tutorial Channel', url: 'https://whatsapp.com/channel/0029Vb8Fm3hH5JM3KEspIR04', points: 10, type: 'whatsapp', channelId: '0029Vb8Fm3hH5JM3KEspIR04', active: true },
        { key: 'jamb_tutorial', label: 'Join JAMB Tutorial Channel', url: 'https://whatsapp.com/channel/0029Vb8TtA8EVccNvTRmUI2u', points: 10, type: 'whatsapp', channelId: '0029Vb8TtA8EVccNvTRmUI2u', active: true },
        { key: 'jamb_vip', label: 'Join JAMB VIP Channel', url: 'https://whatsapp.com/channel/0029VbCY2pvGOj9k8pFXod0o', points: 15, type: 'whatsapp', channelId: '0029VbCY2pvGOj9k8pFXod0o', active: true },
        { key: 'jamb_class_lesson', label: 'Join JAMB Class & Lesson', url: 'https://whatsapp.com/channel/0029Vb8HCZE6rsR1fthNok1P', points: 10, type: 'whatsapp', channelId: '0029Vb8HCZE6rsR1fthNok1P', active: true },
        { key: 'waec_vvip', label: 'Join WAEC VVIP Channel', url: 'https://whatsapp.com/channel/0029VbChCYxEwEk2d3yXn02X', points: 15, type: 'whatsapp', channelId: '0029VbChCYxEwEk2d3yXn02X', active: true }
      ];
    }
    renderTasks();
  }
}

function renderTasks() {
  const list = document.getElementById('taskList');
  if (!tasks.length) {
    list.innerHTML = '<div class="card"><div class="empty-state"><i class="fas fa-tasks"></i><br>No tasks yet. Click <strong>Add Task</strong>.</div></div>';
    return;
  }

  list.innerHTML = tasks.map((t, i) =>
    '<div class="card" style="background:' + (t.active === false ? '#f3f4f6' : 'white') + ';">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">' +
    '<div style="font-weight:700;color:#1d3b4f;">' + (i + 1) + '. ' + ADMIN.escapeHtml(t.label || t.key) + '</div>' +
    '<div style="display:flex;gap:6px;">' +
    '<button class="btn ' + (t.active === false ? 'btn-success' : 'btn-warning') + ' btn-sm" onclick="toggleTask(' + i + ')">' + (t.active === false ? '<i class="fas fa-play"></i> Activate' : '<i class="fas fa-pause"></i> Deactivate') + '</button>' +
    '<button class="btn btn-danger btn-sm" onclick="deleteTask(' + i + ')"><i class="fas fa-trash"></i></button>' +
    '</div></div>' +
    '<div class="field-row">' +
    '<div style="flex:1;"><div class="field-label">Key</div><input class="field-input mono" value="' + ADMIN.escapeHtml(t.key) + '" oninput="updateTask(' + i + ',\'key\',this.value)"></div>' +
    '<div style="flex:2;"><div class="field-label">Label (shown to users)</div><input class="field-input" value="' + ADMIN.escapeHtml(t.label) + '" oninput="updateTask(' + i + ',\'label\',this.value)"></div>' +
    '<div style="flex:1;"><div class="field-label">Points</div><input class="field-input" type="number" value="' + (t.points || 0) + '" oninput="updateTask(' + i + ',\'points\',parseInt(this.value)||0)"></div>' +
    '</div>' +
    '<div class="field-row">' +
    '<div style="flex:2;"><div class="field-label">URL</div><input class="field-input" value="' + ADMIN.escapeHtml(t.url) + '" oninput="updateTask(' + i + ',\'url\',this.value)"></div>' +
    '<div style="flex:1;"><div class="field-label">Type</div><select class="field-select" onchange="updateTask(' + i + ',\'type\',this.value)"><option value="whatsapp"' + (t.type === 'whatsapp' ? ' selected' : '') + '>WhatsApp Channel</option><option value="telegram"' + (t.type === 'telegram' ? ' selected' : '') + '>Telegram</option></select></div>' +
    '<div style="flex:1;"><div class="field-label">Channel ID (WhatsApp)</div><input class="field-input mono" value="' + ADMIN.escapeHtml(t.channelId || '') + '" oninput="updateTask(' + i + ',\'channelId\',this.value)"></div>' +
    '</div></div>'
  ).join('');
}

function addTask() {
  tasks.push({
    key: 'task_' + Date.now(),
    label: 'New Task',
    url: '',
    points: 10,
    type: 'whatsapp',
    channelId: '',
    active: true
  });
  renderTasks();
}

window.deleteTask = function(i) {
  if (!confirm('Delete "' + (tasks[i].label || tasks[i].key) + '"?')) return;
  tasks.splice(i, 1);
  renderTasks();
  ADMIN.showToast('Task deleted — remember to Save', 'amber');
};

window.toggleTask = function(i) {
  tasks[i].active = tasks[i].active === false ? true : false;
  renderTasks();
};

window.updateTask = function(i, field, val) {
  tasks[i][field] = val;
};

async function saveTasks() {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving…';
  const res = await ADMIN.apiPost('/api/admin/tasks', { tasks });
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  if (res && res.success) {
    ADMIN.showToast('Saved! ' + res.count + ' tasks', 'green');
  } else {
    ADMIN.showToast('Save failed', 'red');
  }
}

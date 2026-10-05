let allUsers = [];

document.addEventListener('DOMContentLoaded', async function() {
  if (!(await ADMIN.requireLogin())) return;

  document.getElementById('sideLinks').innerHTML = ADMIN.renderSidebar('users');
  document.getElementById('logoutBtn').addEventListener('click', ADMIN.logout);
  document.getElementById('refreshBtn').addEventListener('click', loadUsers);
  document.getElementById('searchBox').addEventListener('input', filterUsers);

  await loadUsers();
});

async function loadUsers() {
  const list = document.getElementById('userList');
  list.innerHTML = '<div class="empty-state"><span class="spinner" style="border-color:rgba(0,0,0,0.2);border-top-color:#1a5f7a;"></span></div>';

  const data = await ADMIN.apiGet('/api/admin/users?limit=1000');
  if (!data || !data.success) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Failed to load users</div>';
    return;
  }
  allUsers = data.users || [];
  document.getElementById('userCount').textContent = data.total + ' total · showing ' + data.showing;
  renderUsers(allUsers);
}

function filterUsers() {
  const q = document.getElementById('searchBox').value.trim().toUpperCase();
  if (!q) { renderUsers(allUsers); return; }
  const filtered = allUsers.filter((u) => u.uid.toUpperCase().includes(q));
  renderUsers(filtered);
}

function renderUsers(list) {
  const container = document.getElementById('userList');
  if (!list.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><br>No users match. Users appear here once they visit the live site after the ping is added.</div>';
    return;
  }

  container.innerHTML = '<div class="table-wrap"><table><thead><tr><th>User ID</th><th>First Seen</th><th>Last Seen</th><th>Page Views</th></tr></thead><tbody>' +
    list.map((u) =>
      '<tr>' +
      '<td class="mono">' + ADMIN.escapeHtml(u.uid) + '</td>' +
      '<td>' + ADMIN.formatDate(u.firstSeen) + '</td>' +
      '<td>' + ADMIN.formatDate(u.lastSeen) + '</td>' +
      '<td><span class="pill pill-gray">' + (u.pings || 0) + '</span></td>' +
      '</tr>'
    ).join('') + '</tbody></table></div>';
}

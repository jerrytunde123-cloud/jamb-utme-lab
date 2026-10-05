/**
 * Admin auth helpers + shared utilities for admin pages
 */

const ADMIN = (function() {
  'use strict';

  let toastTimer = null;

  function showToast(message, color) {
    const t = document.getElementById('toast');
    const m = document.getElementById('toastMsg');
    if (!t || !m) return;
    t.className = 'toast show ' + (color || '');
    m.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast ' + (color || ''); }, 3000);
  }

  async function apiGet(path) {
    const r = await fetch(path, { credentials: 'same-origin' });
    if (r.status === 401) { window.location.href = '/admin/login.html'; return null; }
    return r.json();
  }

  async function apiPost(path, body) {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body || {})
    });
    if (r.status === 401) { window.location.href = '/admin/login.html'; return null; }
    return r.json();
  }

  async function apiDelete(path) {
    const r = await fetch(path, { method: 'DELETE', credentials: 'same-origin' });
    if (r.status === 401) { window.location.href = '/admin/login.html'; return null; }
    return r.json();
  }

  async function requireLogin() {
    const r = await fetch('/api/admin/verify', { credentials: 'same-origin' });
    if (!r.ok) {
      window.location.href = '/admin/login.html';
      return false;
    }
    const d = await r.json();
    if (!d.valid) {
      window.location.href = '/admin/login.html';
      return false;
    }
    return true;
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/admin/login.html';
  }

  function formatDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString();
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  function renderSidebar(active) {
    const links = [
      { href: '/admin/index.html', icon: 'fa-chart-line', label: 'Dashboard', key: 'dashboard' },
      { href: '/admin/questions.html', icon: 'fa-book', label: 'Questions', key: 'questions' },
      { href: '/admin/pins.html', icon: 'fa-key', label: 'PINs', key: 'pins' },
      { href: '/admin/tasks.html', icon: 'fa-tasks', label: 'Tasks', key: 'tasks' },
      { href: '/admin/users.html', icon: 'fa-users', label: 'Users', key: 'users' }
    ];
    const html = links.map((l) =>
      '<a class="side-link ' + (l.key === active ? 'active' : '') + '" href="' + l.href + '">' +
      '<i class="fas ' + l.icon + '"></i><span>' + l.label + '</span></a>'
    ).join('');
    return html;
  }

  return {
    showToast,
    apiGet,
    apiPost,
    apiDelete,
    requireLogin,
    logout,
    formatDate,
    formatDateShort,
    escapeHtml,
    renderSidebar
  };
})();

document.addEventListener('DOMContentLoaded', async function() {
  if (!(await ADMIN.requireLogin())) return;

  document.getElementById('sideLinks').innerHTML = ADMIN.renderSidebar('dashboard');
  document.getElementById('logoutBtn').addEventListener('click', ADMIN.logout);
  document.getElementById('refreshBtn').addEventListener('click', loadStats);

  async function loadStats() {
    const btn = document.getElementById('refreshBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Loading…';

    const data = await ADMIN.apiGet('/api/admin/stats');
    if (!data || !data.success) {
      ADMIN.showToast('Failed to load stats', 'red');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
      return;
    }

    const s = data.stats;

    const kpiGrid = document.getElementById('kpiGrid');
    const cards = [
      { cls: 'kpi-blue', icon: 'fa-eye', num: s.traffic.totalPings.toLocaleString(), lbl: 'Total Page Views' },
      { cls: 'kpi-cyan', icon: 'fa-users', num: s.users.total.toLocaleString(), lbl: 'Unique Users', sub: s.users.activeToday + ' active today' },
      { cls: 'kpi-green', icon: 'fa-book', num: s.questions.total.toLocaleString(), lbl: 'Questions', sub: s.questions.subjects + ' subjects' },
      { cls: 'kpi-purple', icon: 'fa-key', num: s.pins.total.toLocaleString(), lbl: 'PINs', sub: s.pins.unused + ' unused' },
      { cls: 'kpi-amber', icon: 'fa-tasks', num: s.tasks.active + '/' + s.tasks.total, lbl: 'Active Tasks' },
      { cls: 'kpi-red', icon: 'fa-fire', num: s.users.activeToday.toLocaleString(), lbl: 'Active Today' }
    ];
    kpiGrid.innerHTML = cards.map((c) =>
      '<div class="kpi">' +
      '<div class="kpi-icon ' + c.cls + '"><i class="fas ' + c.icon + '"></i></div>' +
      '<div class="kpi-num">' + c.num + '</div>' +
      '<div class="kpi-lbl">' + c.lbl + '</div>' +
      (c.sub ? '<div class="kpi-sub">' + c.sub + '</div>' : '') +
      '</div>'
    ).join('');

    drawChart(s.traffic.daily);

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
  }

  function drawChart(days) {
    const canvas = document.getElementById('trafficChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const PAD = { top: 16, right: 16, bottom: 28, left: 32 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(1, ...days.map((d) => Math.max(d.pings, d.unique)));

    ctx.strokeStyle = '#e9edf2';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (chartH * i / 4);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(W - PAD.right, y);
      ctx.stroke();
    }

    const step = chartW / Math.max(1, days.length - 1);

    function drawLine(key, color) {
      ctx.beginPath();
      days.forEach((d, i) => {
        const x = PAD.left + step * i;
        const y = PAD.top + chartH - (d[key] / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      days.forEach((d, i) => {
        const x = PAD.left + step * i;
        const y = PAD.top + chartH - (d[key] / maxVal) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    }

    drawLine('pings', '#1a5f7a');
    drawLine('unique', '#25D366');

    ctx.fillStyle = '#6f8b9c';
    ctx.font = '11px Segoe UI';
    ctx.textAlign = 'center';
    const labelStep = Math.ceil(days.length / 7);
    days.forEach((d, i) => {
      if (i % labelStep === 0 || i === days.length - 1) {
        const x = PAD.left + step * i;
        ctx.fillText(ADMIN.formatDateShort(d.date), x, H - 8);
      }
    });

    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(maxVal * (4 - i) / 4);
      const y = PAD.top + (chartH * i / 4) + 4;
      ctx.fillText(val, PAD.left - 6, y);
    }
  }

  window.addEventListener('resize', () => {
    fetch('/api/admin/stats', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => { if (d.success) drawChart(d.stats.traffic.daily); })
      .catch(() => {});
  });

  loadStats();
});

/* ============================================================
   SVE Admin — Analytics
   ============================================================ */
(function () {
  'use strict';
  if (!window.requireAdmin) return;

  window.requireAdmin(async function (profile) {
    document.getElementById('adminEmail').textContent = profile.email;

    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    /* ---- Applications ---- */
    try {
      const snap = await window.db.collection('applications').orderBy('createdAt', 'desc').limit(500).get();
      const apps = [];
      snap.forEach(function (d) { apps.push(d.data()); });

      const counts = days.map(function (day) {
        return apps.filter(function (a) {
          if (!a.createdAt || !a.createdAt.seconds) return false;
          return new Date(a.createdAt.seconds * 1000).toISOString().slice(0, 10) === day;
        }).length;
      });

      new Chart(document.getElementById('chartApps'), {
        type: 'line',
        data: {
          labels: days.map(function (d) { return d.slice(5); }),
          datasets: [{ label: 'Applications', data: counts, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.15)', fill: true, tension: 0.3, borderWidth: 2 }]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } },
          scales: { x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } }, y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' }, beginAtZero: true } } }
      });

      const pending = apps.filter(function (a) { return a.status === 'pending'; }).length;
      const approved = apps.filter(function (a) { return a.status === 'approved'; }).length;
      const rejected = apps.filter(function (a) { return a.status === 'rejected'; }).length;

      new Chart(document.getElementById('chartStatus'), {
        type: 'doughnut',
        data: { labels: ['Pending', 'Approved', 'Rejected'], datasets: [{ data: [pending, approved, rejected], backgroundColor: ['#f59e0b', '#10b981', '#ef4444'], borderWidth: 0 }] },
        options: { plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }
      });
    } catch (e) { console.error('Applications chart:', e); }

    /* ---- Orders ---- */
    try {
      const osnap = await window.db.collection('orders').orderBy('createdAt', 'desc').limit(500).get();
      const orders = [];
      osnap.forEach(function (d) { orders.push(d.data()); });

      const ocounts = days.map(function (day) {
        return orders.filter(function (o) {
          if (!o.createdAt || !o.createdAt.seconds) return false;
          return new Date(o.createdAt.seconds * 1000).toISOString().slice(0, 10) === day;
        }).length;
      });

      new Chart(document.getElementById('chartOrders'), {
        type: 'bar',
        data: {
          labels: days.map(function (d) { return d.slice(5); }),
          datasets: [{ label: 'Orders', data: ocounts, backgroundColor: 'rgba(16,185,129,.6)', borderColor: '#10b981', borderWidth: 1 }]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } },
          scales: { x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } }, y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' }, beginAtZero: true } } }
      });
    } catch (e) { console.error('Orders chart:', e); }
  });

})();
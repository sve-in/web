/* ============================================================
   SVE Admin — Analytics (Chart.js)
   ============================================================ */
(function () {
  'use strict';
  if (!window.requireAdmin) return;

  window.requireAdmin(async function () {
    try {
      const snap = await window.db.collection('applications').orderBy('createdAt', 'desc').limit(500).get();
      const apps = [];
      snap.forEach(function (d) { apps.push(d.data()); });

      // Last 30 days buckets
      const days = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
      const counts = days.map(function (day) {
        return apps.filter(function (a) {
          if (!a.createdAt || !a.createdAt.seconds) return false;
          const dd = new Date(a.createdAt.seconds * 1000).toISOString().slice(0, 10);
          return dd === day;
        }).length;
      });

      new Chart(document.getElementById('chartApps'), {
        type: 'line',
        data: {
          labels: days.map(function (d) { return d.slice(5); }),
          datasets: [{
            label: 'Applications',
            data: counts,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,.15)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: '#94a3b8' } } },
          scales: {
            x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
            y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' }, beginAtZero: true }
          }
        }
      });

      const pending = apps.filter(function (a) { return a.status === 'pending'; }).length;
      const approved = apps.filter(function (a) { return a.status === 'approved'; }).length;
      const rejected = apps.filter(function (a) { return a.status === 'rejected'; }).length;

      new Chart(document.getElementById('chartStatus'), {
        type: 'doughnut',
        data: {
          labels: ['Pending', 'Approved', 'Rejected'],
          datasets: [{
            data: [pending, approved, rejected],
            backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
            borderWidth: 0
          }]
        },
        options: {
          plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
        }
      });
    } catch (e) {
      console.error(e);
    }
  });

})();
/* ============================================================
   SVE Admin — Dashboard
   ============================================================ */
(function () {
  'use strict';
  if (!window.requireAdmin) return;

  window.requireAdmin(async function (profile) {
    document.getElementById('adminEmail').textContent = profile.email;

    try {
      const snap = await window.db.collection('applications').orderBy('createdAt', 'desc').get();
      let total = 0, pending = 0, approved = 0, rejected = 0;
      const apps = [];
      snap.forEach(function (d) {
        const a = Object.assign({ id: d.id }, d.data());
        apps.push(a);
        total++;
        if (a.status === 'pending') pending++;
        else if (a.status === 'approved') approved++;
        else if (a.status === 'rejected') rejected++;
      });

      document.getElementById('sTotal').textContent = total;
      document.getElementById('sPending').textContent = pending;
      document.getElementById('sApproved').textContent = approved;
      document.getElementById('sRejected').textContent = rejected;

      const wrap = document.getElementById('recentApps');
      if (!apps.length) {
        wrap.innerHTML = '<div class="empty"><div class="ic">📭</div><p>No applications yet</p></div>';
        return;
      }
      let html = '<table class="admin-table"><thead><tr><th>App ID</th><th>Name</th><th>Business</th><th>City</th><th>Status</th><th>Date</th></tr></thead><tbody>';
      apps.slice(0, 10).forEach(function (a) {
        const dt = a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleDateString('en-IN') : '—';
        html += '<tr>'
          + '<td><strong>' + (a.applicationId || a.id) + '</strong></td>'
          + '<td>' + (a.name || '—') + '</td>'
          + '<td>' + (a.businessName || '—') + '</td>'
          + '<td>' + (a.city || '—') + '</td>'
          + '<td><span class="pill pill-' + (a.status || 'pending') + '">' + (a.status || 'pending') + '</span></td>'
          + '<td>' + dt + '</td>'
          + '</tr>';
      });
      html += '</tbody></table>';
      wrap.innerHTML = html;

    } catch (e) {
      console.error('[Admin Dashboard]', e);
      document.getElementById('recentApps').innerHTML = '<div class="empty">Failed to load</div>';
    }
  });

})();
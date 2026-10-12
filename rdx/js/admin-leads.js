/* ============================================================
   SVE Admin — Leads Management
   ============================================================ */
(function () {
  'use strict';
  if (!window.requireAdmin) return;

  window.requireAdmin(async function () {
    const body = document.getElementById('leadsBody');
    try {
      const snap = await window.db.collection('leads').orderBy('createdAt', 'desc').limit(500).get();
      if (snap.empty) {
        body.innerHTML = '<div class="empty"><div class="ic">📭</div><p>No leads yet</p></div>';
        return;
      }
      let html = '<table class="admin-table"><thead><tr>'
        + '<th>Name</th><th>Phone</th><th>Email</th><th>Message</th><th>Source</th><th>Date</th><th>Actions</th>'
        + '</tr></thead><tbody>';
      snap.forEach(function (d) {
        const l = d.data();
        const dt = l.createdAt ? new Date(l.createdAt.seconds * 1000).toLocaleDateString('en-IN') : '—';
        html += '<tr>'
          + '<td><strong>' + (l.name || '—') + '</strong></td>'
          + '<td>' + (l.phone || '—') + '</td>'
          + '<td>' + (l.email || '—') + '</td>'
          + '<td style="max-width:280px;">' + (l.message || '—') + '</td>'
          + '<td>' + (l.source || '—') + '</td>'
          + '<td>' + dt + '</td>'
          + '<td><div class="row-actions">'
            + '<a class="btn-outline btn-sm" target="_blank" href="https://wa.me/91' + String(l.phone || '').replace(/\D/g, '').slice(-10) + '">💬</a>'
            + '<a class="btn-outline btn-sm" href="tel:' + (l.phone || '') + '">📞</a>'
          + '</div></td>'
          + '</tr>';
      });
      html += '</tbody></table>';
      body.innerHTML = html;
    } catch (e) {
      console.error(e);
      body.innerHTML = '<div class="empty"><div class="ic">⚠️</div>Failed to load leads</div>';
    }
  });

})();
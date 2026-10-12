/* ============================================================
   SVE Admin — Users Management
   ============================================================ */
(function () {
  'use strict';
  if (!window.requireAdmin) return;

  let ALL = [];

  window.requireAdmin(async function (profile) {
    document.getElementById('adminEmail').textContent = profile.email;
    document.getElementById('refreshBtn').addEventListener('click', load);
    document.getElementById('searchBox').addEventListener('input', render);
    await load();
  });

  async function load() {
    const body = document.getElementById('usersBody');
    body.innerHTML = '<div class="loading-block"><span class="spinner"></span> Loading…</div>';
    try {
      const snap = await window.db.collection('users').orderBy('createdAt', 'desc').limit(500).get();
      ALL = [];
      snap.forEach(function (d) { ALL.push(Object.assign({ _id: d.id }, d.data())); });
      render();
    } catch (e) {
      console.error(e);
      body.innerHTML = '<div class="empty"><div class="ic">⚠️</div>Failed to load users</div>';
    }
  }

  function render() {
    const body = document.getElementById('usersBody');
    const q = (document.getElementById('searchBox').value || '').toLowerCase().trim();
    let list = ALL;
    if (q) list = list.filter(function (u) {
      return ((u.name || '') + ' ' + (u.email || '') + ' ' + (u.phone || '')).toLowerCase().indexOf(q) !== -1;
    });

    if (!list.length) {
      body.innerHTML = '<div class="empty"><div class="ic">👥</div><p>No users yet</p></div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr>'
      + '<th>Name</th><th>Business</th><th>Email</th><th>Phone</th><th>City</th><th>Status</th><th>Actions</th>'
      + '</tr></thead><tbody>';
    list.forEach(function (u) {
      html += '<tr>'
        + '<td><strong>' + (u.name || '—') + '</strong></td>'
        + '<td>' + (u.businessName || '—') + '</td>'
        + '<td>' + (u.email || '—') + '</td>'
        + '<td>' + (u.phone || '—') + '</td>'
        + '<td>' + (u.city || '—') + '</td>'
        + '<td><span class="pill pill-' + (u.status || 'active') + '">' + (u.status || 'active') + '</span></td>'
        + '<td><div class="row-actions">'
          + (u.status === 'active'
              ? '<button class="btn-danger btn-sm" data-suspend="' + u._id + '">Suspend</button>'
              : '<button class="btn-success btn-sm" data-activate="' + u._id + '">Activate</button>')
        + '</div></td>'
        + '</tr>';
    });
    html += '</tbody></table>';
    body.innerHTML = html;

    body.querySelectorAll('[data-suspend]').forEach(function (b) {
      b.addEventListener('click', async function () {
        if (!confirm('Suspend this user?')) return;
        try {
          await window.db.collection('users').doc(b.dataset.suspend).update({ status: 'suspended' });
          window.adminToast('User suspended', 'success');
          await load();
        } catch (e) { window.adminToast('Failed: ' + e.message, 'error'); }
      });
    });
    body.querySelectorAll('[data-activate]').forEach(function (b) {
      b.addEventListener('click', async function () {
        try {
          await window.db.collection('users').doc(b.dataset.activate).update({ status: 'active' });
          window.adminToast('User activated', 'success');
          await load();
        } catch (e) { window.adminToast('Failed: ' + e.message, 'error'); }
      });
    });
  }

})();
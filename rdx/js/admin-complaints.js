/* ============================================================
   SVE Admin — Complaints Management
   ============================================================ */
(function () {
  'use strict';
  if (!window.requireAdmin) return;

  let FILTER = 'all';
  let ALL = [];

  window.requireAdmin(async function () {
    document.querySelectorAll('#cmpTabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#cmpTabs button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        FILTER = b.dataset.status;
        render();
      });
    });
    await load();
  });

  async function load() {
    const body = document.getElementById('cmpBody');
    body.innerHTML = '<div class="loading-block"><span class="spinner"></span> Loading…</div>';
    try {
      const snap = await window.db.collection('complaints').orderBy('createdAt', 'desc').limit(500).get();
      ALL = [];
      snap.forEach(function (d) { ALL.push(Object.assign({ _id: d.id }, d.data())); });
      render();
    } catch (e) {
      console.error(e);
      body.innerHTML = '<div class="empty">Failed to load complaints</div>';
    }
  }

  function render() {
    const body = document.getElementById('cmpBody');
    let list = ALL;
    if (FILTER !== 'all') list = list.filter(function (c) { return c.status === FILTER; });

    if (!list.length) {
      body.innerHTML = '<div class="empty"><div class="ic">✅</div><p>No complaints</p></div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr>'
      + '<th>Complaint ID</th><th>User</th><th>Type</th><th>Subject</th><th>Order</th><th>Status</th><th>Date</th><th>Actions</th>'
      + '</tr></thead><tbody>';
    list.forEach(function (c) {
      const dt = c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('en-IN') : '—';
      const opts = ['open','in-progress','resolved','closed'].map(function (s) {
        return '<option value="' + s + '"' + (c.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('');
      html += '<tr>'
        + '<td><strong>' + (c.complaintId || c._id) + '</strong></td>'
        + '<td>' + (c.userName || '—') + '<br/><small style="color:#64748b;">' + (c.userEmail || '') + '</small></td>'
        + '<td>' + (c.type || '—') + '</td>'
        + '<td>' + (c.subject || '—') + '</td>'
        + '<td>' + (c.orderId || '—') + '</td>'
        + '<td><select class="status-sel" data-cmp="' + c._id + '">' + opts + '</select></td>'
        + '<td>' + dt + '</td>'
        + '<td><button class="btn-outline btn-sm" data-view="' + c._id + '">View</button></td>'
        + '</tr>';
    });
    html += '</tbody></table>';
    body.innerHTML = html;

    body.querySelectorAll('.status-sel').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        try {
          await window.db.collection('complaints').doc(sel.dataset.cmp).update({
            status: sel.value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: window.adminUser.email
          });
          window.adminToast('Status → ' + sel.value, 'success');
        } catch (e) { window.adminToast('Failed: ' + e.message, 'error'); }
      });
    });

    body.querySelectorAll('[data-view]').forEach(function (b) {
      b.addEventListener('click', function () {
        const c = ALL.find(function (x) { return x._id === b.dataset.view; });
        if (!c) return;
        alert('Complaint: ' + c.complaintId + '\n\nUser: ' + (c.userName || '') + '\nPhone: ' + (c.phone || '') + '\nType: ' + c.type + '\nSubject: ' + c.subject + '\nOrder: ' + (c.orderId || '—') + '\n\nMessage:\n' + c.message);
      });
    });
  }
})();
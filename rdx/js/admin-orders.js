/* ============================================================
   SVE Admin — Orders Management
   ============================================================ */
(function () {
  'use strict';
  if (!window.requireAdmin) return;

  let FILTER = 'all';
  let ALL = [];

  window.requireAdmin(async function () {
    document.querySelectorAll('#orderTabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#orderTabs button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        FILTER = b.dataset.status;
        render();
      });
    });
    await load();
  });

  async function load() {
    const body = document.getElementById('ordersBody');
    body.innerHTML = '<div class="loading-block"><span class="spinner"></span> Loading…</div>';
    try {
      const snap = await window.db.collection('orders').orderBy('createdAt', 'desc').limit(500).get();
      ALL = [];
      snap.forEach(function (d) { ALL.push(Object.assign({ _id: d.id }, d.data())); });
      render();
    } catch (e) {
      console.error(e);
      body.innerHTML = '<div class="empty"><div class="ic">⚠️</div>Failed to load orders</div>';
    }
  }

  function render() {
    const body = document.getElementById('ordersBody');
    let list = ALL;
    if (FILTER !== 'all') list = list.filter(function (o) { return o.status === FILTER; });

    if (!list.length) {
      body.innerHTML = '<div class="empty"><div class="ic">🛒</div><p>No orders found</p></div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr>'
      + '<th>Order ID</th><th>Customer</th><th>Product</th><th>Qty</th><th>Total</th><th>Status</th><th>Date</th>'
      + '</tr></thead><tbody>';
    list.forEach(function (o) {
      const dt = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-IN') : '—';
      const opts = ['pending','processing','dispatched','delivered','cancelled'].map(function (s) {
        return '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('');
      html += '<tr>'
        + '<td><strong>' + (o.orderId || o._id) + '</strong></td>'
        + '<td>' + (o.customerName || o.customer || '—') + '</td>'
        + '<td>' + (o.product || '—') + '</td>'
        + '<td>' + (o.quantity || '—') + '</td>'
        + '<td>₹' + (o.total ? Number(o.total).toLocaleString('en-IN') : '—') + '</td>'
        + '<td><select class="status-sel" data-order="' + o._id + '">' + opts + '</select></td>'
        + '<td>' + dt + '</td>'
        + '</tr>';
    });
    html += '</tbody></table>';
    body.innerHTML = html;

    body.querySelectorAll('.status-sel').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        try {
          await window.db.collection('orders').doc(sel.dataset.order).update({
            status: sel.value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          window.adminToast('Status updated to ' + sel.value, 'success');
          const o = ALL.find(function (x) { return x._id === sel.dataset.order; });
          if (o) o.status = sel.value;
        } catch (e) {
          window.adminToast('Failed: ' + e.message, 'error');
        }
      });
    });
  }

})();
/* ============================================================
   SVE Admin — Orders (with print invoice)
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
    document.getElementById('searchBox')?.addEventListener('input', render);
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
      body.innerHTML = '<div class="empty">Failed to load orders</div>';
    }
  }

  function render() {
    const body = document.getElementById('ordersBody');
    let list = ALL;
    if (FILTER !== 'all') list = list.filter(function (o) { return o.status === FILTER; });
    const q = (document.getElementById('searchBox')?.value || '').toLowerCase().trim();
    if (q) list = list.filter(function(o){
      return ((o.orderId || '') + ' ' + (o.customerName || '') + ' ' + (o.userEmail || '')).toLowerCase().indexOf(q) !== -1;
    });

    if (!list.length) {
      body.innerHTML = '<div class="empty"><div class="ic">🛒</div><p>No orders found</p></div>';
      return;
    }
    let html = '<table class="admin-table"><thead><tr>'
      + '<th>Order ID</th><th>Customer</th><th>Product</th><th>Qty</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th>'
      + '</tr></thead><tbody>';
    list.forEach(function (o) {
      const dt = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-IN') : '—';
      const opts = ['pending','processing','dispatched','delivered','cancelled'].map(function (s) {
        return '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('');
      html += '<tr>'
        + '<td><strong>' + (o.orderId || o._id) + '</strong></td>'
        + '<td>' + (o.customerName || '—') + '</td>'
        + '<td>' + (o.product || '—') + '</td>'
        + '<td>' + (o.quantity || '—') + '</td>'
        + '<td>₹' + (o.total ? Number(o.total).toLocaleString('en-IN') : '—') + '</td>'
        + '<td><select class="status-sel" data-order="' + o._id + '" style="padding:4px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;">' + opts + '</select></td>'
        + '<td>' + dt + '</td>'
        + '<td><button class="btn-outline btn-sm" data-print="' + o._id + '">🖨</button></td>'
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
          window.adminToast('Status → ' + sel.value, 'success');
          const o = ALL.find(function (x) { return x._id === sel.dataset.order; });
          if (o) o.status = sel.value;
        } catch (e) { window.adminToast('Failed: ' + e.message, 'error'); }
      });
    });
    body.querySelectorAll('[data-print]').forEach(function (b) {
      b.addEventListener('click', function () {
        const o = ALL.find(function (x) { return x._id === b.dataset.print; });
        if (o) printInvoice(o);
      });
    });
  }

  function printInvoice(o) {
    const w = window.open('', '_blank');
    const items = (o.items || []).map(function (it) {
      return '<tr><td>' + (it.name || '') + '</td><td>' + it.qty + '</td><td>₹' + it.price + '</td><td>₹' + (it.price * it.qty) + '</td></tr>';
    }).join('');
    const addr = o.shippingAddress || {};
    w.document.write('<html><head><title>Invoice ' + o.orderId + '</title>'
      + '<style>body{font-family:Arial,sans-serif;padding:32px;max-width:800px;margin:auto;}h1{margin-bottom:4px;}table{width:100%;border-collapse:collapse;margin-top:16px;}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px;}th{background:#f1f5f9;}.total{text-align:right;font-size:16px;font-weight:bold;margin-top:12px;}</style></head><body>'
      + '<h1>SVE Business Portal</h1><p><strong>Invoice:</strong> ' + o.orderId + '<br/><strong>Date:</strong> ' + new Date().toLocaleDateString('en-IN') + '</p>'
      + '<p><strong>Bill To:</strong><br/>' + (addr.name || o.customerName || '') + '<br/>' + (addr.address || '') + '<br/>' + (addr.city || '') + ', ' + (addr.state || '') + ' - ' + (addr.pincode || '') + '<br/>📞 ' + (addr.phone || o.phone || '') + '</p>'
      + '<table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + items + '</tbody></table>'
      + '<div class="total">Total: ₹' + (o.total || 0) + '</div>'
      + '</body></html>');
    w.document.close();
    setTimeout(function () { w.print(); }, 400);
  }
})();
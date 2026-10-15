/* ============================================================
   SVE Business Portal — User Dashboard
   ============================================================ */

(function () {
  'use strict';
  if (!window.requireAuth) return;

  window.requireAuth(async function (profile) {
    document.getElementById('userName').textContent = profile.name || profile.businessName || profile.email;

    // Orders
    try {
      const snap = await window.db.collection('orders')
        .where('uid', '==', profile.uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const orders = [];
      snap.forEach(function (d) { orders.push(Object.assign({ id: d.id }, d.data())); });

      const total = orders.length;
      const pending = orders.filter(function (o) { return o.status === 'pending'; }).length;
      const spent = orders.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0);

      document.getElementById('statOrders').textContent = total;
      document.getElementById('statPending').textContent = pending;
      document.getElementById('statSpent').textContent = '₹' + spent.toLocaleString('en-IN');

      const body = document.getElementById('ordersBody');
      if (!orders.length) {
        body.innerHTML = '<div class="empty-dash"><div class="icon">📦</div><p>No orders yet. Start by placing your first order.</p><a href="products.html" class="btn-primary" style="margin-top:14px;">Browse Products</a></div>';
      } else {
        let html = '<table style="width:100%;border-collapse:collapse;">'
          + '<thead><tr style="background:#f8fafc;">'
            + '<th style="text-align:left;padding:12px 16px;font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Order ID</th>'
            + '<th style="text-align:left;padding:12px 16px;font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Product</th>'
            + '<th style="text-align:left;padding:12px 16px;font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Total</th>'
            + '<th style="text-align:left;padding:12px 16px;font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Status</th>'
            + '<th style="text-align:left;padding:12px 16px;font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Date</th>'
            + '<th></th>'
          + '</tr></thead><tbody>';
        orders.slice(0, 5).forEach(function (o) {
          const dt = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-IN') : '—';
          html += '<tr style="border-bottom:1px solid #f1f5f9;">'
            + '<td style="padding:14px 16px;"><strong>' + window.escapeHtml(o.orderId || o.id) + '</strong></td>'
            + '<td style="padding:14px 16px;">' + window.escapeHtml(o.product || '—') + '</td>'
            + '<td style="padding:14px 16px;">' + window.fmtMoney(o.total) + '</td>'
            + '<td style="padding:14px 16px;"><span class="pill-status pill-' + (o.status || 'pending') + '">' + (o.status || 'pending') + '</span></td>'
            + '<td style="padding:14px 16px;">' + dt + '</td>'
            + '<td style="padding:14px 16px;"><a href="order-detail.html?id=' + encodeURIComponent(o.orderId) + '" class="btn-outline" style="padding:5px 12px;font-size:.78rem;">View</a></td>'
            + '</tr>';
        });
        html += '</tbody></table>';
        body.innerHTML = html;
      }
    } catch (e) {
      console.warn('[Dashboard] order load failed:', e.message);
      document.getElementById('ordersBody').innerHTML = '<div class="empty-dash"><div class="icon">⚠️</div><p>Could not load orders</p></div>';
    }

    // Complaints count
    try {
      const csnap = await window.db.collection('complaints')
        .where('uid', '==', profile.uid)
        .where('status', 'in', ['open', 'in-progress'])
        .get();
      document.getElementById('statComplaints').textContent = csnap.size;
    } catch (e) {
      document.getElementById('statComplaints').textContent = '0';
    }
  });

  // Logout
  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('logoutBtn');
    if (btn && window.sveLogout) {
      btn.addEventListener('click', function () {
        if (confirm('Logout? / लॉगआउट करें?')) window.sveLogout();
      });
    }
  });

})();
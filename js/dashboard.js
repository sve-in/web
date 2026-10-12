/* ============================================================
   SVE Business Portal — User Dashboard
   ============================================================ */
(function () {
  'use strict';

  if (!window.requireAuth) return;

  window.requireAuth(async function (profile) {
    document.getElementById('userName').textContent = profile.name || profile.businessName || profile.email;
    document.getElementById('userEmail').textContent = profile.email || '';

    // Load orders
    try {
      const snap = await window.db.collection('orders')
        .where('uid', '==', profile.uid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const orders = [];
      snap.forEach(function (d) { orders.push(Object.assign({ id: d.id }, d.data())); });

      // Stats
      const total = orders.length;
      const pending = orders.filter(function (o) { return o.status === 'pending'; }).length;
      const spent = orders.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0);

      document.getElementById('statOrders').textContent = total;
      document.getElementById('statPending').textContent = pending;
      document.getElementById('statSpent').textContent = '₹' + spent.toLocaleString('en-IN');

      // Table
      const body = document.getElementById('ordersBody');
      if (!orders.length) return; // keep empty state
      let html = '<table><thead><tr><th>Order ID</th><th>Product</th><th>Qty</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>';
      orders.forEach(function (o) {
        const dt = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-IN') : '—';
        html += '<tr>'
          + '<td><strong>' + (o.orderId || o.id) + '</strong></td>'
          + '<td>' + (o.product || '—') + '</td>'
          + '<td>' + (o.quantity || '—') + '</td>'
          + '<td>₹' + (o.total ? Number(o.total).toLocaleString('en-IN') : '—') + '</td>'
          + '<td><span class="pill pill-' + (o.status || 'pending') + '">' + (o.status || 'pending') + '</span></td>'
          + '<td>' + dt + '</td>'
          + '</tr>';
      });
      html += '</tbody></table>';
      body.innerHTML = html;
    } catch (e) {
      console.warn('[Dashboard] order load failed:', e.message);
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
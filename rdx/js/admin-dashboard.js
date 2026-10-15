/* ============================================================
   SVE Admin — Dashboard
   ============================================================ */
(function () {
  'use strict';
  if (!window.requireAdmin) return;

  window.requireAdmin(async function (profile) {
    document.getElementById('adminEmail').textContent = profile.email;

    /* -------- Applications -------- */
    try {
      const snap = await window.db.collection('applications').orderBy('createdAt', 'desc').get();
      let total = 0, pending = 0;
      const apps = [];
      snap.forEach(function (d) {
        const a = Object.assign({ id: d.id }, d.data());
        apps.push(a);
        total++;
        if (a.status === 'pending') pending++;
      });

      document.getElementById('sApps').textContent = total;
      document.getElementById('sAppsPending').textContent = pending;

      const wrap = document.getElementById('recentApps');
      if (!apps.length) {
        wrap.innerHTML = '<div class="empty"><div class="ic">📭</div><p>No applications yet</p></div>';
      } else {
        let html = '<table class="admin-table"><thead><tr><th>App ID</th><th>Name</th><th>Business</th><th>City</th><th>Status</th><th>Date</th></tr></thead><tbody>';
        apps.slice(0, 8).forEach(function (a) {
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
      }
    } catch (e) {
      console.error(e);
      document.getElementById('recentApps').innerHTML = '<div class="empty">Failed to load</div>';
    }

    /* -------- Users -------- */
    try {
      const usnap = await window.db.collection('users').get();
      let total = 0, active = 0;
      usnap.forEach(function (d) {
        const u = d.data();
        total++;
        if (u.status === 'active') active++;
      });
      document.getElementById('sUsers').textContent = total;
      document.getElementById('sUsersActive').textContent = active;
    } catch (e) {
      document.getElementById('sUsers').textContent = '—';
    }

    /* -------- Orders -------- */
    try {
      const osnap = await window.db.collection('orders').orderBy('createdAt', 'desc').get();
      let total = 0, revenue = 0;
      const orders = [];
      osnap.forEach(function (d) {
        const o = Object.assign({ id: d.id }, d.data());
        orders.push(o);
        total++;
        revenue += Number(o.total) || 0;
      });
      document.getElementById('sOrders').textContent = total;
      document.getElementById('sRevenue').textContent = revenue.toLocaleString('en-IN');

      const wrap = document.getElementById('recentOrders');
      if (!orders.length) {
        wrap.innerHTML = '<div class="empty"><div class="ic">🛒</div><p>No orders yet</p></div>';
      } else {
        let html = '<table class="admin-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>';
        orders.slice(0, 8).forEach(function (o) {
          const dt = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-IN') : '—';
          html += '<tr>'
            + '<td><strong>' + (o.orderId || o.id) + '</strong></td>'
            + '<td>' + (o.customerName || '—') + '</td>'
            + '<td>' + (o.product || '—') + '</td>'
            + '<td>₹' + (o.total ? Number(o.total).toLocaleString('en-IN') : '—') + '</td>'
            + '<td><span class="pill pill-' + (o.status || 'pending') + '">' + (o.status || 'pending') + '</span></td>'
            + '<td>' + dt + '</td>'
            + '</tr>';
        });
        html += '</tbody></table>';
        wrap.innerHTML = html;
      }
    } catch (e) {
      console.error(e);
      document.getElementById('recentOrders').innerHTML = '<div class="empty">Failed to load</div>';
    }

    /* -------- Complaints -------- */
    try {
      const csnap = await window.db.collection('complaints').get();
      let openCount = 0;
      csnap.forEach(function (d) {
        const c = d.data();
        if (c.status === 'open' || c.status === 'in-progress') openCount++;
      });
      document.getElementById('sComplaints').textContent = openCount;
    } catch (e) {
      document.getElementById('sComplaints').textContent = '0';
    }
  });

})();
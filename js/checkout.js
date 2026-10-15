/* ============================================================
   SVE Business Portal — Checkout
   Login REQUIRED. Only approved users can place orders.
   ============================================================ */

(function () {
  'use strict';

  const content = document.getElementById('coContent');
  if (!content) return;

  let USER = null;

  async function init() {
    // Check login
    window.auth.onAuthStateChanged(async function (user) {
      if (!user) {
        content.innerHTML = '<div class="co-panel" style="text-align:center;padding:40px;">'
          + '<div style="font-size:3rem;margin-bottom:12px;">🔒</div>'
          + '<h2 style="font-size:1.3rem;font-weight:800;margin-bottom:8px;">Login required</h2>'
          + '<p style="color:var(--slate-500);margin-bottom:20px;">Only verified partners can place orders.</p>'
          + '<a href="login.html?next=checkout.html" class="btn-primary btn-lg">Login →</a>'
        + '</div>';
        return;
      }
      const snap = await window.db.collection('users').doc(user.uid).get();
      if (!snap.exists || snap.data().status !== 'active') {
        content.innerHTML = '<div class="co-panel" style="text-align:center;padding:40px;">'
          + '<div style="font-size:3rem;margin-bottom:12px;">⏳</div>'
          + '<h2 style="font-size:1.3rem;font-weight:800;margin-bottom:8px;">Account not approved yet</h2>'
          + '<p style="color:var(--slate-500);margin-bottom:20px;">Your account is pending approval. Please check status.</p>'
          + '<a href="apply-status.html" class="btn-primary">Check Status</a>'
        + '</div>';
        return;
      }
      USER = Object.assign({ uid: user.uid, email: user.email }, snap.data());
      render();
    });
  }

  function render() {
    const cart = window.cartGet();
    if (!cart.length) {
      content.innerHTML = '<div class="co-panel" style="text-align:center;padding:40px;">'
        + '<div style="font-size:3rem;margin-bottom:12px;">🛒</div>'
        + '<h2 style="font-size:1.3rem;font-weight:800;margin-bottom:8px;">Cart is empty</h2>'
        + '<a href="products.html" class="btn-primary">Browse Products</a></div>';
      return;
    }

    const total = window.cartTotal();

    let items = '';
    cart.forEach(function (i) {
      items += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--slate-100);">'
        + '<span>' + window.escapeHtml(i.name) + ' × ' + i.qty + '</span>'
        + '<strong>' + window.fmtMoney(i.price * i.qty) + '</strong>'
        + '</div>';
    });

    content.innerHTML = '<div class="co-layout">'
      + '<form id="coForm" class="co-panel">'
        + '<h3>Delivery Address</h3>'
        + '<div class="field" style="margin-bottom:12px;"><label>Contact Name *</label><input type="text" id="coName" value="' + window.escapeHtml(USER.name || '') + '" required /></div>'
        + '<div class="form-row-2" style="margin-bottom:12px;">'
          + '<div class="field"><label>Phone *</label><input type="tel" id="coPhone" value="' + window.escapeHtml(USER.phone || '') + '" maxlength="10" required /></div>'
          + '<div class="field"><label>Email *</label><input type="email" id="coEmail" value="' + window.escapeHtml(USER.email || '') + '" required /></div>'
        + '</div>'
        + '<div class="field" style="margin-bottom:12px;"><label>Full Address *</label><textarea id="coAddress" required placeholder="Building, street, area…"></textarea></div>'
        + '<div class="form-row-2" style="margin-bottom:12px;">'
          + '<div class="field"><label>City *</label><input type="text" id="coCity" value="' + window.escapeHtml(USER.city || '') + '" required /></div>'
          + '<div class="field"><label>State *</label><input type="text" id="coState" value="' + window.escapeHtml(USER.state || '') + '" required /></div>'
        + '</div>'
        + '<div class="field" style="margin-bottom:12px;"><label>PIN Code *</label><input type="tel" id="coPincode" maxlength="6" required /></div>'
        + '<div class="field" style="margin-bottom:12px;"><label>GST (optional)</label><input type="text" id="coGst" value="' + window.escapeHtml(USER.gst || '') + '" maxlength="15" /></div>'
        + '<div class="field" style="margin-bottom:12px;"><label>Order Notes (optional)</label><textarea id="coNotes" placeholder="Any special instructions…"></textarea></div>'
        + '<div id="coErr" class="alert alert-error" hidden></div>'
        + '<button type="submit" class="btn-primary btn-block btn-lg" id="placeOrderBtn" style="margin-top:14px;">'
          + '<span class="btn-text">Place Order →</span><span class="btn-spinner" hidden></span>'
        + '</button>'
      + '</form>'
      + '<div class="cart-summary">'
        + '<h3 style="font-size:1.1rem;font-weight:800;margin-bottom:14px;">Order Summary</h3>'
        + items
        + '<div class="cart-summary-row total" style="margin-top:14px;"><span>Total</span><span>' + window.fmtMoney(total) + '</span></div>'
        + '<div style="font-size:.78rem;color:var(--slate-500);margin-top:10px;">Payment: Cash / Bank transfer (contact after order)</div>'
      + '</div>'
    + '</div>';

    document.getElementById('coForm').addEventListener('submit', placeOrder);
  }

  async function placeOrder(e) {
    e.preventDefault();
    const btn = document.getElementById('placeOrderBtn');
    const spinner = btn.querySelector('.btn-spinner');
    const btnText = btn.querySelector('.btn-text');
    const errBox = document.getElementById('coErr');
    errBox.hidden = true;

    const addr = {
      name: document.getElementById('coName').value.trim(),
      phone: document.getElementById('coPhone').value.trim(),
      email: document.getElementById('coEmail').value.trim(),
      address: document.getElementById('coAddress').value.trim(),
      city: document.getElementById('coCity').value.trim(),
      state: document.getElementById('coState').value.trim(),
      pincode: document.getElementById('coPincode').value.trim(),
      gst: document.getElementById('coGst').value.trim().toUpperCase(),
      notes: document.getElementById('coNotes').value.trim()
    };

    if (!addr.name || !addr.phone || !addr.address || !addr.city || !addr.state || !addr.pincode) {
      errBox.textContent = 'Please fill all required fields.'; errBox.hidden = false; return;
    }

    btn.disabled = true; spinner.hidden = false; btnText.textContent = 'Placing order…';

    try {
      const cart = window.cartGet();
      const total = window.cartTotal();

      // Generate order id
      const year = new Date().getFullYear();
      const counterRef = window.db.collection('counters').doc('orders_' + year);
      const num = await window.db.runTransaction(async function (tx) {
        const d = await tx.get(counterRef);
        const n = (d.exists ? (d.data().count || 0) : 0) + 1;
        tx.set(counterRef, { count: n, year: year, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return n;
      });
      const orderId = 'SVE-ORD-' + year + '-' + String(num).padStart(4, '0');

      const orderDoc = {
        orderId: orderId,
        uid: USER.uid,
        userEmail: USER.email,
        customerName: addr.name,
        phone: addr.phone,
        email: addr.email,
        items: cart.map(function (i) { return { id: i.id, name: i.name, price: i.price, qty: i.qty, unit: i.unit || '' }; }),
        product: cart.length === 1 ? cart[0].name : (cart.length + ' products'),
        quantity: cart.reduce(function (s, i) { return s + i.qty; }, 0),
        total: total,
        shippingAddress: addr,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await window.db.collection('orders').doc(orderId).set(orderDoc);

      if (window.sheetsSend) {
        window.sheetsSend('order', {
          orderId: orderId,
          userEmail: USER.email,
          customerName: addr.name,
          product: orderDoc.product,
          quantity: orderDoc.quantity,
          total: total,
          status: 'pending'
        });
      }

      window.cartClear();
      if (window.uiToast) window.uiToast('Order placed successfully!', 'success');
      setTimeout(function () { window.location.href = 'order-detail.html?id=' + encodeURIComponent(orderId); }, 500);

    } catch (err) {
      console.error(err);
      errBox.textContent = 'Failed to place order: ' + (err.message || 'Unknown error');
      errBox.hidden = false;
    } finally {
      btn.disabled = false; spinner.hidden = true; btnText.textContent = 'Place Order →';
    }
  }

  init();

})();
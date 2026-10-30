/* ============================================================
   SVE Business Portal — Cart & URL Parsing Logic
   - Guest cart: NO login required to add items
   - Secure: fixed CSV prices, tampered URL prices ignored
   - MOQ Limit Removed: Anyone can checkout!
   ============================================================ */

(function () {
  'use strict';

  // Master Price & Info List (As per CSV) — single source of truth
  const CATALOG = {
    'nikolux_1kg':    { name: 'Nikolux',   size: '1kg',   price: 36,   unit: 'pack', image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_2kg':    { name: 'Nikolux',   size: '2kg',   price: 72,   unit: 'pack', image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_2.5kg':  { name: 'Nikolux',   size: '2.5kg', price: 90,   unit: 'pack', image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_4kg':    { name: 'Nikolux',   size: '4kg',   price: 144,  unit: 'bag',  image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_5kg':    { name: 'Nikolux',   size: '5kg',   price: 180,  unit: 'bag',  image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_10kg':   { name: 'Nikolux',   size: '10kg',  price: 360,  unit: 'bag',  image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_20kg':   { name: 'Nikolux',   size: '20kg',  price: 720,  unit: 'sack', image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_25kg':   { name: 'Nikolux',   size: '25kg',  price: 900,  unit: 'sack', image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },

    'lifestar_1kg':   { name: 'Life Star', size: '1kg',   price: 70,   unit: 'pack', image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_2kg':   { name: 'Life Star', size: '2kg',   price: 140,  unit: 'pack', image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_2.5kg': { name: 'Life Star', size: '2.5kg', price: 175,  unit: 'pack', image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_4kg':   { name: 'Life Star', size: '4kg',   price: 280,  unit: 'bag',  image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_5kg':   { name: 'Life Star', size: '5kg',   price: 350,  unit: 'bag',  image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_10kg':  { name: 'Life Star', size: '10kg',  price: 700,  unit: 'bag',  image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_20kg':  { name: 'Life Star', size: '20kg',  price: 1400, unit: 'sack', image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_25kg':  { name: 'Life Star', size: '25kg',  price: 1750, unit: 'sack', image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },

    'sanjivni_1kg':   { name: 'Sanjivni',  size: '1kg',   price: 95,   unit: 'pack', image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_2kg':   { name: 'Sanjivni',  size: '2kg',   price: 190,  unit: 'pack', image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_2.5kg': { name: 'Sanjivni',  size: '2.5kg', price: 237,  unit: 'pack', image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_4kg':   { name: 'Sanjivni',  size: '4kg',   price: 380,  unit: 'bag',  image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_5kg':   { name: 'Sanjivni',  size: '5kg',   price: 475,  unit: 'bag',  image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_10kg':  { name: 'Sanjivni',  size: '10kg',  price: 950,  unit: 'bag',  image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_20kg':  { name: 'Sanjivni',  size: '20kg',  price: 1900, unit: 'sack', image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_25kg':  { name: 'Sanjivni',  size: '25kg',  price: 2375, unit: 'sack', image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' }
  };

  window.SVE_CATALOG = CATALOG;

  const PATH_ALIASES = [
    { test: /niko/i,   key: 'nikolux'  },
    { test: /life/i,   key: 'lifestar' },
    { test: /sanjiv/i, key: 'sanjivni' }
  ];

  // Fallback for cartUpdateBadge if ui.js doesn't define it
  if (!window.cartUpdateBadge) {
    window.cartUpdateBadge = function () {
      if (window.syncCartBadge) window.syncCartBadge();
    };
  }

  function normalizeSize(raw) {
    if (!raw) return '';
    return String(raw).toLowerCase().replace(/\s+/g, '').replace(/kgs?$/, 'kg');
  }

  function resolveBrandFromPath(path) {
    for (var i = 0; i < PATH_ALIASES.length; i++) {
      if (PATH_ALIASES[i].test.test(path)) return PATH_ALIASES[i].key;
    }
    return null;
  }

  function buildItem(id) {
    var p = CATALOG[id];
    if (!p) return null;
    return {
      id: id,
      name: p.name,
      size: p.size,
      price: p.price,
      quantity: 1,
      image: p.image,
      unit: p.unit || 'pack'
    };
  }

  // ============================================================
  // URL Auto-Add — NO LOGIN CHECK (guest can add)
  // ============================================================
  function handleUrlAutoAdd() {
    var search = window.location.search || '';
    var path = window.location.pathname.toLowerCase().replace(/\.html$/, '').replace(/\/+$/, '');

    if (window.location.hash && window.location.hash.indexOf('?') !== -1) {
      var parts = window.location.hash.split('?');
      search = '?' + parts[1];
      path = parts[0].substring(1).replace(/cart/i, '');
    }

    if (!search || search.indexOf('size=') === -1) return;

    var params = new URLSearchParams(search);
    var size = normalizeSize(params.get('size'));
    if (!size) return;

    var brandKey = resolveBrandFromPath(path);
    if (!brandKey) return;

    var item = buildItem(brandKey + '_' + size);
    if (!item) {
      console.warn('[Cart] Unknown product from URL:', brandKey + '_' + size);
      return;
    }

    window.cartAdd(item);
    window.uiToast(item.name + ' (' + item.size + ') added to your cart.', 'success');
    try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) {}
  }

  // ============================================================
  // Cart Page UI (NO MOQ LIMIT)
  // ============================================================
  function renderCartPage() {
    var content = document.getElementById('cartContent');
    if (!content) return;

    window.cartUpdateBadge();
    var cart = window.cartGet();

    if (!cart.length) {
      content.innerHTML =
        '<div class="empty-pub"><div class="icon">🛒</div><h3>Your cart is empty</h3>' +
        '<p>Add products to get started.</p>' +
        '<a href="products.html" class="btn-primary" style="margin-top:16px;">Browse Products</a></div>';
      return;
    }

    var rows = '';
    var total = 0;

    cart.forEach(function (item) {
      var safe = CATALOG[item.id];
      var unitPrice = safe ? safe.price : Number(item.price) || 0;
      var qty = Number(item.quantity) || 1;
      var subtotal = unitPrice * qty;
      total += subtotal;

      rows +=
        '<tr>' +
          '<td style="display:flex;align-items:center;gap:12px;">' +
            (item.image ? '<img src="' + window.escapeHtml(item.image) + '" style="width:50px;height:50px;object-fit:cover;border-radius:6px;" onerror="this.style.display=\'none\'" />' : '') +
            '<div><strong>' + window.escapeHtml(item.name) + '</strong>' +
            '<div style="font-size:.78rem;color:var(--slate-500);">Size: ' + window.escapeHtml(item.size || 'Standard') + '</div></div>' +
          '</td>' +
          '<td>' + window.fmtMoney(unitPrice) + '</td>' +
          '<td><input type="number" class="qty-input" min="1" value="' + qty + '" data-qty="' + item.id + '" /></td>' +
          '<td><strong>' + window.fmtMoney(subtotal) + '</strong></td>' +
          '<td><button class="btn-ghost" data-remove="' + item.id + '" style="color:var(--red);">🗑</button></td>' +
        '</tr>';
    });

    content.innerHTML =
      '<div class="cart-layout">' +
        '<div>' +
          '<div class="panel" style="background:white;border-radius:var(--radius);border:1px solid var(--slate-100);overflow:hidden;">' +
            '<table class="cart-table"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>' +
            '<tbody>' + rows + '</tbody></table>' +
          '</div>' +
        '</div>' +
        '<div class="cart-summary">' +
          '<h3 style="font-size:1.1rem;font-weight:800;margin-bottom:14px;">Order Summary</h3>' +
          '<div class="cart-summary-row"><span>Items</span><span>' + window.cartCount() + '</span></div>' +
          '<div class="cart-summary-row"><span>Subtotal</span><span>' + window.fmtMoney(total) + '</span></div>' +
          '<div class="cart-summary-row"><span>Shipping</span><span style="color:var(--slate-500);">Calculated at checkout</span></div>' +
          '<div class="cart-summary-row total"><span>Total</span><span>' + window.fmtMoney(total) + '</span></div>' +
          
          // Checkout button (No limit check)
          '<a href="checkout.html" id="checkoutBtn" class="btn-primary btn-block btn-lg" style="margin-top:18px;">Proceed to Checkout →</a>' +
          
          '<button class="btn-ghost btn-block" id="clearCartBtn" style="margin-top:8px;color:var(--red);">Clear Cart</button>' +
        '</div>' +
      '</div>';

    content.querySelectorAll('[data-qty]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        window.cartSetQty(inp.dataset.qty, Math.max(1, Number(inp.value) || 1));
        renderCartPage();
      });
    });
    content.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.cartRemove(btn.dataset.remove);
        window.uiToast('Removed', 'success');
        renderCartPage();
      });
    });
    var clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (confirm('Clear entire cart?')) { window.cartClear(); renderCartPage(); }
      });
    }

    // Login FORCE only at checkout click
    var coBtn = document.getElementById('checkoutBtn');
    if (coBtn) {
      coBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.auth.onAuthStateChanged(function (user) {
          if (user) {
            window.location.href = 'checkout.html';
          } else {
            window.uiToast('Please login to continue to checkout.', 'warning');
            setTimeout(function () {
              window.location.href = 'login.html?next=checkout.html';
            }, 1000);
          }
        });
      });
    }
  }

  // ============================================================
  // Init
  // ============================================================
  document.addEventListener('DOMContentLoaded', function () {
    handleUrlAutoAdd();
    if (document.getElementById('cartContent')) renderCartPage();
  });

})();
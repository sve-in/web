/* ============================================================
   SVE Business Portal — Cart & URL Parsing Logic
   - Auto-add from URL (Hash & Clean URLs)
   - Secure: Uses fixed CSV prices, ignores tampered URL prices
   - Cart UI with MOQ progress bar
   ============================================================ */

(function () {
  'use strict';

  const MOQ_AMOUNT = 25000; // Minimum Order Value ₹25,000

  // Master Price & Info List (As per CSV)
  const CATALOG = {
    'nikolux_1kg':   { name: 'Nikolux',  size: '1kg',   price: 36,   image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_2kg':   { name: 'Nikolux',  size: '2kg',   price: 72,   image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_2.5kg': { name: 'Nikolux',  size: '2.5kg', price: 90,   image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_4kg':   { name: 'Nikolux',  size: '4kg',   price: 144,  image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_5kg':   { name: 'Nikolux',  size: '5kg',   price: 180,  image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_10kg':  { name: 'Nikolux',  size: '10kg',  price: 360,  image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_20kg':  { name: 'Nikolux',  size: '20kg',  price: 720,  image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    'nikolux_25kg':  { name: 'Nikolux',  size: '25kg',  price: 900,  image: 'https://www.sveindia.mywire.org/images/nikolux.jpg' },
    
    'lifestar_1kg':   { name: 'Life Star', size: '1kg',   price: 70,   image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_2kg':   { name: 'Life Star', size: '2kg',   price: 140,  image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_2.5kg': { name: 'Life Star', size: '2.5kg', price: 175,  image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_4kg':   { name: 'Life Star', size: '4kg',   price: 280,  image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_5kg':   { name: 'Life Star', size: '5kg',   price: 350,  image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_10kg':  { name: 'Life Star', size: '10kg',  price: 700,  image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_20kg':  { name: 'Life Star', size: '20kg',  price: 1400, image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },
    'lifestar_25kg':  { name: 'Life Star', size: '25kg',  price: 1750, image: 'https://www.sveindia.mywire.org/images/life-star.jpg' },

    'sanjivni_1kg':   { name: 'Sanjivni', size: '1kg',   price: 95,   image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_2kg':   { name: 'Sanjivni', size: '2kg',   price: 190,  image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_2.5kg': { name: 'Sanjivni', size: '2.5kg', price: 237,  image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_4kg':   { name: 'Sanjivni', size: '4kg',   price: 380,  image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_5kg':   { name: 'Sanjivni', size: '5kg',   price: 475,  image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_10kg':  { name: 'Sanjivni', size: '10kg',  price: 950,  image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_20kg':  { name: 'Sanjivni', size: '20kg',  price: 1900, image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' },
    'sanjivni_25kg':  { name: 'Sanjivni', size: '25kg',  price: 2375, image: 'https://www.sveindia.mywire.org/images/sanjivni.jpg' }
  };

  // 1. URL Parsing Logic (Public site links)
  function handleUrlAutoAdd() {
    let search = window.location.search;
    let path = window.location.pathname.toLowerCase().replace(/\//g, '').replace('.html', '');
    
    // Support for Hash URLs (e.g., #lifecart?size=2kg)
    if (window.location.hash && window.location.hash.includes('?')) {
      let parts = window.location.hash.split('?');
      search = '?' + parts[1];
      path = parts[0].substring(1).replace('cart', ''); 
    }

    if (!search || !search.includes('size=')) return;

    const urlParams = new URLSearchParams(search);
    const size = urlParams.get('size');
    
    if (!size) return;

    // Normalize path to brand name
    let brandKey = path;
    if (brandKey.includes('niko')) brandKey = 'nikolux';
    else if (brandKey.includes('life')) brandKey = 'lifestar';
    else if (brandKey.includes('sanjiv')) brandKey = 'sanjivni';

    // Construct item ID (e.g., 'nikolux_2kg')
    const itemId = brandKey + '_' + size;
    const productData = CATALOG[itemId];

    if (!productData) {
      console.warn('[Cart] Product not found in catalog:', itemId);
      return;
    }

    const newItem = {
      id: itemId,
      name: productData.name,
      size: productData.size,
      price: productData.price, // Using hardcoded secure price
      quantity: 1,
      image: productData.image,
      unit: 'pack'
    };

    window.auth.onAuthStateChanged(function(user) {
      if (user) {
        window.cartAdd(newItem);
        window.uiToast(`${newItem.name} (${newItem.size}) added to your cart.`, 'success');
        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        try { localStorage.setItem('sve_pending_cart', JSON.stringify(newItem)); } catch(e) {}
        window.uiToast('Please login to add products to cart.', 'warning');
        setTimeout(() => { window.location.href = 'login.html?next=cart.html'; }, 1200);
      }
    });
  }

  // 2. Cart Page UI
  function renderCartPage() {
    const content = document.getElementById('cartContent');
    if (!content) return;

    window.cartUpdateBadge();
    const cart = window.cartGet();

    if (!cart.length) {
      content.innerHTML = `<div class="empty-pub"><div class="icon">🛒</div><h3>Your cart is empty</h3><p>Add products to get started.</p><a href="products.html" class="btn-primary" style="margin-top:16px;">Browse Products</a></div>`;
      return;
    }

    let rows = '';
    let total = 0;

    cart.forEach(function (item) {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      rows += `
        <tr>
          <td style="display:flex;align-items:center;gap:12px;">
            ${item.image ? `<img src="${window.escapeHtml(item.image)}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'" />` : ''}
            <div>
              <strong>${window.escapeHtml(item.name)}</strong>
              <div style="font-size:.78rem;color:var(--slate-500);">Size: ${window.escapeHtml(item.size || 'Standard')}</div>
            </div>
          </td>
          <td>${window.fmtMoney(item.price)}</td>
          <td><input type="number" class="qty-input" min="1" value="${item.quantity}" data-qty="${item.id}" /></td>
          <td><strong>${window.fmtMoney(subtotal)}</strong></td>
          <td><button class="btn-ghost" data-remove="${item.id}" style="color:var(--red);">🗑</button></td>
        </tr>`;
    });

    const remaining = MOQ_AMOUNT - total;
    const progressPercent = Math.min((total / MOQ_AMOUNT) * 100, 100);
    const moqMet = total >= MOQ_AMOUNT;

    let moqHtml = moqMet 
      ? `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align:center; color:#166534; font-weight:600;">✅ Minimum Order Value Met! You can proceed to checkout.</div>`
      : `<div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem; color:#92400e; font-weight:600;">
            <span>Minimum Order: ₹25,000</span>
            <span>Add ${window.fmtMoney(remaining)} more</span>
          </div>
          <div style="width: 100%; background: #fef3c7; border-radius: 999px; height: 8px; overflow: hidden;">
            <div style="width: ${progressPercent}%; background: #f59e0b; height: 100%;"></div>
          </div>
        </div>`;

    content.innerHTML = `
      <div class="cart-layout">
        <div>
          ${moqHtml}
          <div class="panel" style="background:white;border-radius:var(--radius);border:1px solid var(--slate-100);overflow:hidden;">
            <table class="cart-table"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead><tbody>${rows}</tbody></table>
          </div>
        </div>
        <div class="cart-summary">
          <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:14px;">Order Summary</h3>
          <div class="cart-summary-row"><span>Items</span><span>${window.cartCount()}</span></div>
          <div class="cart-summary-row"><span>Subtotal</span><span>${window.fmtMoney(total)}</span></div>
          <div class="cart-summary-row"><span>Shipping</span><span style="color:var(--slate-500);">Calculated at checkout</span></div>
          <div class="cart-summary-row total"><span>Total</span><span>${window.fmtMoney(total)}</span></div>
          ${moqMet ? `<a href="checkout.html" class="btn-primary btn-block btn-lg" style="margin-top:18px;">Proceed to Checkout →</a>` : `<button class="btn-outline btn-block btn-lg" style="margin-top:18px; opacity:0.6;" disabled>Minimum Order Required</button>`}
          <button class="btn-ghost btn-block" id="clearCartBtn" style="margin-top:8px;color:var(--red);">Clear Cart</button>
        </div>
      </div>`;

    content.querySelectorAll('[data-qty]').forEach(function (inp) {
      inp.addEventListener('change', function () { window.cartSetQty(inp.dataset.qty, Number(inp.value)); renderCartPage(); });
    });
    content.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.cartRemove(btn.dataset.remove); window.uiToast('Removed', 'success'); renderCartPage(); });
    });
    document.getElementById('clearCartBtn').addEventListener('click', function () {
      if (confirm('Clear entire cart?')) { window.cartClear(); renderCartPage(); }
    });
  }

  // 3. Initialize
  document.addEventListener('DOMContentLoaded', function () {
    // Process pending cart from login redirect
    const pendingStr = localStorage.getItem('sve_pending_cart');
    if (pendingStr) {
      window.auth.onAuthStateChanged(function(user) {
        if (user) {
          try {
            const item = JSON.parse(pendingStr);
            window.cartAdd(item);
            localStorage.removeItem('sve_pending_cart');
            window.uiToast(`${item.name} (${item.size}) added to your cart.`, 'success');
            if (document.getElementById('cartContent')) renderCartPage();
          } catch(e) {}
        }
      });
    }
    handleUrlAutoAdd();
    if (document.getElementById('cartContent')) renderCartPage();
  });

})();
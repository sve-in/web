/* ============================================================
   SVE Business Portal — Single Product Detail
   ============================================================ */

(function () {
  'use strict';

  const container = document.getElementById('pdContainer');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const pid = params.get('id');

  if (!pid) {
    container.innerHTML = '<div class="empty-pub"><div class="icon">❓</div><h3>Product not specified</h3><a href="products.html" class="btn-primary" style="margin-top:16px;">Browse Products</a></div>';
    return;
  }

  let PRODUCT = null;

  async function load() {
    try {
      const doc = await window.db.collection('products').doc(pid).get();
      if (!doc.exists) {
        container.innerHTML = '<div class="empty-pub"><div class="icon">📦</div><h3>Product not found</h3><a href="products.html" class="btn-primary" style="margin-top:16px;">Browse Products</a></div>';
        return;
      }
      PRODUCT = Object.assign({ id: doc.id }, doc.data());
      document.title = (PRODUCT.name || 'Product') + ' — SVE';
      render();
    } catch (e) {
      console.error(e);
      container.innerHTML = '<div class="empty-pub"><div class="icon">⚠️</div><h3>Error loading product</h3></div>';
    }
  }

  function render() {
    const img = PRODUCT.image || '';
    const price = window.fmtMoney(PRODUCT.price);
    const unit = PRODUCT.unit ? '<small> / ' + window.escapeHtml(PRODUCT.unit) + '</small>' : '';

    container.innerHTML = '<div class="pd-grid">'
      + '<div class="pd-img">' + (img ? '<img src="' + window.escapeHtml(img) + '" alt="' + window.escapeHtml(PRODUCT.name) + '" />' : '<div style="color:#94a3b8;font-size:3rem;">📦</div>') + '</div>'
      + '<div>'
        + (PRODUCT.brand ? '<div class="pd-brand">' + window.escapeHtml(PRODUCT.brand) + '</div>' : '')
        + '<h1 class="pd-name">' + window.escapeHtml(PRODUCT.name) + '</h1>'
        + (PRODUCT.nameHi ? '<p style="color:var(--slate-500);margin-bottom:8px;">' + window.escapeHtml(PRODUCT.nameHi) + '</p>' : '')
        + '<div class="pd-price">' + price + unit + '</div>'
        + '<p class="pd-desc">' + window.escapeHtml(PRODUCT.description || PRODUCT.tagline || '') + '</p>'
        + '<div class="pd-qty">'
          + '<button id="qDec">−</button>'
          + '<input type="number" id="qtyInput" value="1" min="1" />'
          + '<button id="qInc">+</button>'
        + '</div>'
        + '<div style="display:flex;gap:12px;flex-wrap:wrap;">'
          + '<button class="btn-primary btn-lg" id="addCartBtn" style="flex:1;">🛒 Add to Cart</button>'
          + '<a href="cart.html" class="btn-outline btn-lg">Go to Cart →</a>'
        + '</div>'
        + '<div class="pd-meta">'
          + (PRODUCT.unit ? '<div>📦 Unit: ' + window.escapeHtml(PRODUCT.unit) + '</div>' : '')
          + (PRODUCT.category ? '<div>🏷 Category: ' + window.escapeHtml(PRODUCT.category) + '</div>' : '')
          + (PRODUCT.stock != null ? '<div>✅ In stock</div>' : '')
          + '<div>🚚 Dispatched within 24-48 hours</div>'
          + '<div>📄 GST invoice provided</div>'
        + '</div>'
      + '</div>'
    + '</div>';

    document.getElementById('qDec').addEventListener('click', function () {
      const q = document.getElementById('qtyInput');
      q.value = Math.max(1, Number(q.value) - 1);
    });
    document.getElementById('qInc').addEventListener('click', function () {
      const q = document.getElementById('qtyInput');
      q.value = Number(q.value) + 1;
    });
    document.getElementById('addCartBtn').addEventListener('click', function () {
      const q = Math.max(1, Number(document.getElementById('qtyInput').value) || 1);
      window.cartAdd(PRODUCT, q);
      if (window.uiToast) window.uiToast('Added ' + q + ' to cart', 'success');
    });
  }

  load();

})();
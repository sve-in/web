/* ============================================================
   SVE Business Portal — Products listing
   Loads active products from Firestore, filter/sort.
   ============================================================ */

(function () {
  'use strict';

  const grid = document.getElementById('productGrid');
  if (!grid) return;

  let ALL = [];
  let filtered = [];

  async function load() {
    try {
      const snap = await window.db.collection('products').where('active', '==', true).get();
      ALL = [];
      snap.forEach(function (d) { ALL.push(Object.assign({ id: d.id }, d.data())); });

      if (!ALL.length) {
        // Fallback: try without active filter (in case all have active=false)
        const snap2 = await window.db.collection('products').limit(50).get();
        snap2.forEach(function (d) { ALL.push(Object.assign({ id: d.id }, d.data())); });
      }

      // Populate brand filter
      const brands = Array.from(new Set(ALL.map(function (p) { return p.brand || p.category || ''; }).filter(Boolean)));
      const bSel = document.getElementById('brandFilter');
      brands.sort().forEach(function (b) {
        const o = document.createElement('option');
        o.value = b; o.textContent = b;
        bSel.appendChild(o);
      });

      applyFilters();
    } catch (e) {
      console.error(e);
      grid.innerHTML = '<div class="empty-pub"><div class="icon">⚠️</div><h3>Could not load products</h3><p>Please refresh the page.</p></div>';
    }
  }

  function applyFilters() {
    const q = (document.getElementById('searchBox').value || '').toLowerCase().trim();
    const brand = document.getElementById('brandFilter').value;
    const sort = document.getElementById('sortBy').value;

    filtered = ALL.filter(function (p) {
      if (brand && (p.brand || p.category) !== brand) return false;
      if (q) {
        const hay = ((p.name || '') + ' ' + (p.nameHi || '') + ' ' + (p.description || '') + ' ' + (p.brand || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (sort === 'priceAsc') filtered.sort(function (a, b) { return (a.price || 0) - (b.price || 0); });
    else if (sort === 'priceDesc') filtered.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
    else filtered.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });

    render();
  }

  function render() {
    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-pub" style="grid-column:1/-1;"><div class="icon">📦</div><h3>No products found</h3><p>Try different filters.</p></div>';
      return;
    }
    let html = '';
    filtered.forEach(function (p) {
      const img = p.image || '';
      const price = window.fmtMoney(p.price);
      const unit = p.unit ? '<small> / ' + window.escapeHtml(p.unit) + '</small>' : '';
      html += '<div class="product-card">'
        + (img ? '<img src="' + window.escapeHtml(img) + '" class="product-img" onerror="this.style.display=\'none\'" />' : '<div class="product-img"></div>')
        + '<div class="product-body">'
          + (p.brand ? '<div class="product-brand">' + window.escapeHtml(p.brand) + '</div>' : '')
          + '<div class="product-name">' + window.escapeHtml(p.name) + '</div>'
          + '<div class="product-desc">' + window.escapeHtml(p.description || p.tagline || '') + '</div>'
          + '<div class="product-price">' + price + unit + '</div>'
          + '<div class="product-actions">'
            + '<a href="product-detail.html?id=' + encodeURIComponent(p.id) + '" class="btn-outline" style="flex:1;">View</a>'
            + '<button class="btn-primary" data-add="' + p.id + '">+ Cart</button>'
          + '</div>'
        + '</div>'
        + '</div>';
    });
    grid.innerHTML = html;

    grid.querySelectorAll('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () {
        const p = ALL.find(function (x) { return x.id === b.dataset.add; });
        if (!p) return;
        window.cartAdd(p, 1);
        if (window.uiToast) window.uiToast('Added to cart', 'success');
      });
    });
  }

  ['searchBox', 'brandFilter', 'sortBy'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', applyFilters);
    if (el) el.addEventListener('change', applyFilters);
  });
  document.getElementById('clearFilters').addEventListener('click', function () {
    document.getElementById('searchBox').value = '';
    document.getElementById('brandFilter').value = '';
    document.getElementById('sortBy').value = 'name';
    applyFilters();
  });

  load();

})();
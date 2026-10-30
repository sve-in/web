/* ============================================================
   SVE Business Portal — Shared UI helpers
   Toast, modal, formatting, loader
   ============================================================ */

(function () {
  'use strict';

  /* ---------- TOAST ---------- */
  window.uiToast = function (msg, type) {
    let box = document.getElementById('toastBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toastBox';
      box.className = 'toast-box';
      document.body.appendChild(box);
    }
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('hide');
      setTimeout(function () { t.remove(); }, 300);
    }, 3500);
  };

  /* ---------- MODAL ---------- */
  window.uiOpenModal = function (id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('open');
  };
  window.uiCloseModal = function (id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('open');
  };

  /* ---------- LOADER ---------- */
  window.uiShowLoader = function () {
    let el = document.getElementById('pubLoader');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pubLoader';
      el.className = 'pub-loader';
      el.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(el);
    }
    el.classList.remove('hidden');
  };
  window.uiHideLoader = function () {
    const el = document.getElementById('pubLoader');
    if (el) el.classList.add('hidden');
  };

  /* ---------- FORMATTING ---------- */
  window.fmtMoney = function (n) {
    const num = Number(n) || 0;
    return '₹' + num.toLocaleString('en-IN');
  };
  window.fmtDate = function (ts) {
    if (!ts) return '—';
    let d;
    if (ts.seconds) d = new Date(ts.seconds * 1000);
    else if (ts.toDate) d = ts.toDate();
    else d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  window.fmtDateTime = function (ts) {
    if (!ts) return '—';
    let d;
    if (ts.seconds) d = new Date(ts.seconds * 1000);
    else if (ts.toDate) d = ts.toDate();
    else d = new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  window.escapeHtml = function (s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /* ---------- CART HELPERS (localStorage) ---------- */
  const CART_KEY = 'sve_cart_v1';
  window.cartGet = function () {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; }
  };
  window.cartSave = function (items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {}
    window.cartUpdateBadge();
  };
  window.cartAdd = function (product, qty) {
    qty = Number(qty) || 1;
    const cart = window.cartGet();
    const idx = cart.findIndex(function (i) { return i.id === product.id; });
    if (idx >= 0) cart[idx].qty += qty;
    else cart.push({ id: product.id, name: product.name, price: Number(product.price) || 0, image: product.image || '', unit: product.unit || '', qty: qty });
    window.cartSave(cart);
  };
  window.cartRemove = function (id) {
    const cart = window.cartGet().filter(function (i) { return i.id !== id; });
    window.cartSave(cart);
  };
  window.cartSetQty = function (id, qty) {
    qty = Number(qty) || 1;
    if (qty < 1) qty = 1;
    const cart = window.cartGet();
    const idx = cart.findIndex(function (i) { return i.id === id; });
    if (idx >= 0) { cart[idx].qty = qty; window.cartSave(cart); }
  };
  window.cartClear = function () {
    try { localStorage.removeItem(CART_KEY); } catch (e) {}
    window.cartUpdateBadge();
  };
  window.cartCount = function () {
    return window.cartGet().reduce(function (s, i) { return s + (i.qty || 0); }, 0);
  };
  window.cartTotal = function () {
    return window.cartGet().reduce(function (s, i) { return s + (i.qty * i.price); }, 0);
  };
  window.cartUpdateBadge = function () {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      const c = window.cartCount();
      el.setAttribute('data-count', c);
      el.textContent = c > 0 ? c : '';
    });
  };

  /* ---------- NAVBAR CART LINK ---------- */
  window.injectCartLink = function () {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    if (navActions.querySelector('.cart-nav-link')) return;
    const a = document.createElement('a');
    a.href = 'cart.html';
    a.className = 'btn-ghost cart-badge cart-nav-link';
    a.setAttribute('data-cart-count', window.cartCount());
    a.setAttribute('title', 'Cart');
    a.innerHTML = '🛒 Cart';
    const firstBtn = navActions.querySelector('.btn-ghost');
    if (firstBtn) navActions.insertBefore(a, firstBtn);
    else navActions.appendChild(a);
  };

  /* ---------- INIT ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    window.cartUpdateBadge();
  });

})();
/* ============================================================
   SVE Business Portal — Cart page
   ============================================================ */

(function () {
  'use strict';

  const content = document.getElementById('cartContent');
  if (!content) return;

  function render() {
    const cart = window.cartGet();
    if (!cart.length) {
      content.innerHTML = '<div class="empty-pub"><div class="icon">🛒</div><h3>Your cart is empty</h3><p>Add products to get started.</p><a href="products.html" class="btn-primary" style="margin-top:16px;">Browse Products</a></div>';
      return;
    }

    let rows = '';
    cart.forEach(function (i) {
      rows += '<tr>'
        + '<td style="display:flex;align-items:center;gap:12px;">'
          + (i.image ? '<img src="' + window.escapeHtml(i.image) + '" style="width:50px;height:50px;object-fit:cover;border-radius:6px;" onerror="this.style.display=\'none\'" />' : '')
          + '<div><strong>' + window.escapeHtml(i.name) + '</strong>' + (i.unit ? '<div style="font-size:.78rem;color:var(--slate-500);">' + window.escapeHtml(i.unit) + '</div>' : '') + '</div>'
        + '</td>'
        + '<td>' + window.fmtMoney(i.price) + '</td>'
        + '<td><input type="number" class="qty-input" min="1" value="' + i.qty + '" data-qty="' + i.id + '" /></td>'
        + '<td><strong>' + window.fmtMoney(i.price * i.qty) + '</strong></td>'
        + '<td><button class="btn-ghost" data-remove="' + i.id + '" style="color:var(--red);">🗑</button></td>'
        + '</tr>';
    });

    const total = window.cartTotal();

    content.innerHTML = '<div class="cart-layout">'
      + '<div class="panel" style="background:white;border-radius:var(--radius);border:1px solid var(--slate-100);overflow:hidden;">'
        + '<table class="cart-table"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>'
        + '<tbody>' + rows + '</tbody></table>'
      + '</div>'
      + '<div class="cart-summary">'
        + '<h3 style="font-size:1.1rem;font-weight:800;margin-bottom:14px;">Summary</h3>'
        + '<div class="cart-summary-row"><span>Items</span><span>' + window.cartCount() + '</span></div>'
        + '<div class="cart-summary-row"><span>Subtotal</span><span>' + window.fmtMoney(total) + '</span></div>'
        + '<div class="cart-summary-row"><span>Shipping</span><span style="color:var(--slate-500);">Calculated at checkout</span></div>'
        + '<div class="cart-summary-row total"><span>Total</span><span>' + window.fmtMoney(total) + '</span></div>'
        + '<a href="checkout.html" class="btn-primary btn-block btn-lg" style="margin-top:18px;">Proceed to Checkout →</a>'
        + '<button class="btn-ghost btn-block" id="clearCartBtn" style="margin-top:8px;color:var(--red);">Clear Cart</button>'
      + '</div>'
    + '</div>';

    // Events
    content.querySelectorAll('[data-qty]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        window.cartSetQty(inp.dataset.qty, Number(inp.value));
        render();
      });
    });
    content.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.cartRemove(btn.dataset.remove);
        if (window.uiToast) window.uiToast('Removed from cart', 'success');
        render();
      });
    });
    document.getElementById('clearCartBtn').addEventListener('click', function () {
      if (confirm('Clear entire cart?')) { window.cartClear(); render(); }
    });
  }

  render();

})();
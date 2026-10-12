/* ============================================================
   SVE Admin — Products Management
   ============================================================ */
(function () {
  'use strict';
  if (!window.requireAdmin) return;

  const grid = document.getElementById('prodGrid');
  const modal = document.getElementById('prodModal');
  const form = document.getElementById('prodForm');
  const errBox = document.getElementById('prodErr');
  const title = document.getElementById('modalTitle');

  window.requireAdmin(async function () {
    document.getElementById('addBtn').addEventListener('click', function () { openModal(); });
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    form.addEventListener('submit', save);
    await load();
  });

  async function load() {
    grid.innerHTML = '<div class="loading-block"><span class="spinner"></span> Loading…</div>';
    try {
      const snap = await window.db.collection('products').orderBy('name').get();
      if (snap.empty) {
        grid.innerHTML = '<div class="empty" style="grid-column:1/-1;"><div class="ic">📦</div><p>No products yet. Add your first product.</p></div>';
        return;
      }
      let html = '';
      snap.forEach(function (d) {
        const p = d.data();
        const stock = Number(p.stock) || 0;
        html += '<div class="prod-card">'
          + '<h4>' + (p.name || '—') + '</h4>'
          + (p.nameHi ? '<div class="sub">' + p.nameHi + '</div>' : '')
          + '<div class="price">₹' + (Number(p.price) || 0).toLocaleString('en-IN') + (p.unit ? ' / ' + p.unit : '') + '</div>'
          + '<div class="stock">Stock: <span class="' + (stock < 10 ? 'low' : '') + '">' + stock + (stock < 10 ? ' ⚠ low' : '') + '</span></div>'
          + '<div class="actions">'
            + '<button class="btn-outline btn-sm" data-edit="' + d.id + '">Edit</button>'
            + '<button class="btn-danger btn-sm" data-del="' + d.id + '">Delete</button>'
          + '</div></div>';
      });
      grid.innerHTML = html;

      grid.querySelectorAll('[data-edit]').forEach(function (b) {
        b.addEventListener('click', async function () {
          const d = await window.db.collection('products').doc(b.dataset.edit).get();
          if (d.exists) openModal(Object.assign({ _id: d.id }, d.data()));
        });
      });
      grid.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', async function () {
          if (!confirm('Delete this product?')) return;
          try {
            await window.db.collection('products').doc(b.dataset.del).delete();
            window.adminToast('Product deleted', 'success');
            await load();
          } catch (e) { window.adminToast('Failed: ' + e.message, 'error'); }
        });
      });
    } catch (e) {
      console.error(e);
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1;">Failed to load</div>';
    }
  }

  function openModal(p) {
    errBox.hidden = true;
    if (p) {
      title.textContent = 'Edit Product';
      document.getElementById('prodId').value = p._id || '';
      document.getElementById('pName').value = p.name || '';
      document.getElementById('pNameHi').value = p.nameHi || '';
      document.getElementById('pPrice').value = p.price || '';
      document.getElementById('pUnit').value = p.unit || '';
      document.getElementById('pStock').value = p.stock || 0;
      document.getElementById('pCategory').value = p.category || '';
      document.getElementById('pImage').value = p.image || '';
      document.getElementById('pTagline').value = p.tagline || '';
      document.getElementById('pActive').checked = p.active !== false;
    } else {
      title.textContent = 'Add Product';
      form.reset();
      document.getElementById('prodId').value = '';
      document.getElementById('pStock').value = 0;
      document.getElementById('pActive').checked = true;
    }
    modal.classList.add('open');
  }
  function closeModal() { modal.classList.remove('open'); }

  async function save(e) {
    e.preventDefault();
    errBox.hidden = true;
    const id = document.getElementById('prodId').value;
    const data = {
      name:     document.getElementById('pName').value.trim(),
      nameHi:   document.getElementById('pNameHi').value.trim(),
      price:    Number(document.getElementById('pPrice').value) || 0,
      unit:     document.getElementById('pUnit').value.trim(),
      stock:    Number(document.getElementById('pStock').value) || 0,
      category: document.getElementById('pCategory').value.trim(),
      image:    document.getElementById('pImage').value.trim(),
      tagline:  document.getElementById('pTagline').value.trim(),
      active:   document.getElementById('pActive').checked,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (!data.name) { errBox.textContent='Name required'; errBox.hidden=false; return; }

    try {
      if (id) {
        await window.db.collection('products').doc(id).update(data);
        window.adminToast('Product updated', 'success');
      } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await window.db.collection('products').add(data);
        window.adminToast('Product added', 'success');
      }
      closeModal();
      await load();
    } catch (e2) {
      console.error(e2);
      errBox.textContent = 'Failed: ' + e2.message;
      errBox.hidden = false;
    }
  }

})();
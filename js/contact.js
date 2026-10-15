/* ============================================================
   SVE Business Portal — Contact form
   ============================================================ */

(function () {
  'use strict';

  const form = document.getElementById('contactForm');
  if (!form) return;

  // Load contact info
  (async function loadInfo() {
    try {
      const doc = await window.db.collection('settings').doc('company').get();
      const el = document.getElementById('contactInfo');
      if (!doc.exists) { el.innerHTML = '<div>—</div>'; return; }
      const s = doc.data();
      const rows = [];
      if (s.name) rows.push('🏢 <strong>' + window.escapeHtml(s.name) + '</strong>');
      if (s.address) rows.push('📍 ' + window.escapeHtml(s.address));
      if (s.phone) rows.push('📞 <a href="tel:' + window.escapeHtml(s.phone) + '">' + window.escapeHtml(s.phone) + '</a>');
      if (s.email) rows.push('📧 <a href="mailto:' + window.escapeHtml(s.email) + '">' + window.escapeHtml(s.email) + '</a>');
      if (s.whatsapp) rows.push('💬 <a target="_blank" rel="noopener" href="https://wa.me/' + String(s.whatsapp).replace(/\D/g,'') + '">WhatsApp</a>');
      if (s.gst) rows.push('🧾 GST: ' + window.escapeHtml(s.gst));
      el.innerHTML = rows.map(function (r) { return '<div>' + r + '</div>'; }).join('');
    } catch (e) { console.warn(e); }
  })();

  const btn = document.getElementById('cBtn');
  const spinner = btn.querySelector('.btn-spinner');
  const btnText = btn.querySelector('.btn-text');
  const errBox = document.getElementById('cErr');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errBox.hidden = true;
    const data = {
      name: document.getElementById('cName').value.trim(),
      phone: document.getElementById('cPhone').value.trim(),
      email: document.getElementById('cEmail').value.trim().toLowerCase(),
      subject: document.getElementById('cSubject').value.trim(),
      message: document.getElementById('cMessage').value.trim()
    };
    if (!data.name || !data.phone || !data.email || !data.message) {
      errBox.textContent = 'Please fill all required fields.'; errBox.hidden = false; return;
    }
    if (!/^[6-9]\d{9}$/.test(data.phone)) { errBox.textContent = 'Enter valid 10-digit mobile.'; errBox.hidden = false; return; }

    btn.disabled = true; spinner.hidden = false; btnText.textContent = 'Sending…';
    try {
      const payload = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        message: (data.subject ? '[' + data.subject + '] ' : '') + data.message,
        source: 'contact-form',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await window.db.collection('leads').add(payload);
      if (window.sheetsSend) {
        window.sheetsSend('lead', {
          name: data.name, phone: data.phone, email: data.email,
          message: payload.message, source: 'contact-form', appId: ''
        });
      }
      form.reset();
      if (window.uiToast) window.uiToast('Message sent! We\'ll reach out soon.', 'success');
    } catch (err) {
      console.error(err);
      errBox.textContent = 'Failed: ' + err.message; errBox.hidden = false;
    } finally {
      btn.disabled = false; spinner.hidden = true; btnText.textContent = 'Send Message →';
    }
  });

})();
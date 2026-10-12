/* ============================================================
   SVE Admin — Settings
   ============================================================ */
(function () {
  'use strict';
  if (!window.requireAdmin) return;

  window.requireAdmin(async function (profile) {
    const form = document.getElementById('settingsForm');
    const err = document.getElementById('settingsErr');
    const ok  = document.getElementById('settingsOk');

    // Load existing
    try {
      const doc = await window.db.collection('settings').doc('company').get();
      if (doc.exists) {
        const s = doc.data();
        document.getElementById('sName').value = s.name || '';
        document.getElementById('sAddress').value = s.address || '';
        document.getElementById('sPhone').value = s.phone || '';
        document.getElementById('sEmail').value = s.email || '';
        document.getElementById('sWhatsapp').value = s.whatsapp || '';
        document.getElementById('sGst').value = s.gst || '';
      }
    } catch (e) { console.warn(e); }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      err.hidden = true; ok.hidden = true;
      const data = {
        name:     document.getElementById('sName').value.trim(),
        address:  document.getElementById('sAddress').value.trim(),
        phone:    document.getElementById('sPhone').value.trim(),
        email:    document.getElementById('sEmail').value.trim(),
        whatsapp: document.getElementById('sWhatsapp').value.trim(),
        gst:      document.getElementById('sGst').value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: profile.email
      };
      try {
        await window.db.collection('settings').doc('company').set(data, { merge: true });
        ok.textContent = 'Settings saved ✓';
        ok.hidden = false;
        window.adminToast('Settings saved', 'success');
      } catch (e2) {
        console.error(e2);
        err.textContent = 'Failed: ' + e2.message;
        err.hidden = false;
      }
    });
  });

})();
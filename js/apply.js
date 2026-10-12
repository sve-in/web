/* ============================================================
   SVE Business Portal — Apply Form Logic
   - Validates form
   - Uploads document to Storage
   - Generates Application ID (SVE-APP-YYYY-NNNN) atomically
   - Saves to Firestore "applications"
   - Also logs to "leads" for admin leads view
   ============================================================ */

(function () {
  'use strict';

  const form        = document.getElementById('applyForm');
  if (!form) return;

  const submitBtn   = document.getElementById('submitBtn');
  const spinner     = submitBtn.querySelector('.btn-spinner');
  const btnText     = submitBtn.querySelector('.btn-text');
  const formError   = document.getElementById('formError');
  const uploadBox   = document.getElementById('uploadBox');
  const docFile     = document.getElementById('docFile');
  const fileName    = document.getElementById('fileName');
  const formSection = document.getElementById('formSection');
  const successSec  = document.getElementById('successSection');
  const appIdVal    = document.getElementById('appIdVal');
  const copyBtn     = document.getElementById('copyAppId');

  /* ---------- FILE UPLOAD UI ---------- */
  uploadBox.addEventListener('click', function () { docFile.click(); });
  docFile.addEventListener('change', function () {
    if (docFile.files && docFile.files[0]) {
      const f = docFile.files[0];
      fileName.textContent = '✓ ' + f.name + ' (' + (f.size / 1024 / 1024).toFixed(2) + ' MB)';
      uploadBox.classList.add('has-file');
    }
  });
  ['dragover', 'dragenter'].forEach(function (ev) {
    uploadBox.addEventListener(ev, function (e) { e.preventDefault(); uploadBox.classList.add('has-file'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    uploadBox.addEventListener(ev, function (e) {
      e.preventDefault();
      if (ev === 'drop' && e.dataTransfer.files[0]) {
        docFile.files = e.dataTransfer.files;
        docFile.dispatchEvent(new Event('change'));
      } else if (ev === 'dragleave') {
        if (!docFile.files || !docFile.files[0]) uploadBox.classList.remove('has-file');
      }
    });
  });

  /* ---------- VALIDATORS ---------- */
  function setError(el, msg) {
    const field = el.closest('.field');
    if (field) {
      field.classList.add('has-error');
      const e = field.querySelector('.err');
      if (e && msg) e.textContent = msg;
    }
  }
  function clearErrors() {
    form.querySelectorAll('.field.has-error').forEach(function (f) { f.classList.remove('has-error'); });
    formError.hidden = true;
  }
  function validatePhone(v) { return /^[6-9]\d{9}$/.test(String(v || '').trim()); }
  function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); }

  /* ---------- APPLICATION ID GENERATOR ---------- */
  async function generateAppId() {
    const year = new Date().getFullYear();
    const counterRef = window.db.collection('counters').doc('applications_' + year);
    const newCount = await window.db.runTransaction(async function (tx) {
      const doc = await tx.get(counterRef);
      const current = doc.exists ? (doc.data().count || 0) : 0;
      const next = current + 1;
      tx.set(counterRef, { count: next, year: year, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return next;
    });
    const padded = String(newCount).padStart(4, '0');
    return 'SVE-APP-' + year + '-' + padded;
  }

  /* ---------- UPLOAD FILE ---------- */
  async function uploadDocument(file, appId) {
    if (!file) return '';
    const ext = file.name.split('.').pop().toLowerCase();
    const path = 'applications/' + appId + '/document.' + ext;
    const ref = window.storage.ref(path);
    const snap = await ref.put(file, { contentType: file.type });
    return await snap.ref.getDownloadURL();
  }

  /* ---------- SUBMIT ---------- */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearErrors();

    const data = {
      name:         document.getElementById('name').value.trim(),
      phone:        document.getElementById('phone').value.trim(),
      email:        document.getElementById('email').value.trim().toLowerCase(),
      businessName: document.getElementById('businessName').value.trim(),
      city:         document.getElementById('city').value.trim(),
      state:        document.getElementById('state').value,
      businessType: document.getElementById('businessType').value,
      gst:          document.getElementById('gst').value.trim().toUpperCase(),
      volume:       document.getElementById('volume').value,
      message:      document.getElementById('message').value.trim()
    };

    // Validate
    let hasErr = false;
    if (!data.name)                { setError(document.getElementById('name'), 'Please enter your name'); hasErr = true; }
    if (!validatePhone(data.phone)){ setError(document.getElementById('phone'), 'Enter valid 10-digit mobile'); hasErr = true; }
    if (!validateEmail(data.email)){ setError(document.getElementById('email'), 'Enter a valid email'); hasErr = true; }
    if (!data.businessName)        { setError(document.getElementById('businessName'), 'Please enter business name'); hasErr = true; }
    if (!data.city)                { setError(document.getElementById('city'), 'Please enter city'); hasErr = true; }
    if (!data.state)               { setError(document.getElementById('state'), 'Please select state'); hasErr = true; }
    if (!data.businessType)        { setError(document.getElementById('businessType'), 'Please select type'); hasErr = true; }
    if (!data.volume)              { setError(document.getElementById('volume'), 'Please select volume'); hasErr = true; }

    if (hasErr) {
      formError.textContent = 'Please fix the highlighted fields. / कृपया हाइलाइट किए गए फ़ील्ड ठीक करें।';
      formError.hidden = false;
      formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Lock button
    submitBtn.disabled = true;
    spinner.hidden = false;
    btnText.textContent = 'Submitting…';

    try {
      // 1. Generate Application ID
      const appId = await generateAppId();
      console.log('[Apply] Application ID:', appId);

      // 2. Upload document (if any)
      let docUrl = '';
      const file = docFile.files && docFile.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File size exceeds 5MB / फ़ाइल 5MB से बड़ी है');
        }
        try {
          docUrl = await uploadDocument(file, appId);
        } catch (upErr) {
          console.warn('[Apply] Upload failed:', upErr.message);
          // Continue without doc — admin can ask for it later
        }
      }

      // 3. Save to "applications"
      const appDoc = {
        applicationId: appId,
        name:          data.name,
        phone:         data.phone,
        email:         data.email,
        businessName:  data.businessName,
        city:          data.city,
        state:         data.state,
        businessType:  data.businessType,
        gst:           data.gst || '',
        volume:        data.volume,
        message:       data.message || '',
        docUrl:        docUrl,
        status:        'pending',
        source:        'portal-apply',
        uid:           (window.auth.currentUser && window.auth.currentUser.uid) || null,
        createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt:     firebase.firestore.FieldValue.serverTimestamp()
      };

      await window.db.collection('applications').doc(appId).set(appDoc);

      // 4. Also add to "leads" for admin quick-view
      await window.db.collection('leads').add({
        name:      data.name,
        phone:     data.phone,
        email:     data.email,
        message:   'Distributor Application: ' + data.businessName + ' (' + data.city + ')',
        source:    'portal-apply',
        appId:     appId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('[Apply] Saved successfully:', appId);

      // 5. Show success screen
      appIdVal.textContent = appId;
      formSection.style.display = 'none';
      successSec.classList.add('show');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (window.showToast) window.showToast('Application submitted successfully!', 'success');

    } catch (err) {
      console.error('[Apply] Error:', err);
      let msg = 'Something went wrong. Please try again. / कुछ गलत हुआ। कृपया पुनः प्रयास करें।';
      if (err.message && err.message.indexOf('File size') === 0) msg = err.message;
      formError.textContent = msg;
      formError.hidden = false;
      formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      submitBtn.disabled = false;
      spinner.hidden = true;
      btnText.textContent = 'Submit Application →';
    }
  });

  /* ---------- COPY APP ID ---------- */
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const id = appIdVal.textContent;
      if (!id || id === '—') return;
      navigator.clipboard.writeText(id).then(function () {
        copyBtn.textContent = '✓ Copied!';
        if (window.showToast) window.showToast('Application ID copied', 'success');
        setTimeout(function () { copyBtn.textContent = '📋 Copy ID'; }, 2000);
      }).catch(function () {
        if (window.showToast) window.showToast('Copy failed — please select and copy manually', 'error');
      });
    });
  }

})();
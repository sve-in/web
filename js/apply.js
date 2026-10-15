/* ============================================================
   SVE Business Portal — Apply Form
   Fix: users doc create is best-effort, applications save is critical
   ============================================================ */

(function () {
  'use strict';

  const form = document.getElementById('applyForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const spinner = submitBtn.querySelector('.btn-spinner');
  const btnText = submitBtn.querySelector('.btn-text');
  const formError = document.getElementById('formError');
  const formSection = document.getElementById('formSection');
  const successSec = document.getElementById('successSection');
  const appIdVal = document.getElementById('appIdVal');
  const copyBtn = document.getElementById('copyAppId');

  const isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); };
  const isPhone = function (v) { return /^[6-9]\d{9}$/.test(String(v || '').trim()); };

  function setError(id, msg) {
    const inp = document.getElementById(id);
    const f = inp.closest('.field');
    f.classList.add('has-error');
    const e = f.querySelector('.err');
    if (e && msg) e.textContent = msg;
  }
  function clearErrors() {
    form.querySelectorAll('.field.has-error').forEach(function (f) { f.classList.remove('has-error'); });
    formError.hidden = true;
  }

  document.getElementById('togglePass').addEventListener('click', function () {
    const p = document.getElementById('password');
    p.type = p.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('password').addEventListener('input', function () {
    const v = this.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const labels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
    const el = document.getElementById('pwStrength');
    el.textContent = v ? 'Strength: ' + (labels[score] || '—') : '';
    el.style.color = score >= 4 ? 'var(--green)' : (score >= 3 ? 'var(--amber)' : 'var(--red)');
  });

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
    const pw1 = document.getElementById('password').value;
    const pw2 = document.getElementById('password2').value;

    let bad = false;
    if (!data.name) { setError('name', 'Required'); bad = true; }
    if (!isPhone(data.phone)) { setError('phone', 'Enter valid 10-digit mobile'); bad = true; }
    if (!isEmail(data.email)) { setError('email', 'Invalid email'); bad = true; }
    if (!data.businessName) { setError('businessName', 'Required'); bad = true; }
    if (!data.city) { setError('city', 'Required'); bad = true; }
    if (!data.state) { setError('state', 'Required'); bad = true; }
    if (!data.businessType) { setError('businessType', 'Required'); bad = true; }
    if (!data.volume) { setError('volume', 'Required'); bad = true; }
    if (bad) {
      formError.textContent = 'Please fix the highlighted fields.';
      formError.hidden = false;
      return;
    }
    if (pw1.length < 8) { formError.textContent = 'Password must be at least 8 characters.'; formError.hidden = false; return; }
    if (!/[A-Z]/.test(pw1)) { formError.textContent = 'Include at least one uppercase letter.'; formError.hidden = false; return; }
    if (!/\d/.test(pw1)) { formError.textContent = 'Include at least one number.'; formError.hidden = false; return; }
    if (pw1 !== pw2) { formError.textContent = 'Passwords do not match.'; formError.hidden = false; return; }

    submitBtn.disabled = true;
    spinner.hidden = false;
    btnText.textContent = 'Submitting…';

    let appId = null;
    let user = null;

    try {
      // 1. Create Auth user
      console.log('[Apply] Step 1: Creating auth user...');
      const cred = await window.auth.createUserWithEmailAndPassword(data.email, pw1);
      user = cred.user;
      console.log('[Apply] Auth user created:', user.uid);

      try { await user.updateProfile({ displayName: data.name }); } catch (e) { console.warn('profile:', e.message); }

      // 2. Send verification email (best-effort)
      try {
        await user.sendEmailVerification({ url: window.location.origin + '/login.html', handleCodeInApp: false });
        console.log('[Apply] Verification email sent to', data.email);
      } catch (emailErr) {
        console.warn('[Apply] Verification email failed:', emailErr.message);
      }

      // 3. Generate App ID
      console.log('[Apply] Step 3: Generating app ID...');
      const year = new Date().getFullYear();
      const counterRef = window.db.collection('counters').doc('applications_' + year);
      const num = await window.db.runTransaction(async function (tx) {
        const d = await tx.get(counterRef);
        const n = (d.exists ? (d.data().count || 0) : 0) + 1;
        tx.set(counterRef, { count: n, year: year, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return n;
      });
      appId = 'SVE-APP-' + year + '-' + String(num).padStart(4, '0');
      console.log('[Apply] App ID:', appId);

      // 4. CRITICAL — Save applications doc FIRST
      console.log('[Apply] Step 4: Save applications doc (CRITICAL)...');
      await window.db.collection('applications').doc(appId).set({
        applicationId: appId,
        uid: user.uid,
        name: data.name,
        phone: data.phone,
        email: data.email,
        businessName: data.businessName,
        city: data.city,
        state: data.state,
        businessType: data.businessType,
        gst: data.gst || '',
        volume: data.volume,
        message: data.message || '',
        status: 'pending',
        source: 'portal-apply',
        passwordSet: true,
        emailVerifySent: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('[Apply] applications doc saved ✔');

      // 5. BEST-EFFORT — users doc (don't fail if rules block)
      console.log('[Apply] Step 5: Try users doc (best-effort)...');
      try {
        await window.db.collection('users').doc(user.uid).set({
          uid: user.uid,
          name: data.name,
          email: data.email,
          phone: data.phone,
          businessName: data.businessName,
          city: data.city,
          state: data.state,
          businessType: data.businessType,
          gst: data.gst || '',
          role: 'member',
          status: 'pending_approval',
          emailVerified: false,
          signupSource: 'portal-apply',
          applicationId: appId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('[Apply] users doc saved ✔');
      } catch (userErr) {
        console.warn('[Apply] users doc failed (non-critical):', userErr.message);
      }

      // 6. BEST-EFFORT — leads
      try {
        await window.db.collection('leads').add({
          name: data.name, phone: data.phone, email: data.email,
          message: 'Distributor Application: ' + data.businessName + ' (' + data.city + ')',
          source: 'portal-apply', appId: appId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('[Apply] leads saved ✔');
      } catch (leadErr) {
        console.warn('[Apply] leads failed (non-critical):', leadErr.message);
      }

      // 7. Google Sheet (fire-and-forget)
      if (window.sheetsSend) {
        window.sheetsSend('application', {
          applicationId: appId, name: data.name, phone: data.phone,
          email: data.email, businessName: data.businessName,
          city: data.city, state: data.state,
          businessType: data.businessType, gst: data.gst || '',
          volume: data.volume, message: data.message || '',
          status: 'pending', docFileName: ''
        });
        window.sheetsSend('lead', {
          name: data.name, phone: data.phone, email: data.email,
          message: 'Distributor Application: ' + data.businessName + ' (' + data.city + ')',
          source: 'portal-apply', appId: appId
        });
      }

      // 8. Sign out
      try { await window.auth.signOut(); } catch (e) { console.warn('signout:', e.message); }

      // 9. Show success
      appIdVal.textContent = appId;
      formSection.style.display = 'none';
      successSec.classList.add('show');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.uiToast) window.uiToast('Application submitted! Check your email.', 'success');

    } catch (err) {
      console.error('[Apply] Error:', err);
      let msg = 'Something went wrong. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please login or use a different email.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password too weak.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network error. Check your internet.';
      } else if (err.code === 'permission-denied' || (err.message && err.message.indexOf('permission') !== -1)) {
        msg = 'Permission error. Please check Firestore rules (details in console).';
      } else if (err.message) {
        msg = err.message;
      }
      formError.textContent = msg;
      formError.hidden = false;
      formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      submitBtn.disabled = false;
      spinner.hidden = true;
      btnText.textContent = 'Submit Application →';
    }
  });

  if (copyBtn) copyBtn.addEventListener('click', function () {
    const id = appIdVal.textContent;
    if (!id || id === '—') return;
    navigator.clipboard.writeText(id).then(function () {
      copyBtn.textContent = '✓ Copied!';
      setTimeout(function () { copyBtn.textContent = '📋 Copy ID'; }, 2000);
    });
  });

})();
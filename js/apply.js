/* ============================================================
   SVE Business Portal — Apply Form (3-step)
   Step 1: details → send OTP via Firebase Phone Auth
   Step 2: verify OTP
   Step 3: set password → create Auth user + Firestore application
   ============================================================ */

(function () {
  'use strict';

  const form = document.getElementById('name');
  if (!form) return;

  let recaptchaVerifier = null;
  let confirmationResult = null;
  let verifiedPhone = '+91';
  let step1Data = null;

  /* ---------- STEP NAV ---------- */
  function gotoStep(n) {
    document.querySelectorAll('.step-panel').forEach(function (p) {
      p.classList.toggle('active', Number(p.dataset.step) === n);
    });
    document.querySelectorAll('[data-stepnum]').forEach(function (el) {
      const num = Number(el.dataset.stepnum);
      el.classList.remove('active', 'done');
      if (num < n) el.classList.add('done');
      else if (num === n) el.classList.add('active');
    });
    document.querySelectorAll('[data-stepline]').forEach(function (el) {
      const num = Number(el.dataset.stepline);
      el.classList.toggle('done', num < n);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- RECAPTCHA ---------- */
  try {
    recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptchaContainer', { size: 'normal' });
    recaptchaVerifier.render();
  } catch (e) { console.warn('[Apply] reCAPTCHA init failed', e); }

  function setFieldErr(inputId, msg) {
    const inp = document.getElementById(inputId);
    const f = inp.closest('.field');
    f.classList.add('has-error');
    const e = f.querySelector('.err');
    if (e && msg) e.textContent = msg;
  }
  function clearErr() {
    document.querySelectorAll('.field.has-error').forEach(function (f) { f.classList.remove('has-error'); });
    document.getElementById('step1Err').hidden = true;
    document.getElementById('step2Err').hidden = true;
    document.getElementById('step3Err').hidden = true;
  }

  const isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); };
  const isPhone = function (v) { return /^[6-9]\d{9}$/.test(String(v || '').trim()); };

  /* ---------- STEP 1: SEND OTP ---------- */
  document.getElementById('sendOtpBtn').addEventListener('click', async function () {
    clearErr();
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

    let bad = false;
    if (!data.name) { setFieldErr('name', 'Required'); bad = true; }
    if (!isPhone(data.phone)) { setFieldErr('phone', 'Enter 10-digit mobile (6-9)'); bad = true; }
    if (!isEmail(data.email)) { setFieldErr('email', 'Invalid email'); bad = true; }
    if (!data.businessName) { setFieldErr('businessName', 'Required'); bad = true; }
    if (!data.city) { setFieldErr('city', 'Required'); bad = true; }
    if (!data.state) { setFieldErr('state', 'Required'); bad = true; }
    if (!data.businessType) { setFieldErr('businessType', 'Required'); bad = true; }
    if (!data.volume) { setFieldErr('volume', 'Required'); bad = true; }
    if (bad) {
      document.getElementById('step1Err').textContent = 'Please fix the highlighted fields.';
      document.getElementById('step1Err').hidden = false;
      return;
    }

    // Check email not already used
    try {
      const methods = await window.auth.fetchSignInMethodsForEmail(data.email);
      if (methods && methods.length) {
        setFieldErr('email', 'Email already registered — please login');
        document.getElementById('step1Err').textContent = 'This email already has an account.';
        document.getElementById('step1Err').hidden = false;
        return;
      }
    } catch (e) { /* ignore */ }

    const btn = this;
    const spinner = btn.querySelector('.btn-spinner');
    const btnText = btn.querySelector('.btn-text');
    btn.disabled = true; spinner.hidden = false; btnText.textContent = 'Sending OTP…';

    try {
      verifiedPhone = '+91' + data.phone;
      confirmationResult = await window.auth.signInWithPhoneNumber(verifiedPhone, recaptchaVerifier);
      step1Data = data;
      document.getElementById('phoneEcho').textContent = verifiedPhone;
      gotoStep(2);
      startResendTimer();
      document.querySelector('.otp-digit').focus();
      if (window.uiToast) window.uiToast('OTP sent to ' + verifiedPhone, 'success');
    } catch (err) {
      console.error('[Apply] OTP send failed', err);
      let msg = 'Could not send OTP. Try again.';
      if (err.code === 'auth/invalid-phone-number') msg = 'Invalid phone number.';
      else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try later.';
      else if (err.code === 'auth/quota-exceeded') msg = 'Daily SMS quota exceeded.';
      document.getElementById('step1Err').textContent = msg;
      document.getElementById('step1Err').hidden = false;
    } finally {
      btn.disabled = false; spinner.hidden = true; btnText.textContent = 'Send OTP →';
    }
  });

  /* ---------- OTP INPUTS ---------- */
  const otpInputs = document.querySelectorAll('.otp-digit');
  otpInputs.forEach(function (inp, i) {
    inp.addEventListener('input', function () {
      inp.value = inp.value.replace(/\D/g, '');
      inp.classList.toggle('filled', !!inp.value);
      if (inp.value && i < otpInputs.length - 1) otpInputs[i + 1].focus();
    });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !inp.value && i > 0) otpInputs[i - 1].focus();
    });
    inp.addEventListener('paste', function (e) {
      e.preventDefault();
      const data = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      data.split('').forEach(function (ch, idx) {
        if (otpInputs[idx]) { otpInputs[idx].value = ch; otpInputs[idx].classList.add('filled'); }
      });
      if (data.length === 6) otpInputs[5].focus();
    });
  });
  function getOtp() {
    let v = ''; otpInputs.forEach(function (inp) { v += inp.value; });
    return v;
  }

  /* ---------- STEP 2: VERIFY ---------- */
  document.getElementById('verifyOtpBtn').addEventListener('click', function () {
    clearErr();
    const code = getOtp();
    if (code.length !== 6) {
      document.getElementById('step2Err').textContent = 'Enter full 6-digit code.';
      document.getElementById('step2Err').hidden = false;
      return;
    }
    window.__sveOtpCode = code;
    gotoStep(3);
    document.getElementById('password').focus();
    if (window.uiToast) window.uiToast('Phone verified. Now set password.', 'success');
  });
  document.getElementById('backToStep1').addEventListener('click', function () { gotoStep(1); });
  document.getElementById('backToStep2').addEventListener('click', function () { gotoStep(2); });

  /* ---------- RESEND ---------- */
  let resendTimer = null;
  function startResendTimer() {
    const btn = document.getElementById('resendBtn');
    const span = document.getElementById('resendTimer');
    let sec = 30;
    btn.disabled = true;
    span.textContent = sec;
    clearInterval(resendTimer);
    resendTimer = setInterval(function () {
      sec--;
      span.textContent = sec;
      if (sec <= 0) {
        clearInterval(resendTimer);
        btn.disabled = false;
        btn.textContent = 'Resend OTP';
      }
    }, 1000);
  }
  document.getElementById('resendBtn').addEventListener('click', async function () {
    try {
      confirmationResult = await window.auth.signInWithPhoneNumber(verifiedPhone, recaptchaVerifier);
      startResendTimer();
      if (window.uiToast) window.uiToast('OTP resent', 'success');
    } catch (e) {
      document.getElementById('step2Err').textContent = 'Could not resend OTP.';
      document.getElementById('step2Err').hidden = false;
    }
  });

  /* ---------- PASSWORD ---------- */
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

  /* ---------- STEP 3: CREATE ACCOUNT ---------- */
  document.getElementById('submitBtn').addEventListener('click', async function () {
    clearErr();
    const pw1 = document.getElementById('password').value;
    const pw2 = document.getElementById('password2').value;

    if (pw1.length < 8) { document.getElementById('step3Err').textContent = 'Password must be at least 8 characters.'; document.getElementById('step3Err').hidden = false; return; }
    if (!/[A-Z]/.test(pw1)) { document.getElementById('step3Err').textContent = 'Include at least one uppercase letter.'; document.getElementById('step3Err').hidden = false; return; }
    if (!/\d/.test(pw1)) { document.getElementById('step3Err').textContent = 'Include at least one number.'; document.getElementById('step3Err').hidden = false; return; }
    if (pw1 !== pw2) { document.getElementById('step3Err').textContent = 'Passwords do not match.'; document.getElementById('step3Err').hidden = false; return; }

    const code = window.__sveOtpCode;
    if (!code || !confirmationResult) { document.getElementById('step3Err').textContent = 'Session expired. Please restart.'; document.getElementById('step3Err').hidden = false; return; }

    const btn = this;
    const spinner = btn.querySelector('.btn-spinner');
    const btnText = btn.querySelector('.btn-text');
    btn.disabled = true; spinner.hidden = false; btnText.textContent = 'Submitting…';

    try {
      // 1. Confirm OTP → signs user in
      const cred = await confirmationResult.confirm(code);
      const user = cred.user;

      // 2. Set password on this user
      await user.updatePassword(pw1);
      await user.updateProfile({ displayName: step1Data.name });

      // 3. Link email credential so they can login with email+password later
      try {
        const emailCred = firebase.auth.EmailAuthProvider.credential(step1Data.email, pw1);
        await user.linkWithCredential(emailCred);
      } catch (linkErr) {
        console.warn('[Apply] email link failed:', linkErr.code);
      }

      // 4. Generate Application ID
      const year = new Date().getFullYear();
      const counterRef = window.db.collection('counters').doc('applications_' + year);
      const num = await window.db.runTransaction(async function (tx) {
        const d = await tx.get(counterRef);
        const n = (d.exists ? (d.data().count || 0) : 0) + 1;
        tx.set(counterRef, { count: n, year: year, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return n;
      });
      const appId = 'SVE-APP-' + year + '-' + String(num).padStart(4, '0');

      // 5. Save application (status pending — admin approves → creates users doc)
      const appDoc = {
        applicationId: appId,
        uid: user.uid,
        name: step1Data.name,
        phone: step1Data.phone,
        email: step1Data.email,
        businessName: step1Data.businessName,
        city: step1Data.city,
        state: step1Data.state,
        businessType: step1Data.businessType,
        gst: step1Data.gst || '',
        volume: step1Data.volume,
        message: step1Data.message || '',
        status: 'pending',
        source: 'portal-apply',
        phoneVerified: true,
        passwordSet: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await window.db.collection('applications').doc(appId).set(appDoc);

      // 6. Add to leads
      await window.db.collection('leads').add({
        name: step1Data.name, phone: step1Data.phone, email: step1Data.email,
        message: 'Distributor Application: ' + step1Data.businessName + ' (' + step1Data.city + ')',
        source: 'portal-apply', appId: appId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 7. Google Sheet
      if (window.sheetsSend) {
        window.sheetsSend('application', {
          applicationId: appId, name: step1Data.name, phone: step1Data.phone,
          email: step1Data.email, businessName: step1Data.businessName,
          city: step1Data.city, state: step1Data.state,
          businessType: step1Data.businessType, gst: step1Data.gst || '',
          volume: step1Data.volume, message: step1Data.message || '',
          status: 'pending', docFileName: ''
        });
        window.sheetsSend('lead', {
          name: step1Data.name, phone: step1Data.phone, email: step1Data.email,
          message: 'Distributor Application: ' + step1Data.businessName + ' (' + step1Data.city + ')',
          source: 'portal-apply', appId: appId
        });
      }

      // 8. Sign out — user can't access dashboard until approved
      await window.auth.signOut();

      // 9. Show success
      document.getElementById('appIdVal').textContent = appId;
      document.getElementById('formSection').style.display = 'none';
      document.getElementById('successSection').classList.add('show');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.uiToast) window.uiToast('Application submitted!', 'success');

    } catch (err) {
      console.error('[Apply] Submit failed', err);
      let msg = 'Something went wrong. Please try again.';
      if (err.code === 'auth/invalid-verification-code') msg = 'Wrong OTP — please re-enter.';
      else if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      else if (err.code === 'auth/weak-password') msg = 'Password too weak.';
      document.getElementById('step3Err').textContent = msg;
      document.getElementById('step3Err').hidden = false;
    } finally {
      btn.disabled = false; spinner.hidden = true; btnText.textContent = 'Submit Application →';
    }
  });

  /* ---------- COPY ---------- */
  const copyBtn = document.getElementById('copyAppId');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    const id = document.getElementById('appIdVal').textContent;
    if (!id || id === '—') return;
    navigator.clipboard.writeText(id).then(function () {
      copyBtn.textContent = '✓ Copied!';
      setTimeout(function () { copyBtn.textContent = '📋 Copy ID'; }, 2000);
    });
  });

})();
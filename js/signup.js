/* ============================================================
   SVE Business Portal — Signup flow
   Step 1: Name + Email + Phone → Firebase Phone Auth (send OTP)
   Step 2: Enter OTP → verify
   Step 3: Set password → create account
   ============================================================ */

(function () {
  'use strict';

  const form = document.getElementById('suName'); // just check
  if (!form) return;

  let confirmationResult = null;
  let recaptchaVerifier = null;
  let verifiedPhone = '';
  let verifiedName = '';
  let verifiedEmail = '';

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
  }

  /* ---------- RECAPTCHA ---------- */
  try {
    recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptchaContainer', {
      size: 'normal',
      callback: function () {},
      'expired-callback': function () {
        if (window.uiToast) window.uiToast('reCAPTCHA expired — please retry', 'warning');
      }
    });
    recaptchaVerifier.render();
  } catch (e) {
    console.warn('[Signup] reCAPTCHA init failed', e);
  }

  /* ---------- VALIDATORS ---------- */
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); }
  function isPhone(v) { return /^[6-9]\d{9}$/.test(String(v || '').trim()); }

  function showErr(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.hidden = false;
  }
  function clearErr(id) { document.getElementById(id).hidden = true; }

  /* ---------- STEP 1: SEND OTP ---------- */
  document.getElementById('suSendOtpBtn').addEventListener('click', async function () {
    clearErr('suErr1');
    const name = document.getElementById('suName').value.trim();
    const email = document.getElementById('suEmail').value.trim().toLowerCase();
    const phone = document.getElementById('suPhone').value.trim();

    if (!name) { return showErr('suErr1', 'Please enter your name.'); }
    if (!isEmail(email)) { return showErr('suErr1', 'Please enter a valid email.'); }
    if (!isPhone(phone)) { return showErr('suErr1', 'Enter valid 10-digit mobile (starts with 6-9).'); }

    // Check if email already used
    const methods = await window.auth.fetchSignInMethodsForEmail(email);
    if (methods && methods.length) {
      return showErr('suErr1', 'This email is already registered. Please login.');
    }

    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Sending OTP…';

    try {
      const phoneE164 = '+91' + phone;
      confirmationResult = await window.auth.signInWithPhoneNumber(phoneE164, recaptchaVerifier);

      verifiedName = name;
      verifiedEmail = email;
      verifiedPhone = phone;

      document.getElementById('suPhoneEcho').textContent = phoneE164;
      gotoStep(2);
      startResendTimer();
      document.querySelector('.otp-digit').focus();
      if (window.uiToast) window.uiToast('OTP sent successfully', 'success');
    } catch (err) {
      console.error('[Signup] OTP send failed', err);
      let msg = 'Could not send OTP. Please try again.';
      if (err.code === 'auth/invalid-phone-number') msg = 'Invalid phone number.';
      else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Please wait and try again.';
      else if (err.code === 'auth/quota-exceeded') msg = 'Daily SMS limit reached. Try later.';
      showErr('suErr1', msg);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send OTP →';
    }
  });

  /* ---------- OTP INPUT HANDLING ---------- */
  const otpInputs = document.querySelectorAll('.otp-digit');
  otpInputs.forEach(function (inp, i) {
    inp.addEventListener('input', function () {
      inp.value = inp.value.replace(/\D/g, '');
      if (inp.value) inp.classList.add('filled');
      else inp.classList.remove('filled');
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

  function getOtpValue() {
    let v = '';
    otpInputs.forEach(function (inp) { v += inp.value; });
    return v;
  }

  /* ---------- STEP 2: VERIFY OTP ---------- */
  document.getElementById('suVerifyOtpBtn').addEventListener('click', async function () {
    clearErr('suErr2');
    document.getElementById('suInfo2').hidden = true;
    const code = getOtpValue();
    if (code.length !== 6) return showErr('suErr2', 'Please enter the full 6-digit code.');

    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Verifying…';

    try {
      // Store OTP code for the account creation step
      window.__sveOtpCode = code;
      // Don't call confirmationResult.confirm() yet — we do it at step 3.
      // But we can verify now and keep the credential. Better: keep code, use at step 3.
      gotoStep(3);
      document.getElementById('suPassword').focus();
      if (window.uiToast) window.uiToast('Phone verified. Now set your password.', 'success');
    } catch (err) {
      console.error(err);
      showErr('suErr2', 'Verification failed. Please retry.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verify OTP →';
    }
  });

  /* ---------- RESEND TIMER ---------- */
  let resendTimer = null;
  function startResendTimer() {
    const btn = document.getElementById('suResendBtn');
    const span = document.getElementById('suResendTimer');
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
        btn.innerHTML = 'Resend OTP';
      }
    }, 1000);
  }

  document.getElementById('suResendBtn').addEventListener('click', async function () {
    clearErr('suErr2');
    if (!verifiedPhone) return;
    try {
      confirmationResult = await window.auth.signInWithPhoneNumber('+91' + verifiedPhone, recaptchaVerifier);
      startResendTimer();
      document.getElementById('suInfo2').textContent = 'OTP resent to +91' + verifiedPhone;
      document.getElementById('suInfo2').hidden = false;
    } catch (err) {
      showErr('suErr2', 'Could not resend. Please wait and try again.');
    }
  });

  /* ---------- PASSWORD ---------- */
  document.getElementById('suTogglePass').addEventListener('click', function () {
    const p = document.getElementById('suPassword');
    p.type = p.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('suPassword').addEventListener('input', function () {
    const v = this.value;
    const el = document.getElementById('suPwStrength');
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const labels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
    const colors = ['', '#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];
    el.textContent = v ? 'Strength: ' + (labels[score] || '—') : '';
    el.style.color = colors[score] || '';
  });

  /* ---------- STEP 3: CREATE ACCOUNT ---------- */
  document.getElementById('suCreateBtn').addEventListener('click', async function () {
    clearErr('suErr3');
    const pw1 = document.getElementById('suPassword').value;
    const pw2 = document.getElementById('suPassword2').value;

    if (pw1.length < 8) return showErr('suErr3', 'Password must be at least 8 characters.');
    if (!/[A-Z]/.test(pw1)) return showErr('suErr3', 'Include at least one uppercase letter.');
    if (!/\d/.test(pw1)) return showErr('suErr3', 'Include at least one number.');
    if (pw1 !== pw2) return showErr('suErr3', 'Passwords do not match.');

    const code = window.__sveOtpCode;
    if (!code || !confirmationResult) return showErr('suErr3', 'Please restart signup.');

    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Creating account…';

    try {
      // Confirm OTP → this signs user in
      const cred = await confirmationResult.confirm(code);
      const user = cred.user;

      // Now update password on this user (Firebase allows setting password right after phone sign-in)
      await user.updatePassword(pw1);
      await user.updateProfile({ displayName: verifiedName });

      // Save user profile in Firestore
      await window.db.collection('users').doc(user.uid).set({
        uid: user.uid,
        name: verifiedName,
        email: verifiedEmail,
        phone: verifiedPhone,
        role: 'member',
        status: 'active',
        signupSource: 'self-signup',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Also add email to auth (link email/password) so future email logins work
      try {
        const emailCred = firebase.auth.EmailAuthProvider.credential(verifiedEmail, pw1);
        await user.linkWithCredential(emailCred);
      } catch (linkErr) {
        console.warn('[Signup] Email link failed (maybe already linked):', linkErr.code);
      }

      // Notify Google Sheet
      if (window.sheetsSend) {
        window.sheetsSend('lead', {
          name: verifiedName, phone: verifiedPhone, email: verifiedEmail,
          message: 'Self signup (phone verified)', source: 'signup', appId: ''
        });
      }

      if (window.uiToast) window.uiToast('Account created! Redirecting…', 'success');
      setTimeout(function () { window.location.href = 'dashboard.html'; }, 800);

    } catch (err) {
      console.error('[Signup] Create failed', err);
      let msg = 'Could not create account. Please retry.';
      if (err.code === 'auth/invalid-verification-code') msg = 'Wrong OTP. Please go back and re-enter.';
      else if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      else if (err.code === 'auth/weak-password') msg = 'Password too weak.';
      showErr('suErr3', msg);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account →';
    }
  });

})();
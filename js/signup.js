/* ============================================================
   SVE Business Portal — Signup (Email verification flow)
   No OTP. Firebase sends email verification link.
   ============================================================ */

(function () {
  'use strict';

  const form = document.getElementById('signupForm');
  if (!form) return;

  const suErr = document.getElementById('suErr');
  const suCreateBtn = document.getElementById('suCreateBtn');
  const spinner = suCreateBtn.querySelector('.btn-spinner');
  const btnText = suCreateBtn.querySelector('.btn-text');

  const isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); };
  const isPhone = function (v) { return /^[6-9]\d{9}$/.test(String(v || '').trim()); };

  // Password toggle
  document.getElementById('suTogglePass').addEventListener('click', function () {
    const p = document.getElementById('suPassword');
    p.type = p.type === 'password' ? 'text' : 'password';
  });

  // Password strength indicator
  document.getElementById('suPassword').addEventListener('input', function () {
    const v = this.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const labels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
    const el = document.getElementById('suPwStrength');
    el.textContent = v ? 'Strength: ' + (labels[score] || '—') : '';
    el.style.color = score >= 4 ? 'var(--green)' : (score >= 3 ? 'var(--amber)' : 'var(--red)');
  });

  function showErr(msg) { suErr.textContent = msg; suErr.hidden = false; }

  suCreateBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    suErr.hidden = true;

    const name = document.getElementById('suName').value.trim();
    const email = document.getElementById('suEmail').value.trim().toLowerCase();
    const phone = document.getElementById('suPhone').value.trim();
    const business = document.getElementById('suBusiness').value.trim();
    const city = document.getElementById('suCity').value.trim();
    const pw1 = document.getElementById('suPassword').value;
    const pw2 = document.getElementById('suPassword2').value;

    // Validate
    if (!name) return showErr('Please enter your full name.');
    if (!isEmail(email)) return showErr('Please enter a valid email.');
    if (!isPhone(phone)) return showErr('Enter valid 10-digit mobile (starts with 6-9).');
    if (pw1.length < 8) return showErr('Password must be at least 8 characters.');
    if (!/[A-Z]/.test(pw1)) return showErr('Password must include an uppercase letter.');
    if (!/\d/.test(pw1)) return showErr('Password must include a number.');
    if (pw1 !== pw2) return showErr('Passwords do not match.');

    suCreateBtn.disabled = true;
    spinner.hidden = false;
    btnText.textContent = 'Creating account…';

    try {
      // 1. Create Firebase Auth user (email + password)
      const cred = await window.auth.createUserWithEmailAndPassword(email, pw1);
      const user = cred.user;

      // 2. Update display name
      await user.updateProfile({ displayName: name });

      // 3. Send verification email
      try {
        await user.sendEmailVerification({
          url: window.location.origin + '/login.html',
          handleCodeInApp: false
        });
        console.log('[Signup] Verification email sent to', email);
      } catch (emailErr) {
        console.warn('[Signup] Verification email failed:', emailErr);
        // Continue — user can resend later
      }

      // 4. Save to Firestore users collection (status = pending until admin approves)
      await window.db.collection('users').doc(user.uid).set({
        uid: user.uid,
        name: name,
        email: email,
        phone: phone,
        businessName: business || '',
        city: city || '',
        role: 'member',
        status: 'pending_approval',
        emailVerified: false,
        signupSource: 'self-signup',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 5. Also add to applications collection (so admin sees in applications list)
      const year = new Date().getFullYear();
      const counterRef = window.db.collection('counters').doc('applications_' + year);
      const num = await window.db.runTransaction(async function (tx) {
        const d = await tx.get(counterRef);
        const n = (d.exists ? (d.data().count || 0) : 0) + 1;
        tx.set(counterRef, { count: n, year: year, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return n;
      });
      const appId = 'SVE-APP-' + year + '-' + String(num).padStart(4, '0');

      await window.db.collection('applications').doc(appId).set({
        applicationId: appId,
        uid: user.uid,
        name: name,
        email: email,
        phone: phone,
        businessName: business || '',
        city: city || '',
        state: '',
        businessType: '',
        gst: '',
        volume: '',
        message: 'Self-signup (email verification)',
        status: 'pending',
        source: 'portal-signup',
        passwordSet: true,
        emailVerifySent: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 6. Add to leads
      await window.db.collection('leads').add({
        name: name, phone: phone, email: email,
        message: 'Self signup (email verification)',
        source: 'signup', appId: appId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 7. Google Sheet
      if (window.sheetsSend) {
        window.sheetsSend('application', {
          applicationId: appId, name: name, phone: phone,
          email: email, businessName: business || '',
          city: city || '', state: '', businessType: '',
          gst: '', volume: '', message: 'Self-signup',
          status: 'pending', docFileName: ''
        });
        window.sheetsSend('lead', {
          name: name, phone: phone, email: email,
          message: 'Self signup (email verification)',
          source: 'signup', appId: appId
        });
      }

      // 8. Sign out — user will login after verification + admin approval
      await window.auth.signOut();

      // 9. Show success screen
      document.getElementById('signupForm').style.display = 'none';
      document.getElementById('signupSuccess').style.display = 'block';
      document.getElementById('sentEmail').textContent = email;

      if (window.uiToast) window.uiToast('Account created! Check your email.', 'success');

    } catch (err) {
      console.error('[Signup] Error:', err);
      let msg = 'Could not create account. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered. Please login.';
      else if (err.code === 'auth/weak-password') msg = 'Password is too weak.';
      else if (err.code === 'auth/invalid-email') msg = 'Invalid email format.';
      else if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your internet.';
      showErr(msg);
    } finally {
      suCreateBtn.disabled = false;
      spinner.hidden = true;
      btnText.textContent = 'Create Account →';
    }
  });

  // Resend verification email
  const resendBtn = document.getElementById('resendBtn');
  if (resendBtn) {
    resendBtn.addEventListener('click', async function () {
      const email = document.getElementById('suEmail').value.trim().toLowerCase();
      const pw = document.getElementById('suPassword').value;
      if (!email || !pw) {
        if (window.uiToast) window.uiToast('Please fill email and password again', 'error');
        return;
      }
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending…';
      try {
        // Re-login temporarily to resend
        const cred = await window.auth.signInWithEmailAndPassword(email, pw);
        await cred.user.sendEmailVerification({
          url: window.location.origin + '/login.html',
          handleCodeInApp: false
        });
        await window.auth.signOut();
        if (window.uiToast) window.uiToast('Email resent!', 'success');
      } catch (e) {
        console.warn(e);
        if (window.uiToast) window.uiToast('Could not resend — try again in a minute', 'error');
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend email';
      }
    });
  }

})();
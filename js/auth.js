/* ============================================================
   SVE Business Portal — Login / Guard
   Login checks: email verified + user doc status = active
   ============================================================ */

(function () {
  'use strict';

  const LOGIN_PAGE = 'login.html';
  const DASHBOARD_PAGE = 'dashboard.html';

  /* ---------- LOGIN ---------- */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const emailEl    = document.getElementById('loginEmail');
    const passEl     = document.getElementById('loginPassword');
    const rememberEl = document.getElementById('rememberMe');
    const toggleBtn  = document.getElementById('togglePass');
    const errBox     = document.getElementById('loginError');
    const infoBox    = document.getElementById('loginInfo');
    const loginBtn   = document.getElementById('loginBtn');
    const spinner    = loginBtn.querySelector('.btn-spinner');
    const btnText    = loginBtn.querySelector('.btn-text');

    try {
      const saved = localStorage.getItem('sve_login_email');
      if (saved) { emailEl.value = saved; rememberEl.checked = true; }
    } catch (e) {}

    toggleBtn.addEventListener('click', function () {
      passEl.type = passEl.type === 'password' ? 'text' : 'password';
    });

    function showError(msg) { errBox.textContent = msg; errBox.hidden = false; if (infoBox) infoBox.hidden = true; }
    function showInfo(msg)  { if (infoBox) { infoBox.textContent = msg; infoBox.hidden = false; } errBox.hidden = true; }

    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      errBox.hidden = true;
      if (infoBox) infoBox.hidden = true;

      const email = emailEl.value.trim().toLowerCase();
      const pass = passEl.value;
      if (!email || !pass) return showError('Please enter email and password.');

      loginBtn.disabled = true;
      spinner.hidden = false;
      btnText.textContent = 'Logging in…';

      try {
        const cred = await window.auth.signInWithEmailAndPassword(email, pass);
        const user = cred.user;

        // Check email verified
        if (!user.emailVerified) {
          // Send verification email again if not verified
          try {
            await user.sendEmailVerification({
              url: window.location.origin + '/login.html',
              handleCodeInApp: false
            });
          } catch (sendErr) { console.warn('Verify email resend failed:', sendErr); }

          await window.auth.signOut();
          showError('Please verify your email first. A new verification link has been sent to ' + email + '.');
          return;
        }

        // Check Firestore users doc
        const userDoc = await window.db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
          await window.auth.signOut();
          return showError('Account not set up. Please sign up again or contact support.');
        }

        const u = userDoc.data();

        // Update emailVerified flag in Firestore if not already
        if (u.emailVerified !== true) {
          try {
            await window.db.collection('users').doc(user.uid).update({ emailVerified: true });
          } catch (updErr) { console.warn('emailVerified update failed:', updErr); }
        }

        if (u.status === 'suspended') {
          await window.auth.signOut();
          return showError('Account suspended. Please contact support.');
        }

        if (u.status === 'pending_approval' || u.status === 'pending') {
          await window.auth.signOut();
          showError('Your account is pending admin approval. You will be notified once approved.');
          return;
        }

        if (u.status !== 'active') {
          await window.auth.signOut();
          return showError('Account not active. Status: ' + u.status);
        }

        try {
          if (rememberEl.checked) localStorage.setItem('sve_login_email', email);
          else localStorage.removeItem('sve_login_email');
        } catch (e2) {}

        if (window.uiToast) window.uiToast('Welcome back!', 'success');
        setTimeout(function () { window.location.href = DASHBOARD_PAGE; }, 400);

      } catch (err) {
        console.error('[Auth]', err);
        let msg = 'Login failed. Please try again.';
        if (['auth/user-not-found','auth/wrong-password','auth/invalid-credential','auth/invalid-login-credentials'].indexOf(err.code) !== -1)
          msg = 'Invalid email or password. / गलत ईमेल या पासवर्ड।';
        else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
        else if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your internet.';
        showError(msg);
      } finally {
        loginBtn.disabled = false;
        spinner.hidden = true;
        btnText.textContent = 'Login →';
      }
    });

    // Already logged in?
    window.auth.onAuthStateChanged(async function (user) {
      if (!user || !user.emailVerified) return;
      try {
        const snap = await window.db.collection('users').doc(user.uid).get();
        if (snap.exists && snap.data().status === 'active') {
          window.location.href = DASHBOARD_PAGE;
        }
      } catch (e) {}
    });
  }

  /* ---------- GUARD ---------- */
  window.requireAuth = function (callback) {
    return new Promise(function (resolve) {
      const unsub = window.auth.onAuthStateChanged(async function (user) {
        unsub();
        if (!user) { window.location.href = LOGIN_PAGE; return; }
        if (!user.emailVerified) {
          await window.auth.signOut();
          window.location.href = LOGIN_PAGE;
          return;
        }
        try {
          const snap = await window.db.collection('users').doc(user.uid).get();
          if (!snap.exists || snap.data().status !== 'active') {
            await window.auth.signOut();
            window.location.href = LOGIN_PAGE;
            return;
          }
          const profile = Object.assign({ uid: user.uid, email: user.email }, snap.data());
          window.currentUser = profile;
          resolve(profile);
          if (callback) callback(profile);
        } catch (e) {
          console.error('[Auth guard]', e);
          window.location.href = LOGIN_PAGE;
        }
      });
    });
  };

  window.sveLogout = async function () {
    try { await window.auth.signOut(); } catch (e) {}
    window.location.href = LOGIN_PAGE;
  };

})();
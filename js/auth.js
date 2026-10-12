/* ============================================================
   SVE Business Portal — User Login / Session Guard
   - Handles login form on login.html
   - Redirects to dashboard.html if already logged in & approved
   - Guard function: window.requireAuth() used by dashboard.html
   ============================================================ */

(function () {
  'use strict';

  const LOGIN_PAGE = 'login.html';
  const DASHBOARD_PAGE = 'dashboard.html';

  /* ---------- LOGIN FORM (login.html only) ---------- */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const emailEl   = document.getElementById('loginEmail');
    const passEl    = document.getElementById('loginPassword');
    const rememberEl= document.getElementById('rememberMe');
    const toggleBtn = document.getElementById('togglePass');
    const errBox    = document.getElementById('loginError');
    const infoBox   = document.getElementById('loginInfo');
    const loginBtn  = document.getElementById('loginBtn');
    const spinner   = loginBtn.querySelector('.btn-spinner');
    const btnText   = loginBtn.querySelector('.btn-text');
    const forgotBtn = document.getElementById('forgotBtn');

    // Restore remembered email
    try {
      const saved = localStorage.getItem('sve_login_email');
      if (saved) { emailEl.value = saved; rememberEl.checked = true; }
    } catch (e) {}

    // Password visibility
    toggleBtn.addEventListener('click', function () {
      passEl.type = passEl.type === 'password' ? 'text' : 'password';
    });

    // Error helper
    function showError(msg) {
      errBox.textContent = msg;
      errBox.hidden = false;
      infoBox.hidden = true;
    }
    function showInfo(msg) {
      infoBox.textContent = msg;
      infoBox.hidden = false;
      errBox.hidden = true;
    }

    // Forgot password
    forgotBtn.addEventListener('click', async function () {
      const email = emailEl.value.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Please enter your email first. / कृपया पहले अपना ईमेल दर्ज करें।');
        return;
      }
      try {
        await window.auth.sendPasswordResetEmail(email);
        showInfo('Password reset link sent to ' + email);
      } catch (e) {
        console.error(e);
        showError('Could not send reset email. / ईमेल नहीं भेजा जा सका।');
      }
    });

    // Submit
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      errBox.hidden = true;
      infoBox.hidden = true;

      const email = emailEl.value.trim().toLowerCase();
      const pass  = passEl.value;

      if (!email || !pass) { showError('Please enter email and password. / कृपया ईमेल और पासवर्ड दर्ज करें।'); return; }

      loginBtn.disabled = true;
      spinner.hidden = false;
      btnText.textContent = 'Logging in…';

      try {
        // 1. Sign in
        const cred = await window.auth.signInWithEmailAndPassword(email, pass);
        const uid = cred.user.uid;

        // 2. Check Firestore users collection
        const userDoc = await window.db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
          await window.auth.signOut();
          showError('Your account is not approved yet. Please check application status. / आपका खाता अभी अनुमोदित नहीं है।');
          return;
        }
        const userData = userDoc.data();
        if (userData.status === 'suspended') {
          await window.auth.signOut();
          showError('Your account has been suspended. Please contact support. / आपका खाता निलंबित है।');
          return;
        }
        if (userData.status !== 'active') {
          await window.auth.signOut();
          showError('Your account is pending activation. / खाता सक्रियण प्रतीक्षित है।');
          return;
        }

        // 3. Save remembered email
        try {
          if (rememberEl.checked) localStorage.setItem('sve_login_email', email);
          else localStorage.removeItem('sve_login_email');
        } catch (e2) {}

        if (window.showToast) window.showToast('Welcome back!', 'success');
        setTimeout(function () { window.location.href = DASHBOARD_PAGE; }, 500);

      } catch (err) {
        console.error('[Auth]', err);
        let msg = 'Login failed. Please try again. / लॉगिन विफल।';
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = 'Invalid email or password. / गलत ईमेल या पासवर्ड।';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Too many attempts. Please try again later. / बहुत अधिक प्रयास।';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Invalid email address. / अमान्य ईमेल।';
        }
        showError(msg);
      } finally {
        loginBtn.disabled = false;
        spinner.hidden = true;
        btnText.textContent = 'Login →';
      }
    });

    // If already logged in + approved → redirect
    window.auth.onAuthStateChanged(async function (user) {
      if (!user) return;
      try {
        const snap = await window.db.collection('users').doc(user.uid).get();
        if (snap.exists && snap.data().status === 'active') {
          window.location.href = DASHBOARD_PAGE;
        }
      } catch (e) {}
    });
  }

  /* ---------- GUARD FOR PROTECTED PAGES ---------- */
  window.requireAuth = function (callback) {
    return new Promise(function (resolve) {
      const unsub = window.auth.onAuthStateChanged(async function (user) {
        unsub();
        if (!user) { window.location.href = LOGIN_PAGE; return; }
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

  /* ---------- LOGOUT ---------- */
  window.sveLogout = async function () {
    try {
      await window.auth.signOut();
      window.location.href = LOGIN_PAGE;
    } catch (e) {
      console.error(e);
      window.location.href = LOGIN_PAGE;
    }
  };

})();
/* ============================================================
   SVE Admin Panel — Auth Guard (Google-only)
   Only 2 hardcoded admin emails allowed.
   Uses Google Sign-In popup — no password needed.
   ============================================================ */

(function () {
  'use strict';

  const ADMIN_EMAILS = [
    'sve.raj.in@gmail.com',
    'shidhivinayakindustry.svi@gmail.com'
  ];

  const LOGIN_PAGE = 'index.html';
  const DASHBOARD_PAGE = 'dashboard.html';

  function isAdminEmail(email) {
    return email && ADMIN_EMAILS.indexOf(String(email).toLowerCase().trim()) !== -1;
  }
  window.isAdminEmail = isAdminEmail;

  /* ---------- GOOGLE LOGIN ---------- */
  const googleBtn = document.getElementById('googleLoginBtn');
  if (googleBtn) {
    const errBox  = document.getElementById('adminError');
    const infoBox = document.getElementById('adminInfo');
    const btnText = googleBtn.querySelector('.btn-text');
    const spinner = googleBtn.querySelector('.btn-spinner');

    function showErr(m)  { errBox.textContent = m; errBox.hidden = false; infoBox.hidden = true; }
    function showInfo(m) { infoBox.textContent = m; infoBox.hidden = false; errBox.hidden = true; }

    googleBtn.addEventListener('click', async function () {
      errBox.hidden = true;
      infoBox.hidden = true;
      googleBtn.disabled = true;
      spinner.hidden = false;
      btnText.textContent = 'Signing in…';

      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await window.auth.signInWithPopup(provider);
        const user = result.user;
        const email = (user.email || '').toLowerCase().trim();

        // 1. Must be one of the allowed admin emails
        if (!isAdminEmail(email)) {
          await window.auth.signOut();
          showErr('Access denied. This Google account is not an SVE admin. / यह Google खाता SVE एडमिन नहीं है।');
          return;
        }

        // 2. Must have verified email (Google always does, but double-check)
        if (!user.emailVerified) {
          await window.auth.signOut();
          showErr('Google email not verified. Please verify and try again.');
          return;
        }

        // 3. Save session flag
        try { sessionStorage.setItem('sve_admin', email); } catch (e2) {}

        if (window.adminToast) window.adminToast('Welcome, admin!', 'success');
        setTimeout(function () { window.location.href = DASHBOARD_PAGE; }, 400);

      } catch (err) {
        console.error('[Admin Google Auth]', err);
        let msg = 'Sign-in failed. Please try again. / साइन-इन विफल।';

        if (err.code === 'auth/popup-closed-by-user') {
          msg = 'Sign-in cancelled. Please try again. / साइन-इन रद्द।';
        } else if (err.code === 'auth/popup-blocked') {
          msg = 'Popup blocked by browser. Please allow popups and retry. / पॉपअप ब्लॉक है।';
        } else if (err.code === 'auth/network-request-failed') {
          msg = 'Network error. Check your internet connection.';
        } else if (err.code === 'auth/unauthorized-domain') {
          msg = 'This domain is not authorized in Firebase Console. Add it under Authentication → Settings → Authorized domains.';
        } else if (err.code === 'auth/operation-not-allowed') {
          msg = 'Google sign-in is not enabled in Firebase Console. Enable it under Authentication → Sign-in method.';
        }
        showErr(msg);
      } finally {
        googleBtn.disabled = false;
        spinner.hidden = true;
        btnText.textContent = 'Sign in with Google';
      }
    });

    // If already logged in as admin → skip login page
    window.auth.onAuthStateChanged(function (user) {
      if (user && isAdminEmail(user.email)) {
        window.location.href = DASHBOARD_PAGE;
      }
    });
  }

  /* ---------- GUARD FOR ADMIN PAGES ---------- */
  window.requireAdmin = function (callback) {
    return new Promise(function (resolve) {
      const unsub = window.auth.onAuthStateChanged(async function (user) {
        unsub();
        if (!user || !isAdminEmail(user.email)) {
          if (user) { try { await window.auth.signOut(); } catch (e) {} }
          window.location.href = LOGIN_PAGE;
          return;
        }
        const profile = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Admin',
          photo: user.photoURL || ''
        };
        window.adminUser = profile;
        resolve(profile);
        if (callback) callback(profile);
      });
    });
  };

  /* ---------- ADMIN LOGOUT ---------- */
  window.adminLogout = async function () {
    try {
      try { sessionStorage.removeItem('sve_admin'); } catch (e) {}
      await window.auth.signOut();
    } catch (e) {}
    window.location.href = LOGIN_PAGE;
  };

  /* ---------- TOASTS ---------- */
  window.adminToast = function (msg, type) {
    const box = document.getElementById('toastBox');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('hide');
      setTimeout(function () { t.remove(); }, 300);
    }, 3500);
  };

  /* ---------- MOBILE SIDEBAR TOGGLE + UI ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const ham = document.getElementById('adminHamburger');
    const sb  = document.getElementById('adminSidebar');
    if (ham && sb) {
      ham.addEventListener('click', function () { sb.classList.toggle('open'); });
      document.addEventListener('click', function (e) {
        if (sb.classList.contains('open') && !sb.contains(e.target) && !ham.contains(e.target)) {
          sb.classList.remove('open');
        }
      });
    }

    // Highlight current nav
    const path = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.admin-nav a').forEach(function (a) {
      const href = a.getAttribute('href');
      if (href === path) a.classList.add('active');
    });

    // Logout buttons
    document.querySelectorAll('[data-logout]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (confirm('Logout from admin panel? / लॉगआउट?')) window.adminLogout();
      });
    });
  });

})();
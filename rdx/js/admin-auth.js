/* ============================================================
   SVE Admin Panel — Auth Guard (Google-only)
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

    function showErr(m)  { if(errBox){ errBox.textContent = m; errBox.hidden = false; } if(infoBox) infoBox.hidden = true; }
    function showInfo(m) { if(infoBox){ infoBox.textContent = m; infoBox.hidden = false; } if(errBox) errBox.hidden = true; }

    googleBtn.addEventListener('click', async function () {
      if(errBox) errBox.hidden = true;
      if(infoBox) infoBox.hidden = true;
      googleBtn.disabled = true;
      if(spinner) spinner.hidden = false;
      if(btnText) btnText.textContent = 'Signing in…';

      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await window.auth.signInWithPopup(provider);
        const user = result.user;
        const email = (user.email || '').toLowerCase().trim();

        if (!isAdminEmail(email)) {
          await window.auth.signOut();
          showErr('Access denied. This Google account is not an SVE admin.');
          return;
        }

        if (!user.emailVerified) {
          await window.auth.signOut();
          showErr('Google email not verified. Please verify and try again.');
          return;
        }

        try { sessionStorage.setItem('sve_admin', email); } catch (e2) {}

        if (window.adminToast) window.adminToast('Welcome, admin!', 'success');
        setTimeout(function () { window.location.href = DASHBOARD_PAGE; }, 400);

      } catch (err) {
        console.error('[Admin Google Auth]', err);
        let msg = 'Sign-in failed. Please try again.';
        if (err.code === 'auth/popup-closed-by-user') msg = 'Sign-in cancelled.';
        else if (err.code === 'auth/popup-blocked') msg = 'Popup blocked. Please allow popups.';
        else if (err.code === 'auth/unauthorized-domain') msg = 'Domain not authorized in Firebase Console.';
        showErr(msg);
      } finally {
        googleBtn.disabled = false;
        if(spinner) spinner.hidden = true;
        if(btnText) btnText.textContent = 'Sign in with Google';
      }
    });

    // Login page check: If already logged in, redirect to dashboard
    window.auth.onAuthStateChanged(function (user) {
      if (user && isAdminEmail(user.email)) {
        window.location.href = DASHBOARD_PAGE;
      }
    });
  }

  /* ---------- GUARD FOR ADMIN PAGES (FIXED) ---------- */
  window.requireAdmin = function (callback) {
    return new Promise(function (resolve) {
      // isAuthResolved flag ensures we don't redirect while Firebase is still checking
      let isAuthResolved = false;

      const unsub = window.auth.onAuthStateChanged(async function (user) {
        // Agar pehle se check ho chuka hai, toh wapas mat karo
        if (isAuthResolved) return; 
        isAuthResolved = true;
        unsub(); // Stop listening further

        if (!user || !isAdminEmail(user.email)) {
          if (user) { try { await window.auth.signOut(); } catch (e) {} }
          
          // Check if we are already on the login page to prevent infinite loop
          if (!window.location.pathname.includes('index.html')) {
            window.location.href = LOGIN_PAGE;
          }
          return;
        }
        
        // Success: User is authorized
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

    const path = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.admin-nav a').forEach(function (a) {
      const href = a.getAttribute('href');
      if (href === path) a.classList.add('active');
    });

    document.querySelectorAll('[data-logout]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (confirm('Logout from admin panel?')) window.adminLogout();
      });
    });
  });

})();
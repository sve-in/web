/* ============================================================
   SVE Admin Panel — Auth Guard
   Only 2 hardcoded admin emails allowed.
   Guard on every /rdx/* page except /rdx/index.html (login).
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

  /* ---------- LOGIN PAGE LOGIC ---------- */
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    const emailEl = document.getElementById('adminEmail');
    const passEl  = document.getElementById('adminPassword');
    const toggle  = document.getElementById('togglePass');
    const errBox  = document.getElementById('adminError');
    const infoBox = document.getElementById('adminInfo');
    const btn     = document.getElementById('adminLoginBtn');
    const spinner = btn.querySelector('.btn-spinner');
    const btnText = btn.querySelector('.btn-text');

    toggle.addEventListener('click', function () {
      passEl.type = passEl.type === 'password' ? 'text' : 'password';
    });

    function showErr(m) { errBox.textContent = m; errBox.hidden = false; infoBox.hidden = true; }
    function showInfo(m){ infoBox.textContent = m; infoBox.hidden = false; errBox.hidden = true; }

    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      errBox.hidden = true; infoBox.hidden = true;
      const email = emailEl.value.trim().toLowerCase();
      const pass = passEl.value;

      if (!isAdminEmail(email)) {
        showErr('Access denied. This is not an admin account. / पहुंच अस्वीकृत।');
        return;
      }
      if (!pass) { showErr('Password required. / पासवर्ड आवश्यक।'); return; }

      btn.disabled = true; spinner.hidden = false; btnText.textContent = 'Signing in…';

      try {
        const cred = await window.auth.signInWithEmailAndPassword(email, pass);
        // Verify email is verified (rules require it)
        if (!cred.user.emailVerified) {
          await window.auth.signOut();
          showErr('Admin email not verified. Contact owner. / ईमेल सत्यापित नहीं।');
          return;
        }
        // Double-check email matches (in case Firebase returned different)
        if (!isAdminEmail(cred.user.email)) {
          await window.auth.signOut();
          showErr('Access denied. / पहुंच अस्वीकृत।');
          return;
        }

        // Store session flag (sessionStorage — cleared on tab close)
        try { sessionStorage.setItem('sve_admin', cred.user.email); } catch (e2) {}

        if (window.showToast) window.showToast('Welcome, admin!', 'success');
        setTimeout(function () { window.location.href = DASHBOARD_PAGE; }, 400);

      } catch (err) {
        console.error('[Admin Auth]', err);
        let msg = 'Login failed. / लॉगिन विफल।';
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
          msg = 'Invalid credentials. / गलत क्रेडेंशियल।';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Too many attempts. Try later. / बहुत प्रयास।';
        }
        showErr(msg);
      } finally {
        btn.disabled = false; spinner.hidden = true; btnText.textContent = 'Sign In →';
      }
    });

    // Already logged in as admin?
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
        const profile = { uid: user.uid, email: user.email, name: 'Admin' };
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

  /* ---------- MOBILE SIDEBAR TOGGLE ---------- */
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
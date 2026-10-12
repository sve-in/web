/* ============================================================
   SVE Admin — Applications Management
   - List with status filter + search
   - Approve (creates user account + password shown once)
   - Reject (with reason)
   ============================================================ */
(function () {
  'use strict';
  if (!window.requireAdmin) return;

  let CURRENT_FILTER = 'pending';
  let ALL_APPS = [];

  window.requireAdmin(async function (profile) {
    document.getElementById('adminEmail').textContent = profile.email;

    // Tabs
    document.querySelectorAll('#filterTabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#filterTabs button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        CURRENT_FILTER = b.dataset.status;
        render();
      });
    });

    document.getElementById('refreshBtn').addEventListener('click', loadApps);
    document.getElementById('searchBox').addEventListener('input', render);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('appModal').addEventListener('click', function (e) {
      if (e.target.id === 'appModal') closeModal();
    });

    await loadApps();
  });

  async function loadApps() {
    const body = document.getElementById('appsBody');
    body.innerHTML = '<div class="loading-block"><span class="spinner"></span> Loading…</div>';
    try {
      const snap = await window.db.collection('applications').orderBy('createdAt', 'desc').limit(500).get();
      ALL_APPS = [];
      snap.forEach(function (d) { ALL_APPS.push(Object.assign({ _id: d.id }, d.data())); });
      render();
    } catch (e) {
      console.error(e);
      body.innerHTML = '<div class="empty"><div class="ic">⚠️</div>Failed to load applications</div>';
    }
  }

  function render() {
    const body = document.getElementById('appsBody');
    const q = (document.getElementById('searchBox').value || '').toLowerCase().trim();

    let list = ALL_APPS;
    if (CURRENT_FILTER !== 'all') list = list.filter(function (a) { return a.status === CURRENT_FILTER; });
    if (q) {
      list = list.filter(function (a) {
        return ((a.name || '') + ' ' + (a.phone || '') + ' ' + (a.businessName || '') + ' ' + (a.applicationId || '') + ' ' + (a.email || '')).toLowerCase().indexOf(q) !== -1;
      });
    }

    if (!list.length) {
      body.innerHTML = '<div class="empty"><div class="ic">📭</div><p>No applications found</p></div>';
      return;
    }

    let html = '<table class="admin-table"><thead><tr>'
      + '<th>App ID</th><th>Name</th><th>Business</th><th>Phone</th><th>City</th><th>Type</th><th>Status</th><th>Date</th><th>Actions</th>'
      + '</tr></thead><tbody>';

    list.forEach(function (a) {
      const dt = a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleDateString('en-IN') : '—';
      html += '<tr>'
        + '<td><strong>' + (a.applicationId || a._id) + '</strong></td>'
        + '<td>' + (a.name || '—') + '</td>'
        + '<td>' + (a.businessName || '—') + '</td>'
        + '<td>' + (a.phone || '—') + '</td>'
        + '<td>' + (a.city || '—') + '</td>'
        + '<td>' + (a.businessType || '—') + '</td>'
        + '<td><span class="pill pill-' + (a.status || 'pending') + '">' + (a.status || 'pending') + '</span></td>'
        + '<td>' + dt + '</td>'
        + '<td><div class="row-actions">'
          + '<button class="btn-outline btn-sm" data-view="' + a._id + '">View</button>'
          + (a.status === 'pending'
              ? '<button class="btn-success btn-sm" data-approve="' + a._id + '">✓ Approve</button>'
                + '<button class="btn-danger btn-sm" data-reject="' + a._id + '">✕ Reject</button>'
              : '')
          + '<a class="btn-outline btn-sm" target="_blank" href="https://wa.me/91' + String(a.phone || '').replace(/\D/g, '').slice(-10) + '">💬</a>'
          + '<a class="btn-outline btn-sm" href="tel:' + (a.phone || '') + '">📞</a>'
        + '</div></td>'
        + '</tr>';
    });
    html += '</tbody></table>';
    body.innerHTML = html;

    // Attach handlers
    body.querySelectorAll('[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { openModal(b.dataset.view); });
    });
    body.querySelectorAll('[data-approve]').forEach(function (b) {
      b.addEventListener('click', function () { approveApp(b.dataset.approve); });
    });
    body.querySelectorAll('[data-reject]').forEach(function (b) {
      b.addEventListener('click', function () { rejectApp(b.dataset.reject); });
    });
  }

  function closeModal() {
    document.getElementById('appModal').classList.remove('open');
    document.getElementById('modalContent').innerHTML = '';
  }

  function openModal(id) {
    const a = ALL_APPS.find(function (x) { return x._id === id; });
    if (!a) return;
    const dt = a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleString('en-IN') : '—';
    const doc = a.docUrl ? '<a href="' + a.docUrl + '" target="_blank" class="doc-link">📄 View Document</a>' : '<span style="color:#64748b;">No document uploaded</span>';

    let html = '<div class="app-details">'
      + row('Application ID', a.applicationId || a._id)
      + row('Status', '<span class="pill pill-' + (a.status || 'pending') + '">' + (a.status || 'pending') + '</span>')
      + row('Name', a.name)
      + row('Phone', a.phone)
      + row('Email', a.email)
      + row('Business Name', a.businessName)
      + row('Business Type', a.businessType)
      + row('GST', a.gst || '—')
      + row('City', a.city)
      + row('State', a.state)
      + row('Monthly Volume', a.volume)
      + row('Submitted', dt)
      + '</div>'
      + '<div style="margin-bottom:16px;"><div style="font-size:.72rem;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:6px;">Message</div><div style="color:#cbd5e1;">' + (a.message || '—') + '</div></div>'
      + '<div style="margin-bottom:16px;"><div style="font-size:.72rem;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:6px;">Document</div>' + doc + '</div>';

    if (a.status === 'pending') {
      html += '<div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">'
        + '<button class="btn-success" data-modal-approve="' + a._id + '">✓ Approve &amp; Create Account</button>'
        + '<button class="btn-danger" data-modal-reject="' + a._id + '">✕ Reject</button>'
        + '</div>';
    }
    if (a.status === 'approved' && a.generatedPassword) {
      html += '<div class="cred-box"><div class="lbl">Credentials sent to user</div>'
        + '<div class="val">Email: ' + (a.email || '') + '</div>'
        + '<div class="val">Password: ' + a.generatedPassword + '</div></div>';
    }
    if (a.status === 'rejected' && a.rejectedReason) {
      html += '<div class="alert alert-error" style="margin-top:16px;">Rejection Reason: ' + a.rejectedReason + '</div>';
    }

    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('appModal').classList.add('open');

    document.querySelectorAll('[data-modal-approve]').forEach(function (b) {
      b.addEventListener('click', function () { approveApp(b.dataset.modalApprove); });
    });
    document.querySelectorAll('[data-modal-reject]').forEach(function (b) {
      b.addEventListener('click', function () { rejectApp(b.dataset.modalReject); });
    });
  }

  function row(k, v) {
    return '<div class="row"><div class="k">' + k + '</div><div class="v">' + (v || '—') + '</div></div>';
  }

  function randomPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    let p = '';
    for (let i = 0; i < 10; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
    return p;
  }

  /* ---------- APPROVE ---------- */
  async function approveApp(id) {
    const a = ALL_APPS.find(function (x) { return x._id === id; });
    if (!a) return;
    if (!confirm('Approve ' + a.name + '? This creates a user account and generates a password.')) return;

    try {
      const tempPass = randomPassword();

      // 1. Create Firebase Auth user
      // NOTE: creating a user from client SDK signs them in — so we create a
      // secondary app instance and use that, then sign out from the secondary.
      const secondaryApp = firebase.apps.find(function (app) { return app.name === 'sve-secondary'; })
        || firebase.initializeApp(window.firebaseConfig || firebase.app().options, 'sve-secondary');
      const secondaryAuth = secondaryApp.auth();

      let uid = null;
      try {
        const cred = await secondaryAuth.createUserWithEmailAndPassword(a.email, tempPass);
        uid = cred.user.uid;
        await secondaryAuth.signOut();
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          // Get existing uid from users collection if possible; else use email as key fallback
          const existing = await window.db.collection('users').where('email', '==', a.email).limit(1).get();
          if (!existing.empty) uid = existing.docs[0].id;
          else throw new Error('Email already registered but no matching user record found.');
        } else {
          throw authErr;
        }
      }

      // 2. Save user profile in Firestore
      await window.db.collection('users').doc(uid).set({
        uid: uid,
        email: a.email,
        name: a.name,
        businessName: a.businessName,
        phone: a.phone,
        city: a.city,
        state: a.state,
        businessType: a.businessType,
        gst: a.gst || '',
        role: 'member',
        status: 'active',
        applicationId: a.applicationId || a._id,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        approvedBy: window.adminUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // 3. Update application doc
      await window.db.collection('applications').doc(a._id).update({
        status: 'approved',
        generatedPassword: tempPass,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        approvedBy: window.adminUser.email
      });

      window.adminToast('Approved! Share password with user: ' + tempPass, 'success');
      await loadApps();
      openModal(a._id); // reopen to show credentials
    } catch (e) {
      console.error('[Approve]', e);
      window.adminToast('Approval failed: ' + e.message, 'error');
    }
  }

  /* ---------- REJECT ---------- */
  async function rejectApp(id) {
    const a = ALL_APPS.find(function (x) { return x._id === id; });
    if (!a) return;
    const reason = prompt('Reason for rejection (optional):', 'Territory not available');
    if (reason === null) return;

    try {
      await window.db.collection('applications').doc(a._id).update({
        status: 'rejected',
        rejectedReason: reason || '',
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
        rejectedBy: window.adminUser.email
      });
      window.adminToast('Application rejected', 'success');
      closeModal();
      await loadApps();
    } catch (e) {
      console.error(e);
      window.adminToast('Reject failed: ' + e.message, 'error');
    }
  }

})();
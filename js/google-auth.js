/* ============================================================
   SVE Business Portal — Google Authentication
   ============================================================ */

(function () {
  'use strict';

  function handleGoogleAuth(type) {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    window.auth.signInWithPopup(provider)
      .then(async (result) => {
        const user = result.user;
        const userDocRef = window.db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();

        if (type === 'signup') {
          if (userDoc.exists) {
            // Agar user pehle se hai, toh direct login karwao
            if (window.uiToast) window.uiToast('Account already exists. Logging you in...', 'success');
            window.location.href = 'dashboard.html';
            return;
          }

          // Naya user: Data save karo Firestore mein
          await userDocRef.set({
            uid: user.uid,
            name: user.displayName || '',
            email: user.email,
            phone: '',
            role: 'member',
            status: 'pending_approval', // Admin approval zaroori hai
            emailVerified: true, // Google ka email verified hota hai
            signupSource: 'google-auth',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          // Application ID generate karo
          const year = new Date().getFullYear();
          const counterRef = window.db.collection('counters').doc('applications_' + year);
          const num = await window.db.runTransaction(async function (tx) {
            const d = await tx.get(counterRef);
            const n = (d.exists ? (d.data().count || 0) : 0) + 1;
            tx.set(counterRef, { count: n, year: year, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            return n;
          });
          const appId = 'SVE-APP-' + year + '-' + String(num).padStart(4, '0');

          // Applications collection mein add karo
          await window.db.collection('applications').doc(appId).set({
            applicationId: appId,
            uid: user.uid,
            name: user.displayName || '',
            email: user.email,
            phone: '',
            businessName: '',
            city: '',
            status: 'pending',
            source: 'google-signup',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          if (window.uiToast) window.uiToast('Account created! Waiting for admin approval.', 'success');
          setTimeout(() => window.location.href = 'apply-status.html', 1500);

        } else {
          // Type is 'login'
          if (!userDoc.exists) {
            await window.auth.signOut();
            if (window.uiToast) window.uiToast('No account found. Please sign up first.', 'error');
            return;
          }

          if (userDoc.data().status === 'pending_approval' || userDoc.data().status === 'pending') {
            await window.auth.signOut();
            if (window.uiToast) window.uiToast('Your account is pending admin approval.', 'warning');
            return;
          }

          if (userDoc.data().status !== 'active') {
            await window.auth.signOut();
            if (window.uiToast) window.uiToast('Account is ' + userDoc.data().status + '. Contact support.', 'error');
            return;
          }

          if (window.uiToast) window.uiToast('Welcome back!', 'success');
          setTimeout(() => window.location.href = 'dashboard.html', 600);
        }
      })
      .catch((error) => {
        console.error('Google Auth Error:', error);
        if (window.uiToast) window.uiToast('Google sign-in failed. Please try again.', 'error');
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const signupBtn = document.getElementById('googleSignupBtn');
    if (signupBtn) {
      signupBtn.addEventListener('click', function (e) {
        e.preventDefault();
        handleGoogleAuth('signup');
      });
    }

    const loginBtn = document.getElementById('googleLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        handleGoogleAuth('login');
      });
    }
  });

})();
/* ============================================================
   SVE Business Portal — Firebase Config (Compat SDK v9)
   File: js/firebase-config.js
   Project: sveindialive
   ============================================================ */

const firebaseConfig = {
  apiKey:            "AIzaSyBMo3LIA4veHyyRpONiDJaztQcjKSWTRRc",
  authDomain:        "sveindialive.firebaseapp.com",
  databaseURL:       "https://sveindialive-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "sveindialive",
  storageBucket:     "sveindialive.firebasestorage.app",
  messagingSenderId: "849337808451",
  appId:             "1:849337808451:web:b9ddb2d830c60650c786f6",
  measurementId:     "G-TFEGWTDWD5"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

window.db      = firebase.firestore();
window.auth    = firebase.auth();
window.storage = firebase.storage();

try {
  window.db.enablePersistence({ synchronizeTabs: true }).catch(function (err) {
    if (err.code === 'failed-precondition') console.warn('[SVE] Persistence: multiple tabs.');
    else if (err.code === 'unimplemented') console.warn('[SVE] Persistence unsupported.');
  });
} catch (e) { /* silent */ }

window.fbReady = Promise.resolve(true);
console.log('[SVE] Firebase ready:', firebaseConfig.projectId);
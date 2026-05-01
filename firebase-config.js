// =================================================================
//  firebase-config.js — Anders Leren (Juf Zisa)
//  De Firebase SDK wordt geladen via <script>-tags in index.html en leerkracht.html.
//  Dit bestand wordt pas uitgevoerd nadat firebase-app en firebase-firestore klaar zijn.
// =================================================================

(function() {
  if (typeof firebase === 'undefined') {
    console.warn('[firebase-config] Firebase SDK niet geladen — voortgang werkt alleen lokaal.');
    window.FIREBASE_INGESTELD = false;
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyASi5qfJtQjQSn5u4ZZXhp3mJOoYEdfeeM",
    authDomain: "anders-leren-jufzisa.firebaseapp.com",
    projectId: "anders-leren-jufzisa",
    storageBucket: "anders-leren-jufzisa.firebasestorage.app",
    messagingSenderId: "701643982201",
    appId: "1:701643982201:web:f8aaabe4dbdb3a2bae5ba8"
  };

  try {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    window.FIREBASE_INGESTELD = true;
    console.log('[firebase-config] Firebase ingesteld ✓');
  } catch (e) {
    console.error('[firebase-config] Initialisatie mislukt:', e);
    window.FIREBASE_INGESTELD = false;
  }
})();

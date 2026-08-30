// =================================================================
//  firebase-config.js — Anders Leren (Juf Zisa)
//  De Firebase SDK wordt geladen via <script>-tags in index.html en kind.html.
//  Dit bestand wordt pas uitgevoerd nadat firebase-app en firebase-firestore klaar zijn.
// =================================================================

(function() {
  if (typeof firebase === 'undefined') {
    console.warn('[firebase-config] Firebase SDK niet geladen — voortgang werkt alleen lokaal.');
    window.FIREBASE_INGESTELD = false;
    return;
  }

  // De standaard-app is bewust dezelfde als die van het schoolportaal.
  // Omdat beide tools onder https://isabelrockele.github.io/ staan, kan
  // Firebase Auth zo dezelfde reeds aangemelde leerkracht herkennen.
  const schoolportaalConfig = {
    apiKey: "AIzaSyA7KxXMvZ4dzBQDut3CMyWUblLte2tFzoQ",
    authDomain: "huiswerkapp-a311e.firebaseapp.com",
    projectId: "huiswerkapp-a311e",
    storageBucket: "huiswerkapp-a311e.appspot.com",
    messagingSenderId: "797169941164",
    appId: "1:797169941164:web:511d9618079f1378d0fd09"
  };

  // Taalgroei houdt zijn bestaande oefen- en rapportgegevens voorlopig in
  // het eigen project. Dat voorkomt een risicovolle datamigratie tijdens de
  // voorbereiding van de centrale aanmelding.
  const taalgroeiConfig = {
    apiKey: "AIzaSyASi5qfJtQjQSn5u4ZZXhp3mJOoYEdfeeM",
    authDomain: "anders-leren-jufzisa.firebaseapp.com",
    projectId: "anders-leren-jufzisa",
    storageBucket: "anders-leren-jufzisa.firebasestorage.app",
    messagingSenderId: "701643982201",
    appId: "1:701643982201:web:f8aaabe4dbdb3a2bae5ba8"
  };

  try {
    const schoolApp = firebase.apps.length
      ? firebase.app()
      : firebase.initializeApp(schoolportaalConfig);
    const taalgroeiApp = firebase.apps.some(app => app.name === 'taalgroei-data')
      ? firebase.app('taalgroei-data')
      : firebase.initializeApp(taalgroeiConfig, 'taalgroei-data');

    window.schoolApp = schoolApp;
    window.schoolAuth = typeof firebase.auth === 'function' ? schoolApp.auth() : null;
    window.schoolDb = schoolApp.firestore();
    window.taalgroeiApp = taalgroeiApp;
    window.db = taalgroeiApp.firestore();
    window.taalgroeiStorage = typeof taalgroeiApp.storage === 'function' ? taalgroeiApp.storage() : null;
    window.FIREBASE_INGESTELD = true;
    console.log('[firebase-config] Centrale aanmelding en Taalgroei-data ingesteld ✓');
  } catch (e) {
    console.error('[firebase-config] Initialisatie mislukt:', e);
    window.FIREBASE_INGESTELD = false;
  }
})();

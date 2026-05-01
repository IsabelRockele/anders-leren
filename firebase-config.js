// =================================================================
//  Firebase configuratie — Anders Leren (Juf Zisa)
//  Project: anders-leren-jufzisa
// =================================================================

// Firebase SDK laden via CDN
const firebaseScript = document.createElement('script');
firebaseScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
document.head.appendChild(firebaseScript);

const firestoreScript = document.createElement('script');
firestoreScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js';
document.head.appendChild(firestoreScript);

// Wacht tot beide scripts geladen zijn voor we initialiseren
firestoreScript.onload = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyASi5qfJtQjQSn5u4ZZXhp3mJOoYEdfeeM",
    authDomain: "anders-leren-jufzisa.firebaseapp.com",
    projectId: "anders-leren-jufzisa",
    storageBucket: "anders-leren-jufzisa.firebasestorage.app",
    messagingSenderId: "701643982201",
    appId: "1:701643982201:web:f8aaabe4dbdb3a2bae5ba8"
  };

  firebase.initializeApp(firebaseConfig);
  window.db = firebase.firestore();
  window.FIREBASE_INGESTELD = true;

  // Trigger event zodat andere scripts weten dat Firebase klaar is
  document.dispatchEvent(new Event('firebase-ready'));
};
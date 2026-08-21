/* ==========================================================================
   Shared Life Hub - Firebase Initialization & Configuration
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBBIODRry_cTESlhqspVFxWNcZjqV8YXMw",
  authDomain: "dashboard-pareja.firebaseapp.com",
  projectId: "dashboard-pareja",
  storageBucket: "dashboard-pareja.firebasestorage.app",
  messagingSenderId: "854911527732",
  appId: "1:854911527732:web:02241ee5638534ae5a5361"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

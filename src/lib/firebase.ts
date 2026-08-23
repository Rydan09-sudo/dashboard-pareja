import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBBIODRry_cTESlhqspVFxWNcZjqV8YXMw",
  authDomain: "dashboard-pareja.firebaseapp.com",
  projectId: "dashboard-pareja",
  storageBucket: "dashboard-pareja.firebasestorage.app",
  messagingSenderId: "854911527732",
  appId: "1:854911527732:web:02241ee5638534ae5a5361"
};

// Initialize Firebase modularly
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

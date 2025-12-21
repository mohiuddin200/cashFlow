import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";
import type { User } from "firebase/auth";

// Your Firebase credentials
const firebaseConfig = {
  apiKey: "AIzaSyBpmartgW9gogPjz60wIVdTRlFNEec0QJo",
  authDomain: "cashflow-d07b5.firebaseapp.com",
  projectId: "cashflow-d07b5",
  storageBucket: "cashflow-d07b5.firebasestorage.app",
  messagingSenderId: "491355699088",
  appId: "1:491355699088:web:bcc04ef2120fa5b2186515"
};

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit
};
export type { User };
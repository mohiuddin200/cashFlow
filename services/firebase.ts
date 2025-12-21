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
  limit,
  addDoc,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Transaction, Category } from "../types";

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

// Transaction CRUD operations
export const saveTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>) => {
  console.log('saveTransaction called with userId:', userId, 'transaction:', transaction);
  try {
    const transactionsCollection = collection(db, "users", userId, "transactions");
    console.log('Collection reference created');
    const docRef = await addDoc(transactionsCollection, {
      ...transaction,
      createdAt: Timestamp.now()
    });
    console.log('Document added successfully with ID:', docRef.id);
    return { id: docRef.id, ...transaction };
  } catch (error) {
    console.error("Error saving transaction:", error);
    throw error;
  }
};

export const updateTransaction = async (userId: string, transactionId: string, transaction: Partial<Transaction>) => {
  try {
    const transactionDoc = doc(db, "users", userId, "transactions", transactionId);
    await updateDoc(transactionDoc, {
      ...transaction,
      updatedAt: Timestamp.now()
    });
    return { id: transactionId, ...transaction };
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
  try {
    const transactionDoc = doc(db, "users", userId, "transactions", transactionId);
    await deleteDoc(transactionDoc);
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};

export const subscribeToTransactions = (userId: string, callback: (transactions: Transaction[]) => void) => {
  const transactionsCollection = collection(db, "users", userId, "transactions");
  const q = query(transactionsCollection, orderBy("date", "desc"));

  return onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date instanceof Timestamp ? doc.data().date.toDate().toISOString() : doc.data().date
    } as Transaction));
    callback(transactions);
  });
};

// Categories CRUD operations
export const saveCategory = async (userId: string, category: Omit<Category, 'id'>) => {
  try {
    const categoriesCollection = collection(db, "users", userId, "categories");
    const docRef = await addDoc(categoriesCollection, category);
    return { id: docRef.id, ...category };
  } catch (error) {
    console.error("Error saving category:", error);
    throw error;
  }
};

export const updateCategory = async (userId: string, categoryId: string, category: Partial<Category>) => {
  try {
    const categoryDoc = doc(db, "users", userId, "categories", categoryId);
    await updateDoc(categoryDoc, category);
    return { id: categoryId, ...category };
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

export const subscribeToCategories = (userId: string, callback: (categories: Category[]) => void) => {
  const categoriesCollection = collection(db, "users", userId, "categories");

  return onSnapshot(categoriesCollection, (snapshot) => {
    const categories: Category[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));
    callback(categories);
  });
};

// User settings operations
export const updateUserSettings = async (userId: string, settings: { spendingGoal?: number }) => {
  try {
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, {
      ...settings,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
};

export const subscribeToUserSettings = (userId: string, callback: (settings: { spendingGoal: number }) => void) => {
  const userDoc = doc(db, "users", userId);

  return onSnapshot(userDoc, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
        spendingGoal: data.spendingGoal || 20000
      });
    }
  });
};

// Initialize user document
export const initializeUserDocument = async (userId: string, email?: string) => {
  try {
    const userDoc = doc(db, "users", userId);
    await setDoc(userDoc, {
      email,
      spendingGoal: 20000,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error initializing user document:", error);
    throw error;
  }
};

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
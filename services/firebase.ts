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
  Timestamp,
  enableIndexedDbPersistence,
  enableNetwork,
  disableNetwork
} from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import type { User } from "firebase/auth";
import type { Transaction, Category } from "../types";
import { DEFAULT_CURRENCY } from "../constants";
import { offlineSyncService } from "./offlineSync";

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

// Initialize messaging for push notifications
export const messaging = getMessaging(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled
    // in one tab at a a time.
    console.log('Persistence disabled due to multiple tabs');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the
    // features required to enable persistence
    console.log('Persistence not supported by browser');
  }
});

// Connectivity management
export const enableConnectivity = async () => {
  try {
    await enableNetwork(db);
    await offlineSyncService.syncPendingChanges();
  } catch (error) {
    console.error('Error enabling connectivity:', error);
  }
};

export const disableConnectivity = async () => {
  try {
    await disableNetwork(db);
  } catch (error) {
    console.error('Error disabling connectivity:', error);
  }
};

// Transaction CRUD operations
export const saveTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>, isOffline = false) => {
  console.log('saveTransaction called with userId:', userId, 'transaction:', transaction, 'isOffline:', isOffline);

  const isOnline = navigator.onLine;
  const finalTransaction = { ...transaction, userId };

  try {
    // Always save to offline storage first
    await offlineSyncService.init();
    const savedTransaction = await offlineSyncService.saveTransaction(
      { id: '', ...finalTransaction } as Transaction,
      !isOnline || isOffline
    );

    // If online and not explicitly offline, sync with Firebase
    if (isOnline && !isOffline) {
      const transactionsCollection = collection(db, "users", userId, "transactions");
      const docRef = await addDoc(transactionsCollection, {
        ...transaction,
        createdAt: Timestamp.now()
      });

      // Update the offline record with the actual ID
      const transactionWithId = { id: docRef.id, ...finalTransaction };
      await offlineSyncService.saveTransaction(transactionWithId, false);

      console.log('Document added successfully with ID:', docRef.id);
      return transactionWithId;
    }

    return savedTransaction;
  } catch (error) {
    console.error("Error saving transaction:", error);

    // If Firebase fails but we're online, save to offline storage
    if (isOnline && !isOffline) {
      await offlineSyncService.init();
      return await offlineSyncService.saveTransaction(
        { id: '', ...finalTransaction } as Transaction,
        true
      );
    }

    throw error;
  }
};

export const updateTransaction = async (userId: string, transactionId: string, transaction: Partial<Transaction>, isOffline = false) => {
  const isOnline = navigator.onLine;
  const finalTransaction = { ...transaction, id: transactionId, userId };

  try {
    // Always update offline storage first
    await offlineSyncService.init();
    await offlineSyncService.saveTransaction(
      finalTransaction as Transaction,
      !isOnline || isOffline
    );

    // If online and not explicitly offline, sync with Firebase
    if (isOnline && !isOffline) {
      const transactionDoc = doc(db, "users", userId, "transactions", transactionId);
      await updateDoc(transactionDoc, {
        ...transaction,
        updatedAt: Timestamp.now()
      });
    }

    return finalTransaction;
  } catch (error) {
    console.error("Error updating transaction:", error);

    // If Firebase fails but we're online, save to offline storage
    if (isOnline && !isOffline) {
      await offlineSyncService.init();
      await offlineSyncService.saveTransaction(finalTransaction as Transaction, true);
    }

    throw error;
  }
};

export const deleteTransaction = async (userId: string, transactionId: string, isOffline = false) => {
  const isOnline = navigator.onLine;

  try {
    // Always update offline storage first
    await offlineSyncService.init();
    await offlineSyncService.deleteTransaction(transactionId, !isOnline || isOffline);

    // If online and not explicitly offline, sync with Firebase
    if (isOnline && !isOffline) {
      const transactionDoc = doc(db, "users", userId, "transactions", transactionId);
      await deleteDoc(transactionDoc);
    }
  } catch (error) {
    console.error("Error deleting transaction:", error);

    // If Firebase fails but we're online, save to offline storage
    if (isOnline && !isOffline) {
      await offlineSyncService.init();
      await offlineSyncService.deleteTransaction(transactionId, true);
    }

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
export const saveCategory = async (userId: string, category: Omit<Category, 'id'>, isOffline = false) => {
  const isOnline = navigator.onLine;
  const finalCategory = { ...category, userId };

  try {
    // Always save to offline storage first
    await offlineSyncService.init();
    const savedCategory = await offlineSyncService.saveCategory(
      { id: '', ...finalCategory } as Category,
      !isOnline || isOffline
    );

    // If online and not explicitly offline, sync with Firebase
    if (isOnline && !isOffline) {
      const categoriesCollection = collection(db, "users", userId, "categories");
      const docRef = await addDoc(categoriesCollection, category);

      // Update the offline record with the actual ID
      const categoryWithId = { id: docRef.id, ...finalCategory };
      await offlineSyncService.saveCategory(categoryWithId, false);

      return categoryWithId;
    }

    return savedCategory;
  } catch (error) {
    console.error("Error saving category:", error);

    // If Firebase fails but we're online, save to offline storage
    if (isOnline && !isOffline) {
      await offlineSyncService.init();
      return await offlineSyncService.saveCategory(
        { id: '', ...finalCategory } as Category,
        true
      );
    }

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
export const updateUserSettings = async (userId: string, settings: { spendingGoal?: number; currency?: string }) => {
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

export const subscribeToUserSettings = (userId: string, callback: (settings: { spendingGoal: number; currency: string }) => void) => {
  const userDoc = doc(db, "users", userId);

  return onSnapshot(userDoc, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
        spendingGoal: data.spendingGoal || 20000,
        currency: data.currency || DEFAULT_CURRENCY
      });
    } else {
      // If document doesn't exist, call with default values
      callback({
        spendingGoal: 20000,
        currency: DEFAULT_CURRENCY
      });
    }
  });
};

// Initialize user document
export const initializeUserDocument = async (userId: string, email?: string) => {
  try {
    const userDoc = doc(db, "users", userId);
    const docSnapshot = await getDoc(userDoc);

    // Only create the document if it doesn't exist
    if (!docSnapshot.exists()) {
      await setDoc(userDoc, {
        email,
        spendingGoal: 20000,
        currency: DEFAULT_CURRENCY,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error("Error initializing user document:", error);
    throw error;
  }
};

// Connectivity and sync status helper
export const getConnectivityStatus = async () => {
  const offlineStatus = await offlineSyncService.getSyncStatus();
  return {
    isOnline: navigator.onLine,
    ...offlineStatus
  };
};

// Initialize offline sync service
export const initializeOfflineSync = async () => {
  await offlineSyncService.init();
  // Try to sync any pending changes
  if (navigator.onLine) {
    await offlineSyncService.syncPendingChanges();
  }
};

// Financial advice operations
export const saveFinancialAdvice = async (userId: string, advice: { content: string; summary: string }) => {
  try {
    const adviceCollection = collection(db, "users", userId, "advice");
    const docRef = await addDoc(adviceCollection, {
      ...advice,
      createdAt: Timestamp.now()
    });
    return {
      id: docRef.id,
      ...advice,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error saving financial advice:", error);
    throw error;
  }
};

export const subscribeToAdviceHistory = (userId: string, callback: (advice: any[]) => void) => {
  const adviceCollection = collection(db, "users", userId, "advice");
  const q = query(adviceCollection, orderBy("createdAt", "desc"), limit(10));

  return onSnapshot(q, (snapshot) => {
    const advice = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt
    }));
    callback(advice);
  });
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
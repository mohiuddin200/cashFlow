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
  getDocs,
  updateDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  where,
  startAfter,
  addDoc,
  deleteDoc,
  Timestamp,
  enableIndexedDbPersistence,
  enableNetwork,
  disableNetwork
} from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import type { User } from "firebase/auth";
import type { Transaction, Category, FinancialAdvice, Loan, LoanPayment } from "../types";
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

// Subscribe to transactions with a default limit for safety
export const subscribeToTransactions = (userId: string, callback: (transactions: Transaction[]) => void, maxResults = 200) => {
  const transactionsCollection = collection(db, "users", userId, "transactions");
  const q = query(transactionsCollection, orderBy("date", "desc"), limit(maxResults));

  return onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date instanceof Timestamp ? doc.data().date.toDate().toISOString() : doc.data().date
    } as Transaction));
    callback(transactions);
  });
};

// Subscribe to transactions scoped to a specific month for efficiency
export const subscribeToMonthTransactions = (
  userId: string,
  monthStart: string,
  monthEnd: string,
  callback: (transactions: Transaction[]) => void
) => {
  const transactionsCollection = collection(db, "users", userId, "transactions");
  const q = query(
    transactionsCollection,
    where("date", ">=", monthStart),
    where("date", "<=", monthEnd),
    orderBy("date", "desc"),
    limit(500)
  );

  return onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date instanceof Timestamp ? doc.data().date.toDate().toISOString() : doc.data().date
    } as Transaction));
    callback(transactions);
  });
};

// Paginated transaction fetching for history view
export const fetchTransactionPage = async (
  userId: string,
  pageSize: number = 50,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ transactions: Transaction[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  const transactionsCollection = collection(db, "users", userId, "transactions");
  const constraints = [orderBy("date", "desc"), limit(pageSize)];
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  const q = query(transactionsCollection, ...constraints);
  const snapshot = await getDocs(q);

  const transactions: Transaction[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date instanceof Timestamp ? doc.data().date.toDate().toISOString() : doc.data().date
  } as Transaction));

  const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { transactions, lastDoc: newLastDoc };
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

export const updateCategory = async (userId: string, categoryId: string, category: Partial<Category>, isOffline = false) => {
  const isOnline = navigator.onLine;
  const finalCategory = { id: categoryId, ...category, userId };

  try {
    // Always update offline storage first
    await offlineSyncService.init();
    await offlineSyncService.saveCategory(
      finalCategory as Category,
      !isOnline || isOffline
    );

    // If online and not explicitly offline, sync with Firebase
    if (isOnline && !isOffline) {
      const categoryDoc = doc(db, "users", userId, "categories", categoryId);
      await updateDoc(categoryDoc, category);
    }

    return finalCategory;
  } catch (error) {
    console.error("Error updating category:", error);

    // If Firebase fails but we're online, save to offline storage
    if (isOnline && !isOffline) {
      await offlineSyncService.init();
      await offlineSyncService.saveCategory(finalCategory as Category, true);
    }

    throw error;
  }
};

export const deleteCategory = async (userId: string, categoryId: string, isOffline = false) => {
  const isOnline = navigator.onLine;

  try {
    // Always update offline storage first
    await offlineSyncService.init();
    await offlineSyncService.deleteCategory(categoryId, !isOnline || isOffline);

    // If online and not explicitly offline, sync with Firebase
    if (isOnline && !isOffline) {
      const categoryDoc = doc(db, "users", userId, "categories", categoryId);
      await deleteDoc(categoryDoc);
    }
  } catch (error) {
    console.error("Error deleting category:", error);

    // If Firebase fails but we're online, save to offline storage
    if (isOnline && !isOffline) {
      await offlineSyncService.init();
      await offlineSyncService.deleteCategory(categoryId, true);
    }

    throw error;
  }
};

export const reassignCategoryForTransactions = async (
  userId: string,
  oldCategoryId: string,
  newCategoryId: string
) => {
  try {
    // Get all transactions with the old category
    const transactionsCollection = collection(db, "users", userId, "transactions");
    const q = query(transactionsCollection, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    // Batch update all transactions with the old category
    const batch = [];
    for (const doc of querySnapshot.docs) {
      const transaction = doc.data();
      if (transaction.categoryId === oldCategoryId) {
        batch.push(updateDoc(doc.ref, { categoryId: newCategoryId }));
      }
    }

    // Execute all updates
    await Promise.all(batch);

    // Also update offline storage
    await offlineSyncService.init();
    const offlineTransactions = await offlineSyncService.getTransactions();

    for (const tx of offlineTransactions) {
      if (tx.data.categoryId === oldCategoryId) {
        await offlineSyncService.saveTransaction(
          { ...tx.data, categoryId: newCategoryId },
          false
        );
      }
    }

    return { success: true, count: batch.length };
  } catch (error) {
    console.error("Error reassigning category for transactions:", error);
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
export const updateUserSettings = async (userId: string, settings: { spendingGoal?: number; currency?: string; carryForwardEnabled?: boolean }) => {
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

export const subscribeToUserSettings = (userId: string, callback: (settings: { spendingGoal: number; currency: string; carryForwardEnabled: boolean }) => void) => {
  const userDoc = doc(db, "users", userId);

  return onSnapshot(userDoc, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
        spendingGoal: data.spendingGoal || 20000,
        currency: data.currency || DEFAULT_CURRENCY,
        carryForwardEnabled: data.carryForwardEnabled ?? true
      });
    } else {
      // If document doesn't exist, call with default values
      callback({
        spendingGoal: 20000,
        currency: DEFAULT_CURRENCY,
        carryForwardEnabled: true
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
        carryForwardEnabled: true,
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

export const getLatestAdvice = async (userId: string): Promise<FinancialAdvice | null> => {
  try {
    const adviceCollection = collection(db, "users", userId, "advice");
    const q = query(adviceCollection, orderBy("createdAt", "desc"), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        content: data.content,
        summary: data.summary,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting latest advice:", error);
    return null;
  }
};

// Loan CRUD operations
export const saveLoan = async (userId: string, loan: Omit<Loan, 'id'>, isOffline = false) => {
  const isOnline = navigator.onLine;
  const finalLoan = { ...loan, userId };

  try {
    // Always save to offline storage first
    await offlineSyncService.init();
    const savedLoan = await offlineSyncService.saveLoan(
      { id: '', ...finalLoan } as Loan,
      !isOnline || isOffline
    );

    // If online and not explicitly offline, sync with Firebase
    if (isOnline && !isOffline) {
      const loansCollection = collection(db, "users", userId, "loans");
      const docRef = await addDoc(loansCollection, {
        ...loan,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Update the offline record with the actual ID
      const loanWithId = { id: docRef.id, ...finalLoan };
      await offlineSyncService.saveLoan(loanWithId, false);

      // Create initial transaction if loan is connected to money
      if (loan.isConnectedToMoney) {
        const transactionType = loan.direction === 'given' ? 'expense' : 'income';
        const transactionNote = `Loan ${loan.direction === 'given' ? 'to' : 'from'} ${loan.personName}`;

        await saveTransaction(userId, {
          amount: loan.amount,
          categoryId: loan.direction === 'given' ? 'loan-given' : 'loan-taken',
          date: loan.date,
          note: transactionNote,
          type: transactionType,
          loanId: docRef.id // Link transaction to this loan
        }, isOffline);
      }

      return loanWithId;
    }

    return savedLoan;
  } catch (error) {
    console.error("Error saving loan:", error);

    // If Firebase fails but we're online, save to offline storage
    if (isOnline && !isOffline) {
      await offlineSyncService.init();
      return await offlineSyncService.saveLoan(
        { id: '', ...finalLoan } as Loan,
        true
      );
    }

    throw error;
  }
};

export const updateLoan = async (userId: string, loanId: string, loan: Partial<Loan>, isOffline = false) => {
  const isOnline = navigator.onLine;
  const finalLoan = { ...loan, id: loanId, userId };

  try {
    // Always update offline storage first
    await offlineSyncService.init();
    await offlineSyncService.saveLoan(
      finalLoan as Loan,
      !isOnline || isOffline
    );

    // If online and not explicitly offline, sync with Firebase
    if (isOnline && !isOffline) {
      const loanDoc = doc(db, "users", userId, "loans", loanId);
      await updateDoc(loanDoc, {
        ...loan,
        updatedAt: Timestamp.now()
      });
    }

    return finalLoan;
  } catch (error) {
    console.error("Error updating loan:", error);

    // If Firebase fails but we're online, save to offline storage
    if (isOnline && !isOffline) {
      await offlineSyncService.init();
      await offlineSyncService.saveLoan(finalLoan as Loan, true);
    }

    throw error;
  }
};

export const deleteLoan = async (userId: string, loanId: string, isOffline = false) => {
  const isOnline = navigator.onLine;

  try {
    // Always update offline storage first
    await offlineSyncService.init();
    await offlineSyncService.deleteLoan(loanId, !isOnline || isOffline);

    // If online and not explicitly offline, sync with Firebase
    if (isOnline && !isOffline) {
      // First, find and delete any associated transactions
      const transactionsCollection = collection(db, "users", userId, "transactions");
      const q = query(transactionsCollection, orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const transaction = doc.data();
        if (transaction.loanId === loanId) {
          // Delete this transaction as it's linked to the loan being deleted
          await deleteDoc(doc.ref);
        }
      }

      // Then delete the loan itself
      const loanDoc = doc(db, "users", userId, "loans", loanId);
      await deleteDoc(loanDoc);
    }
  } catch (error) {
    console.error("Error deleting loan:", error);

    // If Firebase fails but we're online, save to offline storage
    if (isOnline && !isOffline) {
      await offlineSyncService.init();
      await offlineSyncService.deleteLoan(loanId, true);
    }

    throw error;
  }
};

export const subscribeToLoans = (userId: string, callback: (loans: Loan[]) => void) => {
  const loansCollection = collection(db, "users", userId, "loans");
  const q = query(loansCollection, orderBy("date", "desc"), limit(100));

  return onSnapshot(q, (snapshot) => {
    const loans: Loan[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
        dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate().toISOString() : data.dueDate,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
      } as Loan;
    });
    callback(loans);
  });
};

// Loan payment operations
export const saveLoanPayment = async (userId: string, payment: Omit<LoanPayment, 'id'>, isOffline = false) => {
  const isOnline = navigator.onLine;
  const finalPayment = { ...payment, userId };

  try {
    // Always save to offline storage first
    await offlineSyncService.init();
    const savedPayment = await offlineSyncService.saveLoanPayment(
      { id: '', ...finalPayment } as LoanPayment,
      !isOnline || isOffline
    );

    // If online and not explicitly offline, sync with Firebase
    if (isOnline && !isOffline) {
      const paymentsCollection = collection(db, "users", userId, "loanPayments");
      const docRef = await addDoc(paymentsCollection, {
        ...payment,
        createdAt: Timestamp.now()
      });

      // Update the offline record with the actual ID
      const paymentWithId = { id: docRef.id, ...finalPayment };
      await offlineSyncService.saveLoanPayment(paymentWithId, false);

      // Create corresponding transaction if needed
      // We would need to fetch the loan to determine if it's connected to money
      // This will be handled in the component that calls this function

      return paymentWithId;
    }

    return savedPayment;
  } catch (error) {
    console.error("Error saving loan payment:", error);

    // If Firebase fails but we're online, save to offline storage
    if (isOnline && !isOffline) {
      await offlineSyncService.init();
      return await offlineSyncService.saveLoanPayment(
        { id: '', ...finalPayment } as LoanPayment,
        true
      );
    }

    throw error;
  }
};

export const subscribeToLoanPayments = (userId: string, loanId: string, callback: (payments: LoanPayment[]) => void) => {
  const paymentsCollection = collection(db, "users", userId, "loanPayments");
  const q = query(
    paymentsCollection,
    where("loanId", "==", loanId),
    orderBy("date", "desc"),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const payments: LoanPayment[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      } as LoanPayment;
    });
    callback(payments);
  });
};

// Delete all user data
export const deleteAllUserData = async (userId: string) => {
  try {
    // Delete all transactions
    const transactionsCollection = collection(db, "users", userId, "transactions");
    const transactionsSnapshot = await getDocs(transactionsCollection);
    for (const doc of transactionsSnapshot.docs) {
      await deleteDoc(doc.ref);
    }

    // Delete all categories
    const categoriesCollection = collection(db, "users", userId, "categories");
    const categoriesSnapshot = await getDocs(categoriesCollection);
    for (const doc of categoriesSnapshot.docs) {
      await deleteDoc(doc.ref);
    }

    // Delete all loans
    const loansCollection = collection(db, "users", userId, "loans");
    const loansSnapshot = await getDocs(loansCollection);
    for (const doc of loansSnapshot.docs) {
      await deleteDoc(doc.ref);
    }

    // Delete all loan payments
    const paymentsCollection = collection(db, "users", userId, "loanPayments");
    const paymentsSnapshot = await getDocs(paymentsCollection);
    for (const doc of paymentsSnapshot.docs) {
      await deleteDoc(doc.ref);
    }

    // Delete all advice
    const adviceCollection = collection(db, "users", userId, "advice");
    const adviceSnapshot = await getDocs(adviceCollection);
    for (const doc of adviceSnapshot.docs) {
      await deleteDoc(doc.ref);
    }

    // Clear offline data
    await offlineSyncService.clearOfflineData();

    return { success: true };
  } catch (error) {
    console.error("Error deleting user data:", error);
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
  getDocs,
  updateDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  where,
  startAfter
};
export type { User };
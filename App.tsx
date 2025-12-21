
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Category } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_CURRENCY } from './constants';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import CategoryManager from './components/CategoryManager';
import AIInsights from './components/AIInsights';
import Account from './components/Account';
import Auth from './components/Auth';
import InstallPrompt from './components/InstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import {
  auth,
  onAuthStateChanged,
  User,
  saveTransaction,
  updateTransaction as updateTransactionInFirebase,
  deleteTransaction as deleteTransactionInFirebase,
  subscribeToTransactions,
  subscribeToCategories,
  updateUserSettings,
  initializeUserDocument,
  saveCategory,
  subscribeToUserSettings,
  initializeOfflineSync
} from './services/firebase';
import { useNotifications } from './services/notifications';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'add' | 'categories' | 'insights' | 'account'>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [spendingGoal, setSpendingGoal] = useState<number>(20000);
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Initialize PWA features and notifications
  const { initializeNotifications, cleanup } = useNotifications();

  // Initialize PWA services on app start
  useEffect(() => {
    const initPWA = async () => {
      try {
        // Initialize offline sync service
        await initializeOfflineSync();

        // Initialize push notifications (only if user is logged in)
        if (user) {
          await initializeNotifications();
        }
      } catch (error) {
        console.error('Error initializing PWA features:', error);
      }
    };

    initPWA();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [user, initializeNotifications, cleanup]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Real-time Sync
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCategories(DEFAULT_CATEGORIES);
      setSpendingGoal(20000);
      setCurrency(DEFAULT_CURRENCY);
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);

    // Initialize user document if it doesn't exist
    initializeUserDocument(user.uid, user.email || undefined).catch(console.error);

    let hasLoadedTransactions = false;
    let hasLoadedCategories = false;
    let hasLoadedSettings = false;

    const checkIfAllLoaded = () => {
      if (hasLoadedTransactions && hasLoadedCategories && hasLoadedSettings) {
        setIsDataLoading(false);
      }
    };

    // Subscribe to transactions
    const unsubscribeTransactions = subscribeToTransactions(user.uid, (fetchedTransactions) => {
      setTransactions(fetchedTransactions);
      hasLoadedTransactions = true;
      checkIfAllLoaded();
    });

    // Subscribe to categories
    const unsubscribeCategories = subscribeToCategories(user.uid, (fetchedCategories) => {
      // If user has no custom categories, use defaults
      if (fetchedCategories.length === 0) {
        setCategories(DEFAULT_CATEGORIES);
      } else {
        setCategories(fetchedCategories);
      }
      hasLoadedCategories = true;
      checkIfAllLoaded();
    });

    // Subscribe to user settings
    const unsubscribeUserSettings = subscribeToUserSettings(user.uid, (settings) => {
      setSpendingGoal(settings.spendingGoal);
      setCurrency(settings.currency);
      hasLoadedSettings = true;
      checkIfAllLoaded();
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeCategories();
      unsubscribeUserSettings();
    };
  }, [user]);

  // Transaction operations
  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    console.log('addTransaction called with:', t);
    console.log('User authenticated:', !!user);
    if (!user) {
      console.log('No user found, returning');
      return;
    }

    try {
      console.log('Calling saveTransaction with userId:', user.uid);
      const result = await saveTransaction(user.uid, t);
      console.log('saveTransaction successful:', result);
      setActiveTab('home');
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Failed to add transaction. Please try again.");
    }
  };

  const updateTransaction = async (updated: Transaction) => {
    if (!user) return;

    try {
      await updateTransactionInFirebase(user.uid, updated.id, updated);
      setEditingTransaction(null);
      setActiveTab('history');
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction. Please try again.");
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransactionInFirebase(user.uid, id);
      } catch (error) {
        console.error("Error deleting transaction:", error);
        alert("Failed to delete transaction. Please try again.");
      }
    }
  };

  const handleSetSpendingGoal = async (goal: number) => {
    if (!user) return;

    try {
      await updateUserSettings(user.uid, { spendingGoal: goal });
    } catch (error) {
      console.error("Error updating spending goal:", error);
      alert("Failed to update spending goal. Please try again.");
    }
  };

  const handleAddCategory = async (c: Omit<Category, 'id'>) => {
    if (!user) return;

    try {
      await saveCategory(user.uid, c);
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category. Please try again.");
    }
  };

  const handleSetCurrency = async (newCurrency: string) => {
    if (!user) return;

    try {
      await updateUserSettings(user.uid, { currency: newCurrency });
    } catch (error) {
      console.error("Error updating currency:", error);
      alert("Failed to update currency. Please try again.");
    }
  };

  const startEditing = (t: Transaction) => {
    setEditingTransaction(t);
    setActiveTab('add');
  };

  const balance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactions]);

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTransactions = transactions.filter(t => new Date(t.date) >= startOfMonth);

    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    
    return { income, expenses, net: income - expenses };
  }, [transactions]);

  if (isAuthLoading) return <div className="flex items-center justify-center h-screen bg-emerald-500 text-white font-bold text-2xl animate-pulse">CashFlow</div>;

  if (!user) return <Auth />;

  return (
    <>
      {/* PWA Components */}
      <InstallPrompt />
      <OfflineIndicator />

      <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 overflow-hidden safe-top">
        <header className="px-6 py-4 bg-white border-b flex justify-between items-center shrink-0">
          <h1 className="text-xl font-bold text-emerald-600 tracking-tight">CashFlow</h1>
          <button
            onClick={() => setActiveTab('account')}
            className="w-8 h-8 rounded-xl overflow-hidden border border-emerald-100 shadow-sm"
          >
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=10b981&color=fff`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {activeTab === 'home' && (
          <Dashboard
            balance={balance}
            stats={currentMonthStats}
            recentTransactions={transactions.slice(0, 5)}
            transactions={transactions}
            categories={categories}
            spendingGoal={spendingGoal}
            setSpendingGoal={handleSetSpendingGoal}
            onEdit={startEditing}
            isLoading={isDataLoading}
            currency={currency}
          />
        )}
        {activeTab === 'history' && (
          <TransactionList
            transactions={transactions}
            categories={categories}
            onDelete={deleteTransaction}
            onEdit={startEditing}
            currency={currency}
          />
        )}
        {activeTab === 'add' && (
          <TransactionForm 
            categories={categories} 
            onSubmit={editingTransaction ? (t) => updateTransaction({ ...t, id: editingTransaction.id } as Transaction) : addTransaction} 
            onCancel={() => {
              setEditingTransaction(null);
              setActiveTab('home');
            }}
            initialData={editingTransaction || undefined}
          />
        )}
        {activeTab === 'categories' && (
          <CategoryManager 
            categories={categories} 
            onAdd={handleAddCategory} 
          />
        )}
        {activeTab === 'insights' && (
          <AIInsights
            transactions={transactions}
            stats={currentMonthStats}
            categories={categories}
            spendingGoal={spendingGoal}
            currency={currency}
          />
        )}
        {activeTab === 'account' && (
          <Account user={user} currency={currency} setCurrency={handleSetCurrency} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t safe-bottom z-50 max-w-md mx-auto">
        <div className="flex justify-around items-center h-16">
          <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon="🏠" label="Home" />
          <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon="📜" label="History" />
          
          <button 
            onClick={() => { setEditingTransaction(null); setActiveTab('add'); }}
            className="-mt-8 bg-emerald-500 text-white w-14 h-14 rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center text-2xl border-4 border-white active:scale-95 transition-transform"
          >
            +
          </button>

          <NavButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon="✨" label="AI" />
          <NavButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon="👤" label="Me" />
        </div>
      </nav>
      </div>
    </>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400'}`}
  >
    <span className="text-xl">{icon}</span>
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </button>
);

export default App;

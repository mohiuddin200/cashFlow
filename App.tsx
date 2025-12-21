
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Category } from './types';
import { DEFAULT_CATEGORIES } from './constants';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import CategoryManager from './components/CategoryManager';
import AIInsights from './components/AIInsights';
import Account from './components/Account';
import Auth from './components/Auth';
import { auth, onAuthStateChanged, db, doc, setDoc, onSnapshot, User } from './services/firebase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'add' | 'categories' | 'insights' | 'account'>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [spendingGoal, setSpendingGoal] = useState<number>(20000);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.transactions) setTransactions(data.transactions);
        if (data.categories) setCategories(data.categories);
        if (data.spendingGoal) setSpendingGoal(data.spendingGoal);
      } else {
        // Initialize new user data in Firestore
        setDoc(userDocRef, {
          transactions: [],
          categories: DEFAULT_CATEGORIES,
          spendingGoal: 20000,
          email: user.email,
          updatedAt: new Date().toISOString()
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Push updates to Firestore
  const updateFirestore = async (newData: Partial<{ transactions: Transaction[], categories: Category[], spendingGoal: number }>) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, { ...newData, updatedAt: new Date().toISOString() }, { merge: true });
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    const updated = [newTransaction, ...transactions];
    setTransactions(updated);
    updateFirestore({ transactions: updated });
    setActiveTab('home');
  };

  const updateTransaction = (updated: Transaction) => {
    const newList = transactions.map(t => t.id === updated.id ? updated : t);
    setTransactions(newList);
    updateFirestore({ transactions: newList });
    setEditingTransaction(null);
    setActiveTab('history');
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      updateFirestore({ transactions: updated });
    }
  };

  const handleSetSpendingGoal = (goal: number) => {
    setSpendingGoal(goal);
    updateFirestore({ spendingGoal: goal });
  };

  const handleAddCategory = (c: Omit<Category, 'id'>) => {
    const newCategory = { ...c, id: crypto.randomUUID() };
    const updated = [...categories, newCategory];
    setCategories(updated);
    updateFirestore({ categories: updated });
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
            categories={categories}
            spendingGoal={spendingGoal}
            setSpendingGoal={handleSetSpendingGoal}
            onEdit={startEditing}
          />
        )}
        {activeTab === 'history' && (
          <TransactionList 
            transactions={transactions} 
            categories={categories} 
            onDelete={deleteTransaction}
            onEdit={startEditing}
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
          />
        )}
        {activeTab === 'account' && (
          <Account user={user} />
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

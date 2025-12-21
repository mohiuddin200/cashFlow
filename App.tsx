
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Category } from './types';
import { DEFAULT_CATEGORIES, STORAGE_KEY } from './constants';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import CategoryManager from './components/CategoryManager';
import AIInsights from './components/AIInsights';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'add' | 'categories' | 'insights'>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [spendingGoal, setSpendingGoal] = useState<number>(20000);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setTransactions(parsed.transactions || []);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.spendingGoal) setSpendingGoal(parsed.spendingGoal);
      } catch (e) {
        console.error("Failed to parse stored data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, categories, spendingGoal }));
    }
  }, [transactions, categories, spendingGoal, isLoaded]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev]);
    setActiveTab('home');
  };

  const updateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTransaction(null);
    setActiveTab('history');
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const startEditing = (t: Transaction) => {
    setEditingTransaction(t);
    setActiveTab('add');
  };

  const addCategory = (c: Omit<Category, 'id'>) => {
    const newCategory = { ...c, id: crypto.randomUUID() };
    setCategories(prev => [...prev, newCategory]);
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

  if (!isLoaded) return <div className="flex items-center justify-center h-screen bg-emerald-500 text-white font-bold text-2xl tracking-tighter">CashFlow</div>;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 overflow-hidden safe-top">
      <header className="px-6 py-4 bg-white border-b flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold text-emerald-600 tracking-tight">CashFlow</h1>
        <div className="bg-emerald-100 px-3 py-1 rounded-full">
          <span className="text-xs font-semibold text-emerald-700">Cash Only</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {activeTab === 'home' && (
          <Dashboard 
            balance={balance} 
            stats={currentMonthStats} 
            recentTransactions={transactions.slice(0, 5)} 
            categories={categories}
            spendingGoal={spendingGoal}
            setSpendingGoal={setSpendingGoal}
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
            onAdd={addCategory} 
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
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t safe-bottom z-50 max-w-md mx-auto">
        <div className="flex justify-around items-center h-16">
          <NavButton active={activeTab === 'home'} onClick={() => { setEditingTransaction(null); setActiveTab('home'); }} icon="🏠" label="Home" />
          <NavButton active={activeTab === 'history'} onClick={() => { setEditingTransaction(null); setActiveTab('history'); }} icon="📜" label="History" />
          
          <button 
            onClick={() => { setEditingTransaction(null); setActiveTab('add'); }}
            className="-mt-8 bg-emerald-500 text-white w-14 h-14 rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center text-2xl border-4 border-white active:scale-95 transition-transform"
          >
            +
          </button>

          <NavButton active={activeTab === 'insights'} onClick={() => { setEditingTransaction(null); setActiveTab('insights'); }} icon="✨" label="AI" />
          <NavButton active={activeTab === 'categories'} onClick={() => { setEditingTransaction(null); setActiveTab('categories'); }} icon="🏷️" label="Types" />
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

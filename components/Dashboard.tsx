
import React, { useState } from 'react';
import { Transaction, Category, MonthlyStats } from '../types';

interface DashboardProps {
  balance: number;
  stats: MonthlyStats;
  recentTransactions: Transaction[];
  categories: Category[];
  spendingGoal: number;
  setSpendingGoal: (goal: number) => void;
  onEdit: (t: Transaction) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ balance, stats, recentTransactions, categories, spendingGoal, setSpendingGoal, onEdit }) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(spendingGoal.toString());

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'BDT',
      currencyDisplay: 'symbol' 
    }).format(val);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal = parseFloat(goalInput);
    if (!isNaN(newGoal) && newGoal > 0) {
      setSpendingGoal(newGoal);
      setIsEditingGoal(false);
    }
  };

  const progressPercentage = Math.min((stats.expenses / spendingGoal) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl">
        <p className="text-sm opacity-80 font-medium">Total Cash Balance</p>
        <h2 className="text-4xl font-bold mt-1 tracking-tight">{formatCurrency(balance)}</h2>
        
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] uppercase opacity-80 tracking-widest font-bold text-emerald-50">Income (Month)</p>
            <p className="text-lg font-bold">{formatCurrency(stats.income)}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] uppercase opacity-80 tracking-widest font-bold text-emerald-50">Expense (Month)</p>
            <p className="text-lg font-bold">{formatCurrency(stats.expenses)}</p>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Monthly Budget</h3>
          {!isEditingGoal ? (
            <button 
              onClick={() => setIsEditingGoal(true)}
              className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase transition-colors active:bg-emerald-100"
            >
              ✏️ Set Goal
            </button>
          ) : (
            <form onSubmit={handleGoalSubmit} className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
              <input 
                autoFocus
                type="number" 
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-24 px-3 py-1.5 text-xs border border-emerald-100 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700 shadow-inner"
              />
              <button type="submit" className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold shadow-md active:scale-95 transition-transform">OK</button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Spending Progress</span>
          <span className="text-xs text-gray-500 font-bold">Goal: {formatCurrency(spendingGoal)}</span>
        </div>

        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full transition-all duration-1000 ${stats.expenses > spendingGoal ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase">
            {progressPercentage.toFixed(0)}% Consumed
          </p>
          <p className="text-[10px] font-bold uppercase text-gray-500">
            {stats.expenses > spendingGoal 
              ? `Exceeded by ${formatCurrency(stats.expenses - spendingGoal)}` 
              : `Remaining: ${formatCurrency(spendingGoal - stats.expenses)}`}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <p className="text-4xl mb-2">🍃</p>
              <p className="text-xs font-bold uppercase tracking-widest">No transactions yet</p>
            </div>
          ) : (
            recentTransactions.map(t => {
              const category = categories.find(c => c.id === t.categoryId);
              return (
                <div 
                  key={t.id} 
                  onClick={() => onEdit(t)}
                  className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-50 active:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mr-4 ${category?.color || 'bg-gray-200'} text-white shadow-sm`}>
                    {category?.icon || '❓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{t.note || category?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className={`text-right font-bold ml-2 ${t.type === 'income' ? 'text-emerald-500' : 'text-gray-800'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

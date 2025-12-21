
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
    return new Intl.NumberFormat('en-BD', { 
      style: 'currency', 
      currency: 'BDT',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0
    }).format(val).replace('BDT', '৳');
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
  
  // Calculate Daily Budget
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(lastDay - now.getDate() + 1, 1);
  const remainingBudget = Math.max(spendingGoal - stats.expenses, 0);
  const dailyLimit = remainingBudget / daysLeft;

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[32px] p-7 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <p className="text-xs opacity-75 font-bold uppercase tracking-widest relative z-10">Total Cash Balance</p>
        <h2 className="text-4xl font-black mt-1 tracking-tight relative z-10">{formatCurrency(balance)}</h2>
        
        <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <p className="text-[9px] uppercase opacity-70 tracking-widest font-black">Monthly Income</p>
            <p className="text-xl font-bold">{formatCurrency(stats.income)}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <p className="text-[9px] uppercase opacity-70 tracking-widest font-black">Monthly Spent</p>
            <p className="text-xl font-bold">{formatCurrency(stats.expenses)}</p>
          </div>
        </div>
      </div>

      {/* Daily Budget Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex flex-col justify-center">
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Daily Limit Left</p>
          <p className="text-lg font-bold text-gray-800">{formatCurrency(dailyLimit)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-3xl border border-purple-100 flex flex-col justify-center">
          <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Days Remaining</p>
          <p className="text-lg font-bold text-gray-800">{daysLeft} Days</p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Budget Tracker</h3>
          {!isEditingGoal ? (
            <button 
              onClick={() => setIsEditingGoal(true)}
              className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl uppercase transition-all active:scale-95"
            >
              Set Limit
            </button>
          ) : (
            <form onSubmit={handleGoalSubmit} className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
              <input 
                autoFocus
                type="number" 
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-24 px-3 py-1.5 text-xs border border-emerald-100 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700"
              />
              <button type="submit" className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold shadow-sm">OK</button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-gray-700">Monthly Usage</span>
          <span className="text-xs text-gray-400 font-bold">{formatCurrency(stats.expenses)} / {formatCurrency(spendingGoal)}</span>
        </div>

        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden shadow-inner p-1">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${stats.expenses > spendingGoal ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <p className="text-[10px] text-gray-400 font-black uppercase">
            {progressPercentage.toFixed(0)}% Used
          </p>
          <p className={`text-[10px] font-black uppercase ${stats.expenses > spendingGoal ? 'text-red-500' : 'text-emerald-600'}`}>
            {stats.expenses > spendingGoal 
              ? `Exceeded by ${formatCurrency(stats.expenses - spendingGoal)}` 
              : `Available: ${formatCurrency(spendingGoal - stats.expenses)}`}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="pb-4">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-black text-gray-800">Latest History</h3>
          <button className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">View All</button>
        </div>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-[32px] border-2 border-dashed border-gray-100">
              <p className="text-4xl mb-2">🌱</p>
              <p className="text-[10px] font-black uppercase tracking-widest">No transactions yet</p>
            </div>
          ) : (
            recentTransactions.map(t => {
              const category = categories.find(c => c.id === t.categoryId);
              return (
                <div 
                  key={t.id} 
                  onClick={() => onEdit(t)}
                  className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-50 active:bg-gray-50 transition-all cursor-pointer hover:shadow-md"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mr-4 ${category?.color || 'bg-gray-200'} text-white shadow-sm`}>
                    {category?.icon || '❓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate leading-tight">{t.note || category?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{category?.name} • {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className={`text-right font-black ml-2 ${t.type === 'income' ? 'text-emerald-500' : 'text-gray-800'}`}>
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

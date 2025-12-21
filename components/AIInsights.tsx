
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, MonthlyStats, Category } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface AIInsightsProps {
  transactions: Transaction[];
  stats: MonthlyStats;
  categories: Category[];
  spendingGoal: number;
}

const AIInsights: React.FC<AIInsightsProps> = ({ transactions, stats, categories, spendingGoal }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'BDT',
      currencyDisplay: 'symbol'
    }).format(val);
  };

  const fetchAdvice = async () => {
    setLoading(true);
    const summary = `
      Current Status: Monthly Goal is ${formatCurrency(spendingGoal)}.
      Income: ${formatCurrency(stats.income)}, Expenses: ${formatCurrency(stats.expenses)}, Net: ${formatCurrency(stats.net)}.
      Budget Status: ${stats.expenses > spendingGoal ? 'OVER BUDGET' : 'WITHIN BUDGET'}.
      Total Transactions: ${transactions.length}.
    `;
    const result = await getFinancialAdvice(summary);
    setAdvice(result || 'Keep saving and tracking your cash flow!');
    setLoading(false);
  };

  useEffect(() => {
    if (transactions.length > 0) {
      fetchAdvice();
    }
  }, []);

  const chartData = useMemo(() => {
    const expenseData: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || 'Other';
      expenseData[cat] = (expenseData[cat] || 0) + t.amount;
    });

    return Object.keys(expenseData).map(name => ({
      name,
      value: expenseData[name],
      color: categories.find(c => c.name === name)?.color || 'bg-gray-400'
    }));
  }, [transactions, categories]);

  const colorMap: Record<string, string> = {
    'bg-red-500': '#ef4444',
    'bg-orange-500': '#f97316',
    'bg-yellow-500': '#eab308',
    'bg-green-500': '#22c55e',
    'bg-emerald-500': '#10b981',
    'bg-teal-500': '#14b8a6',
    'bg-blue-500': '#3b82f6',
    'bg-indigo-500': '#6366f1',
    'bg-purple-500': '#a855f7',
    'bg-pink-500': '#ec4899',
    'bg-cyan-500': '#06b6d4'
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">AI Insights</h2>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <span className="text-2xl">💡</span>
        </div>
        <h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-4">Smart Suggestions</h3>
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed font-medium">
            {advice || "Start adding transactions to get personalized financial advice from Gemini."}
          </p>
        )}
        <button 
          onClick={fetchAdvice}
          className="mt-4 text-[10px] font-bold text-gray-400 hover:text-emerald-500 uppercase tracking-widest border-b border-dashed border-gray-200"
        >
          Refresh Insights
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Spending Breakdown</h3>
        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colorMap[entry.color] || '#94a3b8'} />
                  ))}
                </Pie>
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 italic text-sm">
            Not enough expense data to show breakdown
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 pb-4">
        <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Avg. Daily Spend</p>
          <p className="text-lg font-bold mt-1 text-gray-800">{formatCurrency(stats.expenses / 30)}</p>
        </div>
        <div className="bg-purple-50/50 p-5 rounded-3xl border border-purple-100">
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Saving Rate</p>
          <p className="text-lg font-bold mt-1 text-gray-800">
            {stats.income > 0 ? ((stats.net / stats.income) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;

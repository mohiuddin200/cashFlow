
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, MonthlyStats, Category } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { saveFinancialAdvice } from '../services/firebase';
import { User } from 'firebase/auth';

interface AIInsightsProps {
  transactions: Transaction[];
  stats: MonthlyStats;
  categories: Category[];
  spendingGoal: number;
  currency?: string;
  user: User | null;
}

const AIInsights: React.FC<AIInsightsProps> = ({ transactions, stats, categories, spendingGoal, currency = 'BDT', user }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [adviceSaved, setAdviceSaved] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const formatCurrency = (val: number) => {
    const localeMap: { [key: string]: string } = {
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'JPY': 'ja-JP',
      'BDT': 'en-BD',
      'INR': 'en-IN',
      'TRY': 'tr-TR',
      'CAD': 'en-CA',
      'AUD': 'en-AU',
      'CHF': 'de-CH',
      'CNY': 'zh-CN',
      'PKR': 'en-PK',
      'SAR': 'ar-SA',
      'AED': 'ar-AE',
      'BRL': 'pt-BR',
      'RUB': 'ru-RU',
      'KRW': 'ko-KR',
      'SGD': 'en-SG',
      'MYR': 'en-MY',
      'THB': 'th-TH'
    };

    const symbolMap: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'BDT': '৳',
      'INR': '₹',
      'TRY': '₺',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'Fr',
      'CNY': '¥',
      'PKR': '₨',
      'SAR': '﷼',
      'AED': 'د.إ',
      'BRL': 'R$',
      'RUB': '₽',
      'KRW': '₩',
      'SGD': 'S$',
      'MYR': 'RM',
      'THB': '฿'
    };

    const locale = localeMap[currency] || 'en-US';
    const symbol = symbolMap[currency] || '$';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0
    }).format(val).replace(/[A-Z]{3}/, symbol);
  };

  const fetchAdvice = async (saveToFirebase = true) => {
    if (!user) {
      setAdvice("Please sign in to get personalized financial advice.");
      return;
    }

    setLoading(true);
    setAdviceSaved(false);

    try {
      const summary = `
        Current Status: Monthly Goal is ${formatCurrency(spendingGoal)}.
        Income: ${formatCurrency(stats.income)}, Expenses: ${formatCurrency(stats.expenses)}, Net: ${formatCurrency(stats.net)}.
        Budget Status: ${stats.expenses > spendingGoal ? 'OVER BUDGET' : 'WITHIN BUDGET'}.
        Total Transactions: ${transactions.length}.
      `;

      const result = await getFinancialAdvice(summary);
      const adviceText = result || 'Keep saving and tracking your cash flow!';
      setAdvice(adviceText);

      // Save to Firebase if user is authenticated
      if (saveToFirebase && user) {
        await saveFinancialAdvice(user.uid, {
          content: adviceText,
          summary: summary
        });
        setAdviceSaved(true);
      }

      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching advice:', error);
      setAdvice('Unable to fetch advice at the moment. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAdvice();
  };

  useEffect(() => {
    if (transactions.length > 0 && user) {
      fetchAdvice();
    } else if (!user) {
      setAdvice("Please sign in to get personalized financial advice.");
    }
  }, [user]);

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">AI Insights</h2>
        {lastRefreshed && (
          <span className="text-xs text-gray-400">
            {lastRefreshed.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 rounded-3xl shadow-lg border border-emerald-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-60">
          <span className="text-3xl filter drop-shadow-lg">✨</span>
        </div>

        <div className="flex items-start justify-between mb-4">
          <h3 className="text-[11px] font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent uppercase tracking-wider">
            AI-Powered Financial Advice
          </h3>
          {adviceSaved && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Saved
            </span>
          )}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl w-3/4"></div>
            <div className="h-4 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl w-5/6"></div>
            <div className="h-4 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl w-2/3"></div>
            <div className="h-4 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-xl w-4/5"></div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl transform rotate-1 opacity-50"></div>
            <div className="relative bg-white p-4 rounded-2xl shadow-sm border border-emerald-50">
              <p className="text-gray-700 leading-relaxed font-medium text-sm">
                {advice || "Start adding transactions to get personalized financial advice from Gemini."}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[11px] font-bold rounded-full hover:from-emerald-600 hover:to-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Generating...' : 'Refresh'}
          </button>

          {!user && (
            <span className="text-xs text-amber-600 font-medium">
              Sign in to save advice
            </span>
          )}
        </div>
      </div>

      {/* <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-3xl shadow-lg border border-gray-100">
        <h3 className="text-[11px] font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent uppercase tracking-wider mb-6">
          Spending Breakdown
        </h3>
        {chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colorMap[entry.color] || '#94a3b8'} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value, entry: any) => (
                    <span className="text-xs text-gray-600">
                      {value} ({formatCurrency(entry.payload.value)})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
            <span className="text-2xl mb-2 block opacity-40">📊</span>
            <p className="text-gray-400 italic text-sm font-medium">
              Not enough expense data to show breakdown
            </p>
          </div>
        )}
      </div> */}

      <div className="grid grid-cols-2 gap-4 pb-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-3xl border border-blue-100 shadow-md relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">Avg. Daily Spend</p>
          <p className="text-xl font-bold mt-1 bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent">
            {formatCurrency(stats.expenses / 30)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-3xl border border-purple-100 shadow-md relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-2">Saving Rate</p>
          <p className="text-xl font-bold mt-1 bg-gradient-to-r from-purple-800 to-pink-800 bg-clip-text text-transparent">
            {stats.income > 0 ? ((stats.net / stats.income) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;

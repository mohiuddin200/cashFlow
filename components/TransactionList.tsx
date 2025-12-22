
import React from 'react';
import { Transaction, Category } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
  currency?: string;
  selectedMonth?: Date;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, onDelete, onEdit, currency = 'BDT', selectedMonth }) => {
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

  // Filter transactions by selected month
  const filteredTransactions = selectedMonth
    ? transactions.filter(t => {
        const tDate = new Date(t.date);
        const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999);
        return tDate >= monthStart && tDate <= monthEnd;
      })
    : transactions;

  const grouped = filteredTransactions.reduce((groups, t) => {
    const date = t.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(t);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">History</h2>
      
      {sortedDates.length === 0 ? (
        <div className="text-center py-24 text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-100">
          <p className="text-5xl mb-4">💳</p>
          <p className="font-medium">No records yet</p>
        </div>
      ) : (
        sortedDates.map(date => (
          <div key={date}>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">
              {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h3>
            <div className="space-y-3">
              {grouped[date].map(t => {
                const category = categories.find(c => c.id === t.categoryId);
                return (
                  <div key={t.id} className="group bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center transition-all hover:shadow-md">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mr-4 ${category?.color || 'bg-gray-200'}`}>
                      {category?.icon || '❓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{t.note || category?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{category?.name}</p>
                    </div>
                    <div className="text-right ml-2 mr-4">
                      <p className={`font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-gray-800'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                    
                    <div className="flex gap-1">
                      <button 
                        onClick={() => onEdit(t)}
                        className="p-2 text-gray-300 hover:text-emerald-500 active:scale-90 transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => onDelete(t.id)}
                        className="p-2 text-gray-300 hover:text-red-500 active:scale-90 transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TransactionList;

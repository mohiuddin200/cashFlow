
import React, { useState, useEffect } from 'react';
import { Category, Transaction, TransactionType } from '../types';
import { parseTransactionPrompt } from '../services/geminiService';

interface TransactionFormProps {
  categories: Category[];
  onSubmit: (t: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  initialData?: Transaction;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, onSubmit, onCancel, initialData }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(initialData?.note || '');
  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCategories = categories.filter(c => c.type === type);

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsParsing(true);
    const result = await parseTransactionPrompt(aiInput, categories);
    setIsParsing(false);
    
    if (result) {
      setType(result.type);
      setAmount(result.amount.toString());
      setNote(result.note);
      const cat = categories.find(c => c.name.toLowerCase() === result.categoryName.toLowerCase() && c.type === result.type);
      if (cat) setCategoryId(cat.id);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }
    if (!categoryId) {
      newErrors.category = 'Please select a category';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    onSubmit({
      amount: parseFloat(amount),
      categoryId,
      date,
      note,
      type
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Edit Transaction' : 'Add Transaction'}</h2>
        <button onClick={onCancel} className="bg-gray-100 hover:bg-gray-200 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
          <span className="text-xl font-medium">&times;</span>
        </button>
      </div>

      {/* AI Parsing Quick Entry */}
      {!initialData && (
        <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
          <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block mb-2 px-1">Smart AI Entry</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. Spent 150 on lunch today"
              className="flex-1 bg-white border border-emerald-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-gray-700"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
            />
            <button 
              type="button"
              onClick={handleAiParse}
              disabled={isParsing}
              className="bg-emerald-600 text-white w-12 rounded-2xl text-lg flex items-center justify-center shadow-lg shadow-emerald-100 disabled:opacity-50"
            >
              {isParsing ? '...' : '✨'}
            </button>
          </div>
        </div>
      )}

      {/* Toggle */}
      <div className="flex bg-gray-100 p-1.5 rounded-3xl">
        <button 
          className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${type === 'expense' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
          onClick={() => { setType('expense'); if(!initialData) setCategoryId(''); }}
        >
          Expense
        </button>
        <button 
          className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${type === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400'}`}
          onClick={() => { setType('income'); if(!initialData) setCategoryId(''); }}
        >
          Income
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">Amount</label>
          <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-300 group-focus-within:text-emerald-500 transition-colors">৳</span>
            <input 
              type="number" 
              step="0.01"
              placeholder="0.00"
              className={`w-full pl-10 pr-5 py-5 rounded-3xl border-2 transition-all text-2xl font-bold focus:outline-none shadow-sm text-gray-800 ${errors.amount ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-gray-50 bg-white focus:border-emerald-500'}`}
              value={amount}
              onChange={e => {
                setAmount(e.target.value);
                if (errors.amount) setErrors({...errors, amount: ''});
              }}
            />
          </div>
          {errors.amount && <p className="text-red-500 text-xs mt-2 ml-1 font-medium">{errors.amount}</p>}
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5 ml-1">Category</label>
          <div className="grid grid-cols-4 gap-3">
            {filteredCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoryId(cat.id);
                  if (errors.category) setErrors({...errors, category: ''});
                }}
                className={`flex flex-col items-center p-3 rounded-2xl transition-all border-2 ${categoryId === cat.id ? 'border-emerald-500 bg-emerald-50 shadow-md scale-105' : 'border-transparent bg-white shadow-sm hover:bg-gray-50'}`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-tight truncate w-full text-center text-gray-600">{cat.name}</span>
              </button>
            ))}
          </div>
          {errors.category && <p className="text-red-500 text-xs mt-2 ml-1 font-medium">{errors.category}</p>}
        </div>

        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">Date</label>
            <input 
              type="date" 
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-white focus:border-emerald-500 focus:outline-none font-medium shadow-sm transition-all text-gray-700"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">Note (Optional)</label>
            <input 
              type="text" 
              placeholder="What was this for?"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-white focus:border-emerald-500 focus:outline-none font-medium shadow-sm transition-all text-gray-700"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        <button 
          type="submit"
          className={`w-full py-5 text-white font-bold rounded-3xl shadow-xl transition-all active:scale-[0.98] ${type === 'income' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-gray-800 shadow-gray-200'}`}
        >
          {initialData ? 'Update Transaction' : 'Save Transaction'}
        </button>
        
        {initialData && (
          <button 
            type="button" 
            onClick={onCancel}
            className="w-full py-4 text-gray-500 font-bold hover:text-gray-800 transition-colors"
          >
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
};

export default TransactionForm;

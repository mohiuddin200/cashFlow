
import React, { useState, useRef } from 'react';
import { Category, Transaction, TransactionType } from '../types';
import { parseTransactionPrompt, parseReceiptImage } from '../services/geminiService';

interface TransactionFormProps {
  categories: Category[];
  onSubmit: (t: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  initialData?: Transaction;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, onSubmit, onCancel, onDelete, initialData }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(initialData?.note || '');
  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const filteredCategories = categories.filter(c => c.type === type);

  console.log('TransactionForm state:', {
    amount,
    categoryId,
    date,
    note,
    type,
    errors,
    filteredCategoriesCount: filteredCategories.length
  });

  const applyParsingResult = (result: any) => {
    if (result) {
      if (result.type) setType(result.type);
      if (result.amount) setAmount(result.amount.toString());
      if (result.note) setNote(result.note);
      
      const cat = categories.find(c => 
        c.name.toLowerCase() === result.categoryName?.toLowerCase() && 
        c.type === (result.type || type)
      );
      if (cat) setCategoryId(cat.id);
    }
  };

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsParsing(true);
    const result = await parseTransactionPrompt(aiInput, categories);
    setIsParsing(false);
    applyParsingResult(result);
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiInput(transcript);
      // Auto-trigger parsing
      setIsParsing(true);
      parseTransactionPrompt(transcript, categories).then(result => {
        applyParsingResult(result);
        setIsParsing(false);
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const result = await parseReceiptImage(base64, file.type, categories);
      applyParsingResult(result);
      setIsParsing(false);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!categoryId) {
      newErrors.category = 'Please select a category';
    }
    setErrors(newErrors);
    console.log('Validation errors found:', newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', { amount, categoryId, date, note, type });

    if (!validate()) {
      console.log('Form validation failed, returning early');
      return;
    }

    console.log('Form validation passed, calling onSubmit');
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
        <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Edit Details' : 'Add New'}</h2>
        <button onClick={onCancel} className="bg-gray-100 hover:bg-gray-200 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
          <span className="text-xl font-medium">&times;</span>
        </button>
      </div>

      {!initialData && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-3xl border border-emerald-100 shadow-sm">
          <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block mb-2 px-1">Smart AI Entry</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="e.g. Spent 150 on lunch"
                className="w-full bg-white border border-emerald-200 rounded-2xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-gray-700"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
              />
              <button 
                type="button"
                onClick={handleVoiceInput}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-emerald-500 hover:bg-emerald-50'}`}
              >
                {isRecording ? '⏹' : '🎤'}
              </button>
            </div>
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-emerald-200 text-emerald-600 w-12 rounded-2xl text-lg flex items-center justify-center shadow-sm hover:bg-emerald-50 active:scale-95 transition-all"
            >
              📷
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect} 
            />

            <button 
              type="button"
              onClick={handleAiParse}
              disabled={isParsing || !aiInput.trim()}
              className="bg-emerald-600 text-white w-12 rounded-2xl text-lg flex items-center justify-center shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-95 transition-all"
            >
              {isParsing ? '⏳' : '✨'}
            </button>
          </div>
          {isParsing && <p className="text-[9px] text-emerald-600 font-bold mt-2 animate-pulse uppercase text-center tracking-widest">Gemini is analyzing...</p>}
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
          {errors.amount && <p className="text-red-500 text-[10px] mt-2 ml-1 font-bold uppercase">{errors.amount}</p>}
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5 ml-1">Category</label>
          <div className="grid grid-cols-4 gap-3">
            {filteredCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  console.log('Category selected:', cat.name, 'with ID:', cat.id);
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
          {errors.category && <p className="text-red-500 text-[10px] mt-2 ml-1 font-bold uppercase">{errors.category}</p>}
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

        <div className="flex gap-3">
          {initialData && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-6 py-5 bg-red-500 text-white font-bold rounded-3xl shadow-xl transition-all active:scale-[0.98] hover:bg-red-600"
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            className={`flex-1 py-5 text-white font-bold rounded-3xl shadow-xl transition-all active:scale-[0.98] ${type === 'income' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-gray-800 shadow-gray-200'}`}
          >
            {initialData ? 'Update Transaction' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;

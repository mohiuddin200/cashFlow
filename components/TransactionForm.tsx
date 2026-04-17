
import React, { useState, useRef } from 'react';
import { Category, Transaction, TransactionType } from '../types';
import { getAiErrorMessage, parseTransactionPrompt } from '../services/geminiService';

interface TransactionFormProps {
  categories: Category[];
  onSubmit: (t: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  initialData?: Transaction;
  onCreateCategory?: (c: Omit<Category, 'id'>) => void;
  onNavigateToCategories?: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, onSubmit, onCancel, onDelete, initialData, onCreateCategory, onNavigateToCategories }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(initialData?.note || '');
  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiError, setAiError] = useState('');

  // Category creation modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🔖');
  const [catColor, setCatColor] = useState('bg-emerald-500');

  const catColors = [
    'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
    'bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'
  ];

  const recognitionRef = useRef<any>(null);

  const filteredCategories = categories.filter(c => c.type === type);

  const applyParsingResult = (result: any) => {
    if (result) {
      if (result.type) setType(result.type);
      if (result.amount) setAmount(result.amount.toString());

      // Use AI-generated title for both note and input field
      if (result.note) {
        setNote(result.note);
        // Update the input field with the AI-generated clean title
        setAiInput(result.note);
      }

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
    setAiError('');

    try {
      const result = await parseTransactionPrompt(aiInput, categories);
      applyParsingResult(result);

      if (!result) {
        setAiError('AI could not understand that entry. Try a clearer sentence like "Spent 350 on groceries".');
      }
    } catch (error) {
      setAiError(getAiErrorMessage(error));
    } finally {
      setIsParsing(false);
    }
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
      setAiError('');
      parseTransactionPrompt(transcript, categories).then(result => {
        applyParsingResult(result);
        if (!result) {
          setAiError('AI could not understand that voice entry. Try again with amount and category in one sentence.');
        }
      }).catch(error => {
        setAiError(getAiErrorMessage(error));
      }).finally(() => {
        setIsParsing(false);
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
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
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCategory = () => {
    if (!catName.trim()) {
      alert('Please enter a category name');
      return;
    }

    onCreateCategory?.({
      name: catName.trim(),
      icon: catIcon,
      type,
      color: catColor
    });

    // Reset modal state
    setCatName('');
    setCatIcon('🔖');
    setCatColor('bg-emerald-500');
    setShowCategoryModal(false);
  };

  const openCategoryModal = () => {
    setCatName('');
    setCatIcon('🔖');
    setCatColor('bg-emerald-500');
    setShowCategoryModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

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
              onClick={handleAiParse}
              disabled={isParsing || !aiInput.trim()}
              className="bg-emerald-600 text-white w-12 rounded-2xl text-lg flex items-center justify-center shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-95 transition-all"
            >
              {isParsing ? '⏳' : '✨'}
            </button>
          </div>
          {isParsing && <p className="text-[9px] text-emerald-600 font-bold mt-2 animate-pulse uppercase text-center tracking-widest">DeepSeek is analyzing...</p>}
          {aiError && (
            <p className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700">
              {aiError}
            </p>
          )}
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

          {/* Create Category Button */}
          {onCreateCategory && (
            <button
              type="button"
              onClick={openCategoryModal}
              className="w-full py-3 border-2 mt-4 border-dashed border-emerald-300 rounded-2xl text-emerald-600 font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
            >
              <span>+ Create New Category</span>
            </button>
          )}

          {/* View All Categories Button */}
          {onNavigateToCategories && (
            <button
              type="button"
              onClick={onNavigateToCategories}
              className="w-full py-2 mt-4 text-gray-400 font-bold text-xs hover:text-gray-600 transition-all"
            >
              View All Categories →
            </button>
          )}

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

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 safe-top safe-bottom">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Create Category</h3>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-medium"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  placeholder="e.g. Groceries"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Icon</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-center text-2xl"
                  value={catIcon}
                  onChange={e => setCatIcon(e.target.value)}
                  maxLength={2}
                  placeholder="e.g. 🛒"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2.5 ml-1">Color</label>
                <div className="flex flex-wrap gap-2 justify-between bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  {catColors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCatColor(c)}
                      className={`w-8 h-8 rounded-full ${c} transition-all ${catColor === c ? 'ring-4 ring-offset-2 ring-emerald-500 scale-110' : 'opacity-80 hover:opacity-100 hover:scale-110'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TransactionForm);

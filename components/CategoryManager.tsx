
import React, { useState } from 'react';
import { Category, TransactionType } from '../types';

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (c: Omit<Category, 'id'>) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAdd }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🔖');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState('bg-emerald-500');

  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 
    'bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), icon, type, color });
    setName('');
    setIcon('🔖');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${showAdd ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'}`}
        >
          {showAdd ? 'Cancel' : '+ New Type'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl shadow-emerald-900/5 border border-gray-50 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Type Name</label>
            <input 
              type="text" 
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-white focus:border-emerald-500 focus:outline-none font-medium shadow-sm transition-all"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Internet Bill"
              required
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Icon</label>
              <input 
                type="text" 
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-white focus:border-emerald-500 focus:outline-none text-center text-xl shadow-sm transition-all"
                value={icon}
                onChange={e => setIcon(e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Modality</label>
              <select 
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-white focus:border-emerald-500 focus:outline-none font-bold text-sm shadow-sm transition-all appearance-none"
                value={type}
                onChange={e => setType(e.target.value as TransactionType)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2.5 ml-1">Theme Color</label>
            <div className="flex flex-wrap gap-2.5 justify-between bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full ${c} transition-all ${color === c ? 'ring-4 ring-offset-2 ring-emerald-500 scale-110' : 'opacity-80 hover:opacity-100 hover:scale-110'}`}
                />
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all"
          >
            Create Category
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 gap-3">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-50 flex items-center hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mr-3 ${cat.color} text-white`}>
              {cat.icon}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-800 truncate">{cat.name}</p>
              <p className="text-[9px] uppercase text-gray-400 font-bold tracking-widest">{cat.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;

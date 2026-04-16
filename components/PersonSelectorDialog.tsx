import React, { useMemo, useState } from 'react';
import { Loan } from '../types';
import { formatCurrency } from '../utils/currency';

interface PersonSelectorDialogProps {
  isOpen: boolean;
  loans: Loan[];
  currency: string;
  onSelect: (personName: string) => void;
  onCancel: () => void;
}

interface PersonSummary {
  name: string;
  count: number;
  net: number;
}

const PersonSelectorDialog: React.FC<PersonSelectorDialogProps> = ({
  isOpen,
  loans,
  currency,
  onSelect,
  onCancel,
}) => {
  const [query, setQuery] = useState('');

  const people: PersonSummary[] = useMemo(() => {
    const map = new Map<string, PersonSummary>();
    for (const loan of loans) {
      const key = loan.personName.trim();
      if (!key) continue;
      const existing = map.get(key) ?? { name: key, count: 0, net: 0 };
      existing.count += 1;
      existing.net +=
        loan.direction === 'given' ? loan.remainingAmount : -loan.remainingAmount;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [loans]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(p => p.name.toLowerCase().includes(q));
  }, [people, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 safe-top safe-bottom">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Share loans of…</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search person…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              {people.length === 0 ? 'No loans to share yet' : 'No matches'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map(p => (
                <li key={p.name}>
                  <button
                    onClick={() => onSelect(p.name)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.count} loan{p.count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          p.net >= 0 ? 'text-emerald-700' : 'text-orange-700'
                        }`}
                      >
                        {p.net >= 0 ? '+' : '-'}
                        {formatCurrency(Math.abs(p.net), currency)}
                      </p>
                      <p className="text-xs text-gray-400">net</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonSelectorDialog;

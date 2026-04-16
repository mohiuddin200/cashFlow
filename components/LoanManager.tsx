import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loan, LoanDirection } from '../types';
import { formatCurrency } from '../utils/currency';
import { shareLoanCard } from '../utils/shareLoan';
import LoanCard from './LoanCard';
import LoanForm from './LoanForm';
import PersonSelectorDialog from './PersonSelectorDialog';
import ShareableLoanCard from './ShareableLoanCard';

interface LoanManagerProps {
  loans: Loan[];
  onAddLoan: (loan: any) => void;
  onUpdateLoan: (loan: Loan) => void;
  onDeleteLoan: (id: string) => void;
  onAddPayment: (payment: any) => void;
  currency: string;
}

const LoanManager: React.FC<LoanManagerProps> = ({
  loans,
  onAddLoan,
  onUpdateLoan,
  onDeleteLoan,
  onAddPayment,
  currency
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'given' | 'taken'>('all');
  const [showPersonShare, setShowPersonShare] = useState(false);
  const [sharePersonName, setSharePersonName] = useState<string | null>(null);
  const [isSharingPerson, setIsSharingPerson] = useState(false);
  const personShareRef = useRef<HTMLDivElement>(null);

  const personLoans = useMemo(
    () => (sharePersonName ? loans.filter(l => l.personName === sharePersonName) : []),
    [loans, sharePersonName]
  );

  useEffect(() => {
    if (!sharePersonName || personLoans.length === 0 || isSharingPerson) return;
    let cancelled = false;
    setIsSharingPerson(true);
    // Wait a frame so the off-screen render commits before capture.
    const raf = requestAnimationFrame(async () => {
      try {
        await shareLoanCard(
          personShareRef.current,
          `loans-${sharePersonName}`,
          `Loans with ${sharePersonName}`
        );
      } catch (err) {
        console.error('Failed to share person loans', err);
      } finally {
        if (!cancelled) {
          setSharePersonName(null);
          setIsSharingPerson(false);
        }
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharePersonName]);

  // Calculate statistics
  const totalGiven = loans.filter(l => l.direction === 'given').reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalTaken = loans.filter(l => l.direction === 'taken').reduce((sum, l) => sum + l.remainingAmount, 0);
  const activeLoans = loans.filter(l => l.status === 'active');
  const overdueLoans = loans.filter(l => l.status === 'overdue');

  // Filter loans based on selected filter
  const filteredLoans = loans.filter(loan => {
    if (filter === 'all') return true;
    return loan.direction === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
        <div className="flex items-center space-x-2">
          {loans.length > 0 && (
            <button
              onClick={() => setShowPersonShare(true)}
              disabled={isSharingPerson}
              className="px-3 py-2 border border-emerald-500 text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 active:scale-95 transition-transform text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Share all loans of a person"
            >
              {isSharingPerson ? 'Sharing…' : '📤 By Person'}
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 active:scale-95 transition-transform"
          >
            Add Loan
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Given Out</p>
              <p className="text-blue-900 text-lg font-bold">{formatCurrency(totalGiven, currency)}</p>
            </div>
            <span className="text-2xl">💸</span>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Taken In</p>
              <p className="text-green-900 text-lg font-bold">{formatCurrency(totalTaken, currency)}</p>
            </div>
            <span className="text-2xl">💰</span>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Active</p>
              <p className="text-orange-900 text-lg font-bold">{activeLoans.length}</p>
            </div>
            <span className="text-2xl">📊</span>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Overdue</p>
              <p className="text-red-900 text-lg font-bold">{overdueLoans.length}</p>
            </div>
            <span className="text-2xl">⚠️</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'all', label: 'All Loans' },
          { key: 'given', label: 'Given Out' },
          { key: 'taken', label: 'Taken In' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loans List */}
      {filteredLoans.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <span className="text-4xl mb-4 block">🏦</span>
          <p className="text-gray-600 font-medium">No loans found</p>
          <p className="text-gray-400 text-sm mt-2">
            {filter === 'all'
              ? 'Start tracking loans with friends and family'
              : `No ${filter} loans found`}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
          >
            Add your first loan →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map(loan => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onUpdate={onUpdateLoan}
              onDelete={onDeleteLoan}
              onAddPayment={onAddPayment}
              currency={currency}
            />
          ))}
        </div>
      )}

      {/* Add Loan Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 safe-top safe-bottom">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <LoanForm
              onSubmit={(loan) => {
                onAddLoan(loan);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
              currency={currency}
            />
          </div>
        </div>
      )}

      {/* Person Selector for Share by Person */}
      <PersonSelectorDialog
        isOpen={showPersonShare}
        loans={loans}
        currency={currency}
        onSelect={(name) => {
          setShowPersonShare(false);
          setSharePersonName(name);
        }}
        onCancel={() => setShowPersonShare(false)}
      />

      {/* Off-screen render target for per-person share — only the chosen person's loans */}
      {sharePersonName && personLoans.length > 0 && (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}
        >
          <ShareableLoanCard
            ref={personShareRef}
            variant="person"
            personName={sharePersonName}
            loans={personLoans}
            currency={currency}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(LoanManager);
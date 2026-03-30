import React, { useState } from 'react';
import { Loan } from '../types';
import { formatCurrency, formatDate } from '../utils/currency';
import LoanForm from './LoanForm';
import ConfirmDialog from './ConfirmDialog';
import { getCurrencySymbol } from '../utils/currency';

interface LoanDetailsProps {
  loan: Loan;
  onClose: () => void;
  onUpdate: (loan: Loan) => void;
  onDelete: (id: string) => void;
  onAddPayment: (payment: any) => void;
  currency: string;
}

const LoanDetails: React.FC<LoanDetailsProps> = ({
  loan,
  onClose,
  onUpdate,
  onDelete,
  onAddPayment,
  currency
}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Controlled payment form state (replaces getElementById)
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const progressPercentage = loan.amount > 0 ? (loan.totalPaid / loan.amount) * 100 : 0;
  const isOverdue = loan.dueDate && new Date(loan.dueDate) < new Date() && loan.status === 'active';

  if (showEditForm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 safe-top safe-bottom">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <LoanForm
            initialData={loan}
            currency={currency}
            onSubmit={(updatedLoan) => {
              onUpdate({ ...updatedLoan, id: loan.id } as Loan);
              setShowEditForm(false);
              onClose();
            }}
            onCancel={() => setShowEditForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 safe-top safe-bottom">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Loan Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          {/* Loan Type and Person */}
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-3xl">
              {loan.direction === 'given' ? '💸' : '💰'}
            </span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{loan.personName}</h3>
              {loan.personContact && (
                <p className="text-sm text-gray-500">{loan.personContact}</p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(loan.status)}`}>
              {loan.status}
            </span>
          </div>

          {/* Financial Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(loan.amount, currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(loan.totalPaid, currency)}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Remaining Amount</span>
                <span className={`text-lg font-semibold ${loan.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(loan.remainingAmount, currency)}
                </span>
              </div>

              {/* Progress Bar */}
              {loan.totalPaid > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Start Date</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(loan.date)}</span>
            </div>
            {loan.dueDate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Due Date</span>
                <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(loan.dueDate)}
                  {isOverdue && ' (Overdue)'}
                </span>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg mb-6">
            <div>
              <span className="font-medium text-emerald-900">Money Connection</span>
              <p className="text-xs text-emerald-700">
                {loan.isConnectedToMoney ? 'Affects your balance' : 'Tracked separately'}
              </p>
            </div>
            <span className={loan.isConnectedToMoney ? 'text-emerald-600' : 'text-gray-400'}>
              {loan.isConnectedToMoney ? '✓ Connected' : '○ Disconnected'}
            </span>
          </div>

          {/* Notes */}
          {loan.note && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{loan.note}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {loan.status === 'active' && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="w-full py-2 px-4 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 active:scale-95 transition-transform"
              >
                Add Payment
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowEditForm(true)}
                className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Edit Loan
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2 px-4 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                Delete Loan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form with controlled inputs */}
      {showPaymentForm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add Payment</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const amount = parseFloat(paymentAmount);
              if (amount && amount > 0) {
                onAddPayment({
                  loanId: loan.id,
                  amount,
                  date: paymentDate,
                  note: paymentNote
                });
                setPaymentAmount('');
                setPaymentNote('');
                setShowPaymentForm(false);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {getCurrencySymbol(currency)}
                    </span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Payment note"
                  />
                </div>
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                    className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    Add Payment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Loan"
        message="Are you sure you want to delete this loan? Any linked transactions will also be deleted."
        confirmLabel="Delete"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(loan.id);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default LoanDetails;
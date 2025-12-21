import React, { useState } from 'react';
import { Loan, LoanStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/currency';
import LoanDetails from './LoanDetails';

interface LoanCardProps {
  loan: Loan;
  onUpdate: (loan: Loan) => void;
  onDelete: (id: string) => void;
  onAddPayment: (payment: any) => void;
  currency: string;
}

const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onUpdate,
  onDelete,
  onAddPayment,
  currency
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: LoanStatus) => {
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

  const getStatusIcon = (status: LoanStatus) => {
    switch (status) {
      case 'active':
        return '📊';
      case 'completed':
        return '✅';
      case 'overdue':
        return '⚠️';
      default:
        return '📝';
    }
  };

  const isOverdue = loan.dueDate && new Date(loan.dueDate) < new Date() && loan.status === 'active';

  const progressPercentage = loan.amount > 0 ? (loan.totalPaid / loan.amount) * 100 : 0;

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">
                {loan.direction === 'given' ? '💸' : '💰'}
              </span>
              <h3 className="font-semibold text-gray-900">{loan.personName}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                {getStatusIcon(loan.status)} {loan.status}
              </span>
              {isOverdue && (
                <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50">
                  ⚠️ Overdue
                </span>
              )}
            </div>
            {loan.personContact && (
              <p className="text-sm text-gray-500 mb-2">{loan.personContact}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {loan.isConnectedToMoney && (
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                Connected
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Amount</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(loan.amount, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Remaining</p>
            <p className={`font-semibold ${loan.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {formatCurrency(loan.remainingAmount, currency)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {loan.totalPaid > 0 && (
          <div className="mb-3">
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

        <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
          <span>Started: {formatDate(loan.date)}</span>
          {loan.dueDate && (
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              Due: {formatDate(loan.dueDate)}
            </span>
          )}
        </div>

        {loan.note && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{loan.note}</p>
        )}

        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(true)}
            className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-600 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-sm"
          >
            View Details
          </button>
          {loan.status === 'active' && (
            <button
              onClick={() => {
                // This would open a payment form
                const amount = prompt('Enter payment amount:');
                if (amount && parseFloat(amount) > 0) {
                  onAddPayment({
                    loanId: loan.id,
                    amount: parseFloat(amount),
                    date: new Date().toISOString().split('T')[0],
                    note: ''
                  });
                }
              }}
              className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm"
            >
              Add Payment
            </button>
          )}
        </div>
      </div>

      {/* Loan Details Modal */}
      {showDetails && (
        <LoanDetails
          loan={loan}
          onClose={() => setShowDetails(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddPayment={onAddPayment}
          currency={currency}
        />
      )}
    </>
  );
};

export default LoanCard;
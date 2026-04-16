import React from 'react';
import { Loan } from '../types';
import { formatCurrency, formatDate } from '../utils/currency';

type SingleProps = {
  variant: 'single';
  loan: Loan;
  currency: string;
};

type PersonProps = {
  variant: 'person';
  personName: string;
  loans: Loan[];
  currency: string;
};

type ShareableLoanCardProps = SingleProps | PersonProps;

const directionEmoji = (direction: Loan['direction']) => (direction === 'given' ? '💸' : '💰');
const directionLabel = (direction: Loan['direction']) =>
  direction === 'given' ? 'Given Out' : 'Taken In';

const Wordmark: React.FC = () => (
  <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
    <span>Shared from CashFlow</span>
    <span>{formatDate(new Date().toISOString())}</span>
  </div>
);

const SingleLoanView: React.FC<{ loan: Loan; currency: string }> = ({ loan, currency }) => {
  const progress = loan.amount > 0 ? Math.min(100, (loan.totalPaid / loan.amount) * 100) : 0;

  return (
    <>
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-2xl">{directionEmoji(loan.direction)}</span>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 leading-tight">{loan.personName}</h2>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {directionLabel(loan.direction)}
          </p>
        </div>
      </div>

      {loan.personContact && (
        <p className="text-sm text-gray-600 mb-3">{loan.personContact}</p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
          <p className="font-semibold text-gray-900">{formatCurrency(loan.amount, currency)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Remaining</p>
          <p
            className={`font-semibold ${
              loan.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'
            }`}
          >
            {formatCurrency(loan.remainingAmount, currency)}
          </p>
        </div>
      </div>

      {loan.totalPaid > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Paid</span>
            <span>
              {formatCurrency(loan.totalPaid, currency)} · {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between text-xs text-gray-600 mb-2">
        <span>Started: {formatDate(loan.date)}</span>
        {loan.dueDate && <span>Due: {formatDate(loan.dueDate)}</span>}
      </div>

      {loan.note && (
        <div className="mt-2 p-3 bg-amber-50 rounded-lg text-sm text-gray-700">
          {loan.note}
        </div>
      )}
    </>
  );
};

const PersonLoansView: React.FC<{
  personName: string;
  loans: Loan[];
  currency: string;
}> = ({ personName, loans, currency }) => {
  const totalOwedToUser = loans
    .filter(l => l.direction === 'given')
    .reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalOwedByUser = loans
    .filter(l => l.direction === 'taken')
    .reduce((sum, l) => sum + l.remainingAmount, 0);
  const net = totalOwedToUser - totalOwedByUser;

  return (
    <>
      <div className="mb-3">
        <h2 className="text-lg font-bold text-gray-900 leading-tight">{personName}</h2>
        <p className="text-xs text-gray-500">
          {loans.length} loan{loans.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="space-y-2 mb-3">
        {loans.map(loan => (
          <div
            key={loan.id}
            className="border border-gray-200 rounded-lg p-3 bg-white"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center space-x-2">
                <span className="text-base">{directionEmoji(loan.direction)}</span>
                <span className="text-xs font-medium text-gray-700">
                  {directionLabel(loan.direction)}
                </span>
              </div>
              <span className="text-xs text-gray-500">{formatDate(loan.date)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                Amount: {formatCurrency(loan.amount, currency)}
              </span>
              <span
                className={`font-semibold ${
                  loan.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'
                }`}
              >
                {formatCurrency(loan.remainingAmount, currency)} left
              </span>
            </div>
            {loan.note && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{loan.note}</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg p-3 bg-gray-50 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">They owe</span>
          <span className="font-medium text-emerald-700">
            {formatCurrency(totalOwedToUser, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">You owe</span>
          <span className="font-medium text-orange-700">
            {formatCurrency(totalOwedByUser, currency)}
          </span>
        </div>
        <div className="flex justify-between pt-1 border-t border-gray-200">
          <span className="font-semibold text-gray-900">Net</span>
          <span
            className={`font-semibold ${net >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}
          >
            {net >= 0 ? '+' : '-'}
            {formatCurrency(Math.abs(net), currency)}
          </span>
        </div>
      </div>
    </>
  );
};

const ShareableLoanCard = React.forwardRef<HTMLDivElement, ShareableLoanCardProps>(
  (props, ref) => {
    return (
      <div
        ref={ref}
        className="w-[360px] bg-white rounded-lg p-4 border border-gray-200 font-sans"
      >
        {props.variant === 'single' ? (
          <SingleLoanView loan={props.loan} currency={props.currency} />
        ) : (
          <PersonLoansView
            personName={props.personName}
            loans={props.loans}
            currency={props.currency}
          />
        )}
        <Wordmark />
      </div>
    );
  }
);

ShareableLoanCard.displayName = 'ShareableLoanCard';

export default ShareableLoanCard;

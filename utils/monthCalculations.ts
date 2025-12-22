import { Transaction, Loan } from '../types';

export interface MonthlyStats {
  income: number;
  expenses: number;
  net: number;
}

export interface BalanceResult {
  balance: number;
  stats: MonthlyStats;
}

/**
 * Get the start and end of a month for a given date
 */
export const getMonthRange = (date: Date): { start: Date; end: Date } => {
  const year = date.getFullYear();
  const month = date.getMonth();
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59, 999)
  };
};

/**
 * Calculate cumulative balance up to (but not including) a month
 */
const calculateCumulativeBalanceBeforeMonth = (
  transactions: Transaction[],
  monthStart: Date
): number => {
  const previousTransactions = transactions.filter(
    (t) => new Date(t.date) < monthStart
  );

  return previousTransactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);
};

/**
 * Calculate loan adjustments for loans created on or before the end of the selected month
 */
const calculateLoanAdjustment = (loans: Loan[], monthEnd: Date): number => {
  return loans.reduce((acc, loan) => {
    if (!loan.isConnectedToMoney) return acc;

    const loanDate = new Date(loan.date);
    // Only include loan if it was created on or before the selected month
    if (loanDate <= monthEnd) {
      if (loan.direction === 'given') {
        return acc - loan.amount + loan.totalPaid;
      } else {
        return acc + loan.amount - loan.totalPaid;
      }
    }
    return acc;
  }, 0);
};

/**
 * Calculate balance for a specific month with optional carry-forward
 */
export const calculateMonthBalanceWithCarryForward = (
  transactions: Transaction[],
  loans: Loan[],
  selectedDate: Date,
  carryForwardEnabled: boolean
): BalanceResult => {
  const { start: monthStart, end: monthEnd } = getMonthRange(selectedDate);

  // Get transactions for the selected month
  const monthlyTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return tDate >= monthStart && tDate <= monthEnd;
  });

  // Calculate month stats (income, expenses, net)
  const income = monthlyTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = monthlyTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const net = income - expenses;

  // Calculate balance
  let balance: number;
  if (carryForwardEnabled) {
    // Include previous months' cumulative balance
    const previousBalance = calculateCumulativeBalanceBeforeMonth(
      transactions,
      monthStart
    );
    balance = previousBalance + net;
  } else {
    // Only current month's transactions
    balance = net;
  }

  // Add loan adjustments
  const loanAdjustment = calculateLoanAdjustment(loans, monthEnd);
  balance += loanAdjustment;

  return { balance, stats: { income, expenses, net } };
};

/**
 * Get available months from transactions (past and current only)
 */
export const getAvailableMonths = (transactions: Transaction[]): Date[] => {
  const now = new Date();

  // Get unique month/year combinations from transactions
  const monthsSet = new Set<string>();
  transactions.forEach((t) => {
    const tDate = new Date(t.date);
    if (tDate <= now) {
      // Only past and current
      const key = `${tDate.getFullYear()}-${tDate.getMonth()}`;
      monthsSet.add(key);
    }
  });

  // Always include current month
  const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
  monthsSet.add(currentKey);

  // Convert to Date objects and sort descending (newest first)
  return Array.from(monthsSet)
    .map((key) => {
      const [year, month] = key.split('-').map(Number);
      return new Date(year, month, 1);
    })
    .sort((a, b) => b.getTime() - a.getTime());
};

/**
 * Filter transactions for a specific month
 */
export const filterTransactionsByMonth = (
  transactions: Transaction[],
  selectedDate: Date
): Transaction[] => {
  const { start: monthStart, end: monthEnd } = getMonthRange(selectedDate);
  return transactions.filter((t) => {
    const tDate = new Date(t.date);
    return tDate >= monthStart && tDate <= monthEnd;
  });
};

/**
 * Get recent transactions for a specific month (limited count)
 */
export const getRecentTransactionsForMonth = (
  transactions: Transaction[],
  selectedDate: Date,
  limit: number = 5
): Transaction[] => {
  const monthlyTransactions = filterTransactionsByMonth(transactions, selectedDate);
  return monthlyTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};

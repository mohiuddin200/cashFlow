
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
  type: TransactionType;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  balance: number;
}

export interface MonthlyStats {
  income: number;
  expenses: number;
  net: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export interface UserSettings {
  spendingGoal: number;
  currency: string;
}

export interface FinancialAdvice {
  id: string;
  content: string;
  summary: string;
  createdAt: string;
}

// Loan related types
export type LoanDirection = 'given' | 'taken';
export type LoanStatus = 'active' | 'completed' | 'overdue';

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  personName: string;
  personContact?: string;
  amount: number;
  direction: LoanDirection;
  date: string;
  dueDate?: string;
  status: LoanStatus;
  note?: string;
  isConnectedToMoney: boolean;
  totalPaid: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoanSettings {
  reminderDays: number;
  notificationsEnabled: boolean;
}

// Extended interfaces
export interface UserSettings {
  spendingGoal: number;
  currency: string;
  loanSettings: LoanSettings;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  balance: number;
  loans: Loan[];
  loanPayments: LoanPayment[];
}

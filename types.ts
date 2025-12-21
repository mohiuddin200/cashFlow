
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

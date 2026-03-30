import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
} from 'firebase/firestore';

interface ExportData {
  account: {
    email: string | null;
    spendingGoal: number;
    currency: string;
    carryForwardEnabled: boolean;
    createdAt: string;
  };
  transactions: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  loans: Array<Record<string, unknown>>;
  loanPayments: Array<Record<string, unknown>>;
  advice: Array<Record<string, unknown>>;
  exportedAt: string;
}

async function fetchCollection(userId: string, collectionName: string): Promise<Array<Record<string, unknown>>> {
  const db = getFirestore();
  const snapshot = await getDocs(collection(db, 'users', userId, collectionName));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function exportAllUserData(userId: string): Promise<ExportData> {
  const db = getFirestore();
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data() || {};

  const [transactions, categories, loans, loanPayments, advice] = await Promise.all([
    fetchCollection(userId, 'transactions'),
    fetchCollection(userId, 'categories'),
    fetchCollection(userId, 'loans'),
    fetchCollection(userId, 'loanPayments'),
    fetchCollection(userId, 'advice'),
  ]);

  return {
    account: {
      email: userData.email || null,
      spendingGoal: userData.spendingGoal || 0,
      currency: userData.currency || 'USD',
      carryForwardEnabled: userData.carryForwardEnabled ?? true,
      createdAt: userData.createdAt?.toDate?.()?.toISOString?.() || '',
    },
    transactions,
    categories,
    loans,
    loanPayments,
    advice,
    exportedAt: new Date().toISOString(),
  };
}

export function downloadAsJson(data: ExportData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `cashflow-export-${formatDate()}.json`);
}

export function downloadAsCsv(data: ExportData): void {
  const sections: string[] = [];

  // Transactions CSV
  if (data.transactions.length > 0) {
    sections.push('# Transactions');
    sections.push(arrayToCsv(data.transactions));
  }

  // Loans CSV
  if (data.loans.length > 0) {
    sections.push('\n# Loans');
    sections.push(arrayToCsv(data.loans));
  }

  // Loan Payments CSV
  if (data.loanPayments.length > 0) {
    sections.push('\n# Loan Payments');
    sections.push(arrayToCsv(data.loanPayments));
  }

  // Categories CSV
  if (data.categories.length > 0) {
    sections.push('\n# Categories');
    sections.push(arrayToCsv(data.categories));
  }

  const blob = new Blob([sections.join('\n')], { type: 'text/csv' });
  triggerDownload(blob, `cashflow-export-${formatDate()}.csv`);
}

function arrayToCsv(arr: Array<Record<string, unknown>>): string {
  if (arr.length === 0) return '';
  const headers = Object.keys(arr[0]);
  const rows = arr.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(): string {
  return new Date().toISOString().slice(0, 10);
}

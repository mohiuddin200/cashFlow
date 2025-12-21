import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Transaction, Category, Loan, LoanPayment } from '../types';

interface OfflineDB extends DBSchema {
  transactions: {
    key: string;
    value: {
      data: Transaction;
      status: 'synced' | 'pending' | 'conflict';
      lastModified: number;
    };
    indexes: {
      'by-status': 'synced' | 'pending' | 'conflict';
      'by-date': number;
    };
  };
  categories: {
    key: string;
    value: {
      data: Category;
      status: 'synced' | 'pending' | 'conflict';
      lastModified: number;
    };
    indexes: {
      'by-status': 'synced' | 'pending' | 'conflict';
    };
  };
  loans: {
    key: string;
    value: {
      data: Loan;
      status: 'synced' | 'pending' | 'conflict';
      lastModified: number;
    };
    indexes: {
      'by-status': 'synced' | 'pending' | 'conflict';
      'by-date': number;
    };
  };
  loanPayments: {
    key: string;
    value: {
      data: LoanPayment;
      status: 'synced' | 'pending' | 'conflict';
      lastModified: number;
    };
    indexes: {
      'by-status': 'synced' | 'pending' | 'conflict';
      'by-date': number;
      'by-loan': string;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      operation: 'create' | 'update' | 'delete';
      type: 'transaction' | 'category' | 'loan' | 'loanPayment';
      data: any;
      timestamp: number;
    };
  };
}

class OfflineSyncService {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private syncInProgress = false;

  async init() {
    if (this.db) return;

    this.db = await openDB<OfflineDB>('cashflow-offline', 2, {
      upgrade(db, oldVersion, newVersion) {
        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { keyPath: 'data.id' });
          transactionStore.createIndex('by-status', 'status');
          transactionStore.createIndex('by-date', 'data.date');
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'data.id' });
          categoryStore.createIndex('by-status', 'status');
        }

        // Loans store
        if (!db.objectStoreNames.contains('loans')) {
          const loanStore = db.createObjectStore('loans', { keyPath: 'data.id' });
          loanStore.createIndex('by-status', 'status');
          loanStore.createIndex('by-date', 'data.date');
        }

        // Loan payments store
        if (!db.objectStoreNames.contains('loanPayments')) {
          const loanPaymentStore = db.createObjectStore('loanPayments', { keyPath: 'data.id' });
          loanPaymentStore.createIndex('by-status', 'status');
          loanPaymentStore.createIndex('by-date', 'data.date');
          loanPaymentStore.createIndex('by-loan', 'data.loanId');
        }

        // Sync queue
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      },
    });

    // Set up sync when connection is restored
    window.addEventListener('online', () => {
      this.syncPendingChanges();
    });
  }

  // Transaction methods
  async saveTransaction(transaction: Transaction, isOffline = false) {
    if (!this.db) await this.init();

    const status = isOffline ? 'pending' : 'synced';
    const lastModified = Date.now();

    await this.db!.put('transactions', {
      data: transaction,
      status,
      lastModified,
    });

    if (isOffline) {
      await this.addToSyncQueue({
        operation: transaction.id ? 'update' : 'create',
        type: 'transaction',
        data: transaction,
      });
    }

    return transaction;
  }

  async getTransactions() {
    if (!this.db) await this.init();
    return await this.db!.getAll('transactions');
  }

  async deleteTransaction(transactionId: string, isOffline = false) {
    if (!this.db) await this.init();

    if (isOffline) {
      // Mark as deleted but keep in queue for sync
      await this.addToSyncQueue({
        operation: 'delete',
        type: 'transaction',
        data: { id: transactionId },
      });
    }

    await this.db!.delete('transactions', transactionId);
  }

  // Category methods
  async saveCategory(category: Category, isOffline = false) {
    if (!this.db) await this.init();

    const status = isOffline ? 'pending' : 'synced';
    const lastModified = Date.now();

    await this.db!.put('categories', {
      data: category,
      status,
      lastModified,
    });

    if (isOffline) {
      await this.addToSyncQueue({
        operation: category.id ? 'update' : 'create',
        type: 'category',
        data: category,
      });
    }

    return category;
  }

  async getCategories() {
    if (!this.db) await this.init();
    return await this.db!.getAll('categories');
  }

  async deleteCategory(categoryId: string, isOffline = false) {
    if (!this.db) await this.init();

    if (isOffline) {
      await this.addToSyncQueue({
        operation: 'delete',
        type: 'category',
        data: { id: categoryId },
      });
    }

    await this.db!.delete('categories', categoryId);
  }

  // Loan methods
  async saveLoan(loan: Loan, isOffline = false) {
    if (!this.db) await this.init();

    const status = isOffline ? 'pending' : 'synced';
    const lastModified = Date.now();

    await this.db!.put('loans', {
      data: loan,
      status,
      lastModified,
    });

    if (isOffline) {
      await this.addToSyncQueue({
        operation: loan.id ? 'update' : 'create',
        type: 'loan',
        data: loan,
      });
    }

    return loan;
  }

  async getLoans() {
    if (!this.db) await this.init();
    return await this.db!.getAll('loans');
  }

  async deleteLoan(loanId: string, isOffline = false) {
    if (!this.db) await this.init();

    if (isOffline) {
      await this.addToSyncQueue({
        operation: 'delete',
        type: 'loan',
        data: { id: loanId },
      });
    }

    await this.db!.delete('loans', loanId);
  }

  // Loan payment methods
  async saveLoanPayment(payment: LoanPayment, isOffline = false) {
    if (!this.db) await this.init();

    const status = isOffline ? 'pending' : 'synced';
    const lastModified = Date.now();

    await this.db!.put('loanPayments', {
      data: payment,
      status,
      lastModified,
    });

    if (isOffline) {
      await this.addToSyncQueue({
        operation: payment.id ? 'update' : 'create',
        type: 'loanPayment',
        data: payment,
      });
    }

    return payment;
  }

  async getLoanPayments() {
    if (!this.db) await this.init();
    return await this.db!.getAll('loanPayments');
  }

  async getLoanPaymentsByLoanId(loanId: string) {
    if (!this.db) await this.init();
    return await this.db!.getAllFromIndex('loanPayments', 'by-loan', loanId);
  }

  async deleteLoanPayment(paymentId: string, isOffline = false) {
    if (!this.db) await this.init();

    if (isOffline) {
      await this.addToSyncQueue({
        operation: 'delete',
        type: 'loanPayment',
        data: { id: paymentId },
      });
    }

    await this.db!.delete('loanPayments', paymentId);
  }

  // Sync queue methods
  private async addToSyncQueue(item: Omit<OfflineDB['syncQueue']['value'], 'id' | 'timestamp'>) {
    if (!this.db) await this.init();

    await this.db!.add('syncQueue', {
      ...item,
      timestamp: Date.now(),
    });
  }

  async getPendingSyncItems() {
    if (!this.db) await this.init();
    return await this.db!.getAll('syncQueue');
  }

  async syncPendingChanges() {
    if (this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;

    try {
      const pendingItems = await this.getPendingSyncItems();

      for (const item of pendingItems) {
        try {
          // Here you would sync with Firebase
          // For now, we'll just mark as synced
          await this.processSyncItem(item);
          await this.db!.delete('syncQueue', item.id);
        } catch (error) {
          console.error('Failed to sync item:', error);
          // Keep in queue for retry
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processSyncItem(item: OfflineDB['syncQueue']['value']) {
    // This would integrate with your Firebase service
    // For now, it's a placeholder that would be replaced with actual Firebase calls
    console.log('Processing sync item:', item);

    // Example of how it would work:
    // if (item.type === 'transaction') {
    //   if (item.operation === 'create') {
    //     await firebaseService.addTransaction(item.data);
    //   } else if (item.operation === 'update') {
    //     await firebaseService.updateTransaction(item.data.id, item.data);
    //   } else if (item.operation === 'delete') {
    //     await firebaseService.deleteTransaction(item.data.id);
    //   }
    // }
  }

  // Status methods
  async getSyncStatus() {
    if (!this.db) await this.init();

    const pendingItems = await this.getPendingSyncItems();
    return {
      isOnline: navigator.onLine,
      pendingChanges: pendingItems.length,
      syncInProgress: this.syncInProgress,
    };
  }

  async clearOfflineData() {
    if (!this.db) await this.init();

    const tx = this.db!.transaction(['transactions', 'categories', 'loans', 'loanPayments', 'syncQueue'], 'readwrite');
    await Promise.all([
      tx.objectStore('transactions').clear(),
      tx.objectStore('categories').clear(),
      tx.objectStore('loans').clear(),
      tx.objectStore('loanPayments').clear(),
      tx.objectStore('syncQueue').clear(),
    ]);
  }
}

export const offlineSyncService = new OfflineSyncService();
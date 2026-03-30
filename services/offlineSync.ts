import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Transaction, Category, Loan, LoanPayment } from '../types';
import type { User } from 'firebase/auth';

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
    key: number;
    value: {
      id?: number;
      operation: 'create' | 'update' | 'delete';
      type: 'transaction' | 'category' | 'loan' | 'loanPayment';
      data: any;
      userId: string;
      timestamp: number;
      retryCount?: number;
    };
  };
}

class OfflineSyncService {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private syncInProgress = false;
  private currentUserId: string | null = null;
  private maxRetries = 3;

  setUserId(userId: string | null) {
    this.currentUserId = userId;
  }

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

    // Also delete any transactions linked to this loan
    const allTransactions = await this.getTransactions();
    for (const tx of allTransactions) {
      if (tx.data.loanId === loanId) {
        await this.db!.delete('transactions', tx.data.id);
        // Also add to sync queue if offline
        if (isOffline) {
          await this.addToSyncQueue({
            operation: 'delete',
            type: 'transaction',
            data: { id: tx.data.id },
          });
        }
      }
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
  private async addToSyncQueue(item: Omit<OfflineDB['syncQueue']['value'], 'timestamp' | 'userId'>) {
    if (!this.db) await this.init();

    if (!this.currentUserId) {
      console.error('Cannot add to sync queue: no userId set');
      return;
    }

    await this.db!.add('syncQueue', {
      ...item,
      userId: this.currentUserId,
      timestamp: Date.now(),
      retryCount: 0,
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
          await this.processSyncItem(item);
          // Successfully synced — remove from queue
          if (item.id !== undefined) {
            await this.db!.delete('syncQueue', item.id);
          }
        } catch (error) {
          console.error('Failed to sync item:', error);
          const retryCount = (item.retryCount || 0) + 1;

          if (retryCount >= this.maxRetries && item.id !== undefined) {
            // Max retries exceeded — remove from queue to prevent infinite buildup
            console.error('Max retries exceeded for sync item, removing:', item);
            await this.db!.delete('syncQueue', item.id);
          } else if (item.id !== undefined) {
            // Update retry count with exponential backoff delay
            await this.db!.put('syncQueue', { ...item, retryCount });
          }
          // Stop processing remaining items — will retry on next online event
          break;
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processSyncItem(item: OfflineDB['syncQueue']['value']) {
    // Lazy import to avoid circular dependency
    const firebase = await import('./firebase');
    const userId = item.userId;

    if (!userId) {
      throw new Error('Sync item missing userId');
    }

    switch (item.type) {
      case 'transaction':
        if (item.operation === 'create') {
          const { id: _id, userId: _uid, ...txData } = item.data;
          await firebase.saveTransaction(userId, txData);
        } else if (item.operation === 'update') {
          const { id: txId, userId: _uid2, ...txUpdateData } = item.data;
          if (txId) await firebase.updateTransaction(userId, txId, txUpdateData);
        } else if (item.operation === 'delete') {
          if (item.data.id) await firebase.deleteTransaction(userId, item.data.id);
        }
        break;

      case 'category':
        if (item.operation === 'create') {
          const { id: _cid, userId: _cuid, ...catData } = item.data;
          await firebase.saveCategory(userId, catData);
        } else if (item.operation === 'update') {
          const { id: catId, userId: _cuid2, ...catUpdateData } = item.data;
          if (catId) await firebase.updateCategory(userId, catId, catUpdateData);
        } else if (item.operation === 'delete') {
          if (item.data.id) await firebase.deleteCategory(userId, item.data.id);
        }
        break;

      case 'loan':
        if (item.operation === 'create') {
          const { id: _lid, userId: _luid, ...loanData } = item.data;
          await firebase.saveLoan(userId, loanData);
        } else if (item.operation === 'update') {
          const { id: loanId, userId: _luid2, ...loanUpdateData } = item.data;
          if (loanId) await firebase.updateLoan(userId, loanId, loanUpdateData);
        } else if (item.operation === 'delete') {
          if (item.data.id) await firebase.deleteLoan(userId, item.data.id);
        }
        break;

      case 'loanPayment':
        if (item.operation === 'create') {
          const { id: _pid, userId: _puid, ...paymentData } = item.data;
          await firebase.saveLoanPayment(userId, paymentData);
        } else if (item.operation === 'delete') {
          // Loan payment deletion is handled through loan updates
          console.log('Loan payment delete sync not implemented');
        }
        break;

      default:
        console.warn('Unknown sync item type:', item.type);
    }
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
import React, { useState, useEffect, useMemo } from "react";
import { Transaction, Category, Loan, LoanPayment } from "./types";
import { DEFAULT_CATEGORIES, DEFAULT_CURRENCY } from "./constants";
import Dashboard from "./components/Dashboard";
import TransactionList from "./components/TransactionList";
import TransactionForm from "./components/TransactionForm";
import CategoryManager from "./components/CategoryManager";
import LoanManager from "./components/LoanManager";
import AIInsights from "./components/AIInsights";
import Account from "./components/Account";
import Auth from "./components/Auth";
import InstallPrompt from "./components/InstallPrompt";
import OfflineIndicator from "./components/OfflineIndicator";
import {
  auth,
  onAuthStateChanged,
  User,
  saveTransaction,
  updateTransaction as updateTransactionInFirebase,
  deleteTransaction as deleteTransactionInFirebase,
  subscribeToTransactions,
  subscribeToCategories,
  updateUserSettings,
  initializeUserDocument,
  saveCategory,
  updateCategory,
  deleteCategory,
  reassignCategoryForTransactions,
  subscribeToUserSettings,
  initializeOfflineSync,
  saveLoan,
  updateLoan,
  deleteLoan,
  subscribeToLoans,
  subscribeToLoanPayments,
  saveLoanPayment,
} from "./services/firebase";
import { useNotifications } from "./services/notifications";
import {
  calculateMonthBalanceWithCarryForward,
  getAvailableMonths,
  getRecentTransactionsForMonth,
} from "./utils/monthCalculations";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "home" | "history" | "add" | "categories" | "loans" | "insights"
  >("home");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [spendingGoal, setSpendingGoal] = useState<number>(20000);
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [carryForwardEnabled, setCarryForwardEnabled] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Loan state
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanPayments, setLoanPayments] = useState<LoanPayment[]>([]);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);

  // Initialize PWA features and notifications
  const { initializeNotifications, cleanup } = useNotifications();

  // Register Firebase messaging service worker (PWA service worker is registered automatically)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log(
            "Firebase Messaging Service Worker registered:",
            registration
          );
        })
        .catch((error) => {
          console.log(
            "Firebase Messaging Service Worker registration failed:",
            error
          );
        });
    }
  }, []);

  // Initialize PWA services on app start
  useEffect(() => {
    const initPWA = async () => {
      try {
        // Initialize offline sync service
        await initializeOfflineSync();

        // Initialize push notifications (only if user is logged in and not localhost)
        if (user && window.location.hostname !== "localhost") {
          try {
            await initializeNotifications();
            console.log("Push notifications initialized successfully");
          } catch (error) {
            console.error("Failed to initialize push notifications:", error);
          }
        }
      } catch (error) {
        console.error("Error initializing PWA features:", error);
      }
    };

    initPWA();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [user, initializeNotifications, cleanup]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Real-time Sync
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCategories(DEFAULT_CATEGORIES);
      setSpendingGoal(20000);
      setCurrency(DEFAULT_CURRENCY);
      setLoans([]);
      setLoanPayments([]);
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);

    // Initialize user document if it doesn't exist
    initializeUserDocument(user.uid, user.email || undefined).catch(
      console.error
    );

    let hasLoadedTransactions = false;
    let hasLoadedCategories = false;
    let hasLoadedSettings = false;
    let hasLoadedLoans = false;

    const checkIfAllLoaded = () => {
      if (
        hasLoadedTransactions &&
        hasLoadedCategories &&
        hasLoadedSettings &&
        hasLoadedLoans
      ) {
        setIsDataLoading(false);
      }
    };

    // Subscribe to transactions
    const unsubscribeTransactions = subscribeToTransactions(
      user.uid,
      (fetchedTransactions) => {
        setTransactions(fetchedTransactions);
        hasLoadedTransactions = true;
        checkIfAllLoaded();
      }
    );

    // Subscribe to categories
    const unsubscribeCategories = subscribeToCategories(
      user.uid,
      (fetchedCategories) => {
        // Always include default categories, and add custom categories on top
        // Custom categories override defaults if they have the same ID
        const defaultCategoriesMap = new Map(DEFAULT_CATEGORIES.map(c => [c.id, c]));
        const customCategoriesMap = new Map(fetchedCategories.map(c => [c.id, c]));

        // Merge: start with defaults, then add/override with custom categories
        const mergedCategories = [
          ...DEFAULT_CATEGORIES.filter(c => !customCategoriesMap.has(c.id)),
          ...fetchedCategories
        ];

        setCategories(mergedCategories);
        hasLoadedCategories = true;
        checkIfAllLoaded();
      }
    );

    // Subscribe to user settings
    const unsubscribeUserSettings = subscribeToUserSettings(
      user.uid,
      (settings) => {
        setSpendingGoal(settings.spendingGoal);
        setCurrency(settings.currency);
        setCarryForwardEnabled(settings.carryForwardEnabled);
        hasLoadedSettings = true;
        checkIfAllLoaded();
      }
    );

    // Subscribe to loans
    const unsubscribeLoans = subscribeToLoans(user.uid, (fetchedLoans) => {
      setLoans(fetchedLoans);
      hasLoadedLoans = true;
      checkIfAllLoaded();
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeCategories();
      unsubscribeUserSettings();
      unsubscribeLoans();
    };
  }, [user]);

  // Transaction operations
  const addTransaction = async (t: Omit<Transaction, "id">) => {
    console.log("addTransaction called with:", t);
    console.log("User authenticated:", !!user);
    if (!user) {
      console.log("No user found, returning");
      return;
    }

    try {
      console.log("Calling saveTransaction with userId:", user.uid);
      const result = await saveTransaction(user.uid, t);
      console.log("saveTransaction successful:", result);
      setActiveTab("home");
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Failed to add transaction. Please try again.");
    }
  };

  const updateTransaction = async (updated: Transaction) => {
    if (!user) return;

    try {
      await updateTransactionInFirebase(user.uid, updated.id, updated);
      setEditingTransaction(null);
      setActiveTab("history");
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction. Please try again.");
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransactionInFirebase(user.uid, id);
      } catch (error) {
        console.error("Error deleting transaction:", error);
        alert("Failed to delete transaction. Please try again.");
      }
    }
  };

  const handleSetSpendingGoal = async (goal: number) => {
    if (!user) return;

    try {
      await updateUserSettings(user.uid, { spendingGoal: goal });
    } catch (error) {
      console.error("Error updating spending goal:", error);
      alert("Failed to update spending goal. Please try again.");
    }
  };

  const handleAddCategory = async (c: Omit<Category, "id">) => {
    if (!user) return;

    try {
      await saveCategory(user.uid, c);
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category. Please try again.");
    }
  };

  const handleUpdateCategory = async (id: string, category: Partial<Category>) => {
    if (!user) return;

    try {
      await updateCategory(user.uid, id, category);
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category. Please try again.");
    }
  };

  const handleDeleteCategory = async (id: string, replacementCategoryId?: string) => {
    if (!user) return;

    try {
      // Check if transactions exist with this category
      const transactionsWithCategory = transactions.filter(t => t.categoryId === id);

      if (transactionsWithCategory.length > 0 && !replacementCategoryId) {
        // Show a simple prompt to select a replacement category
        const category = categories.find(c => c.id === id);
        const otherCategories = categories.filter(c => c.id !== id && c.type === category?.type);

        if (otherCategories.length === 0) {
          alert('Cannot delete this category. No other categories available to reassign transactions.');
          return;
        }

        // Create a simple prompt message
        const message = `This category has ${transactionsWithCategory.length} transaction(s).\n\n` +
          `Available replacement categories:\n` +
          otherCategories.map((c, i) => `${i + 1}. ${c.icon} ${c.name}`).join('\n') +
          `\n\nEnter the number of the category to reassign transactions to:`;

        const selection = prompt(message);

        if (selection === null) return; // User cancelled

        const index = parseInt(selection) - 1;
        if (isNaN(index) || index < 0 || index >= otherCategories.length) {
          alert('Invalid selection');
          return;
        }

        replacementCategoryId = otherCategories[index].id;
      }

      if (replacementCategoryId) {
        await reassignCategoryForTransactions(user.uid, id, replacementCategoryId);
      }

      await deleteCategory(user.uid, id);
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  const handleSetCurrency = async (newCurrency: string) => {
    if (!user) return;

    try {
      await updateUserSettings(user.uid, { currency: newCurrency });
    } catch (error) {
      console.error("Error updating currency:", error);
      alert("Failed to update currency. Please try again.");
    }
  };

  const handleSetCarryForward = async (enabled: boolean) => {
    if (!user) return;

    try {
      await updateUserSettings(user.uid, { carryForwardEnabled: enabled });
    } catch (error) {
      console.error("Error updating carry-forward setting:", error);
      alert("Failed to update setting. Please try again.");
    }
  };

  const startEditing = (t: Transaction) => {
    setEditingTransaction(t);
    setActiveTab("add");
  };

  // Loan operations
  const addLoan = async (l: Omit<Loan, "id">) => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      const loanData = {
        ...l,
        totalPaid: 0,
        remainingAmount: l.amount,
        createdAt: now,
        updatedAt: now,
      };

      await saveLoan(user.uid, loanData);
      setActiveTab("loans");
    } catch (error) {
      console.error("Error adding loan:", error);
      alert("Failed to add loan. Please try again.");
    }
  };

  const handleUpdateLoan = async (updated: Loan) => {
    if (!user) return;

    try {
      await updateLoan(user.uid, updated.id, updated);
      setEditingLoan(null);
      setActiveTab("loans");
    } catch (error) {
      console.error("Error updating loan:", error);
      alert("Failed to update loan. Please try again.");
    }
  };

  const handleDeleteLoan = async (id: string) => {
    if (!user) return;

    if (window.confirm("Are you sure you want to delete this loan?")) {
      try {
        await deleteLoan(user.uid, id);
      } catch (error) {
        console.error("Error deleting loan:", error);
        alert("Failed to delete loan. Please try again.");
      }
    }
  };

  const addLoanPayment = async (payment: Omit<LoanPayment, "id">) => {
    if (!user) return;

    try {
      const paymentWithTimestamp = {
        ...payment,
        createdAt: new Date().toISOString(),
      };

      await saveLoanPayment(user.uid, paymentWithTimestamp);

      // Update the loan to reflect the payment
      const loan = loans.find((l) => l.id === payment.loanId);
      if (loan) {
        const newTotalPaid = loan.totalPaid + payment.amount;
        const newRemainingAmount = Math.max(0, loan.amount - newTotalPaid);
        const newStatus =
          newRemainingAmount === 0
            ? "completed"
            : loan.dueDate && new Date() > new Date(loan.dueDate)
            ? "overdue"
            : "active";

        await updateLoan(user.uid, loan.id, {
          totalPaid: newTotalPaid,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error adding loan payment:", error);
      alert("Failed to add loan payment. Please try again.");
    }
  };

  const startEditingLoan = (l: Loan) => {
    setEditingLoan(l);
    setActiveTab("add"); // We'll use the same tab for now
  };

  const balance = useMemo(() => {
    const balanceData = calculateMonthBalanceWithCarryForward(
      transactions,
      loans,
      selectedMonth,
      carryForwardEnabled
    );
    return balanceData.balance;
  }, [transactions, loans, selectedMonth, carryForwardEnabled]);

  const currentMonthStats = useMemo(() => {
    const balanceData = calculateMonthBalanceWithCarryForward(
      transactions,
      loans,
      selectedMonth,
      carryForwardEnabled
    );
    return balanceData.stats;
  }, [transactions, loans, selectedMonth, carryForwardEnabled]);

  const availableMonths = useMemo(() => {
    return getAvailableMonths(transactions);
  }, [transactions]);

  const recentTransactionsForMonth = useMemo(() => {
    return getRecentTransactionsForMonth(transactions, selectedMonth, 5);
  }, [transactions, selectedMonth]);

  if (isAuthLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-emerald-500 text-white font-bold text-2xl animate-pulse">
        CashFlow
      </div>
    );

  if (!user) return <Auth />;

  return (
    <>
      {/* PWA Components */}
      <InstallPrompt />
      <OfflineIndicator />

      <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 overflow-hidden safe-top">
        <header className="px-6 py-4 bg-white border-b flex justify-between items-center shrink-0">
          <h1 className="text-xl font-bold text-emerald-600 tracking-tight">
            CashFlow
          </h1>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-xl overflow-hidden border border-emerald-100 shadow-sm"
          >
            <img
              src={
                user.photoURL ||
                `https://ui-avatars.com/api/?name=${user.email}&background=10b981&color=fff`
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
          {activeTab === "home" && (
            <Dashboard
              balance={balance}
              stats={currentMonthStats}
              recentTransactions={recentTransactionsForMonth}
              transactions={transactions}
              categories={categories}
              spendingGoal={spendingGoal}
              setSpendingGoal={handleSetSpendingGoal}
              onEdit={startEditing}
              isLoading={isDataLoading}
              currency={currency}
              loans={loans}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              availableMonths={availableMonths}
              carryForwardEnabled={carryForwardEnabled}
            />
          )}
          {activeTab === "history" && (
            <TransactionList
              transactions={transactions}
              categories={categories}
              onDelete={deleteTransaction}
              onEdit={startEditing}
              currency={currency}
              selectedMonth={selectedMonth}
            />
          )}
          {activeTab === "add" && (
            <TransactionForm
              categories={categories}
              onSubmit={
                editingTransaction
                  ? (t) =>
                      updateTransaction({
                        ...t,
                        id: editingTransaction.id,
                      } as Transaction)
                  : addTransaction
              }
              onCancel={() => {
                setEditingTransaction(null);
                setActiveTab("home");
              }}
              initialData={editingTransaction || undefined}
              onCreateCategory={handleAddCategory}
              onNavigateToCategories={() => setActiveTab("categories")}
            />
          )}
          {activeTab === "categories" && (
            <CategoryManager
              categories={categories}
              onAdd={handleAddCategory}
              onUpdate={handleUpdateCategory}
              onDelete={handleDeleteCategory}
            />
          )}
          {activeTab === "loans" && (
            <LoanManager
              loans={loans}
              onAddLoan={addLoan}
              onUpdateLoan={handleUpdateLoan}
              onDeleteLoan={handleDeleteLoan}
              onAddPayment={addLoanPayment}
              currency={currency}
            />
          )}
          {activeTab === "insights" && (
            <AIInsights
              transactions={transactions}
              stats={currentMonthStats}
              categories={categories}
              spendingGoal={spendingGoal}
              currency={currency}
              user={user}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 z-40 left-0 right-0 bg-white border-t safe-bottom max-w-md mx-auto">
          <div className="flex justify-around items-center h-16">
            <NavButton
              active={activeTab === "home"}
              onClick={() => setActiveTab("home")}
              icon="🏠"
              label="Home"
            />
            <NavButton
              active={activeTab === "history"}
              onClick={() => setActiveTab("history")}
              icon="📜"
              label="History"
            />

            <button
              onClick={() => {
                setEditingTransaction(null);
                setActiveTab("add");
              }}
              className="-mt-8 bg-emerald-500 text-white w-14 h-14 rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center text-2xl border-4 border-white active:scale-95 transition-transform"
            >
              +
            </button>

            <NavButton
              active={activeTab === "loans"}
              onClick={() => setActiveTab("loans")}
              icon="💸"
              label="Loans"
            />
            <NavButton
              active={activeTab === "insights"}
              onClick={() => setActiveTab("insights")}
              icon="✨"
              label="AI"
            />
          </div>
        </nav>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 safe-top safe-bottom">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ×
                  </button>
                </div>
                <Account
                  user={user}
                  currency={currency}
                  setCurrency={handleSetCurrency}
                  carryForwardEnabled={carryForwardEnabled}
                  setCarryForward={handleSetCarryForward}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({
  active,
  onClick,
  icon,
  label,
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-1 transition-colors ${
      active ? "text-emerald-600" : "text-gray-400"
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="text-[10px] font-medium uppercase tracking-wider">
      {label}
    </span>
  </button>
);

export default App;

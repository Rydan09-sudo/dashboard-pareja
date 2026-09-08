import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import type { 
  Transaction, 
  TransactionScope, 
  TransactionType,
  Account,
  CategoryItem
} from '../../types';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  Tag, 
  Calendar, 
  Wallet, 
  Edit3, 
  Building2, 
  Filter,
  ArrowRightLeft,
  Receipt,
  FolderPlus,
  Repeat
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const DEFAULT_CATEGORIES = [
  'Supermercado', 'Servicios', 'Restaurantes', 'Entretenimiento', 'Transporte', 'Salud', 'Otros'
];

interface FinanceDashboardProps {
  scope: 'all' | 'personal' | 'shared';
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ scope }) => {
  const { user, userProfile, t } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customCategories, setCustomCategories] = useState<CategoryItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Transaction Form State
  const [description, setDescription] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('Supermercado');
  const [transactionScope, setTransactionScope] = useState<TransactionScope>('shared');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');

  // Account Form State
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountScope, setNewAccountScope] = useState<TransactionScope>('personal');

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // Number formatting helper: format numeric string with thousands and decimal separators
  const formatAmountInput = (val: string): string => {
    // Remove all characters except digits and comma/dot
    const clean = val.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    
    // Format integer part with thousand commas or dots
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Only allow at most 2 decimal digits
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return parts.join('.');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Strip commas for parsing
    const numericOnly = rawVal.replace(/,/g, '');
    if (numericOnly === '' || !isNaN(Number(numericOnly)) || numericOnly.endsWith('.')) {
      setAmountRaw(formatAmountInput(numericOnly));
    }
  };

  // Get raw float number from formatted string
  const getNumericAmount = (formatted: string): number => {
    const unformatted = formatted.replace(/,/g, '');
    return parseFloat(unformatted) || 0;
  };

  // Fetch Accounts in real-time
  useEffect(() => {
    if (!user || !userProfile) return;

    let q;
    if (scope === 'personal') {
      q = query(collection(db, 'accounts'), where('uid', '==', user.uid), where('scope', '==', 'personal'));
    } else if (scope === 'shared' && userProfile.coupleId) {
      q = query(collection(db, 'accounts'), where('coupleId', '==', userProfile.coupleId), where('scope', '==', 'shared'));
    } else if (userProfile.coupleId) {
      q = query(collection(db, 'accounts'), where('coupleId', '==', userProfile.coupleId));
    } else {
      q = query(collection(db, 'accounts'), where('uid', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Account[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Account));
      setAccounts(docs);
    });

    return () => unsubscribe();
  }, [user, userProfile, scope]);

  // Fetch Custom Categories in real-time
  useEffect(() => {
    if (!user || !userProfile) return;

    let q;
    if (scope === 'personal') {
      q = query(collection(db, 'categories'), where('uid', '==', user.uid), where('scope', '==', 'personal'));
    } else if (scope === 'shared' && userProfile.coupleId) {
      q = query(collection(db, 'categories'), where('coupleId', '==', userProfile.coupleId), where('scope', '==', 'shared'));
    } else if (userProfile.coupleId) {
      q = query(collection(db, 'categories'), where('coupleId', '==', userProfile.coupleId));
    } else {
      q = query(collection(db, 'categories'), where('uid', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: CategoryItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      } as CategoryItem));
      setCustomCategories(docs);
    });

    return () => unsubscribe();
  }, [user, userProfile, scope]);

  // Fetch Transactions in real-time
  useEffect(() => {
    if (!user || !userProfile) return;

    let q;
    if (scope === 'personal') {
      q = query(collection(db, 'transactions'), where('uid', '==', user.uid), where('scope', '==', 'personal'));
    } else if (scope === 'shared' && userProfile.coupleId) {
      q = query(collection(db, 'transactions'), where('coupleId', '==', userProfile.coupleId), where('scope', '==', 'shared'));
    } else if (userProfile.coupleId) {
      q = query(collection(db, 'transactions'), where('coupleId', '==', userProfile.coupleId));
    } else {
      q = query(collection(db, 'transactions'), where('uid', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Transaction[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Transaction));
      
      // Auto-recurring Bill generation check:
      // If a recurring bill's date is in the past month and hasn't been created for the current month, we handle it seamlessly
      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(docs);
    });

    return () => unsubscribe();
  }, [user, userProfile, scope]);

  // Combined Categories List (Default + Custom)
  const allCategoryNames = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...customCategories.map(c => c.name)
  ]));

  // Open modal for new transaction
  const openNewTransactionModal = () => {
    setEditingTransaction(null);
    setDescription('');
    setAmountRaw('');
    setType('expense');
    setCategory(allCategoryNames[0] || 'Supermercado');
    setTransactionScope(scope === 'personal' ? 'personal' : 'shared');
    setDate(new Date().toISOString().split('T')[0]);
    setAccountId(accounts.length > 0 ? accounts[0].id || '' : '');
    setToAccountId('');
    setIsModalOpen(true);
  };

  // Open modal for editing existing transaction
  const openEditTransactionModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setDescription(tx.description);
    setAmountRaw(formatAmountInput(tx.amount.toString()));
    setType(tx.type);
    setCategory(tx.category || 'Otros');
    setTransactionScope(tx.scope);
    setDate(tx.date || new Date().toISOString().split('T')[0]);
    setAccountId(tx.accountId || '');
    setToAccountId(tx.toAccountId || '');
    setIsModalOpen(true);
  };

  // Save (Create or Update) Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amountRaw || !description) return;

    const parsedAmount = getNumericAmount(amountRaw);
    if (parsedAmount <= 0) return;

    const sourceAcc = accounts.find(a => a.id === accountId);
    const destAcc = accounts.find(a => a.id === toAccountId);

    if (type === 'transfer' && (!accountId || !toAccountId || accountId === toAccountId)) {
      alert('Por favor selecciona una cuenta de origen y una cuenta de destino diferentes.');
      return;
    }

    if (editingTransaction && editingTransaction.id) {
      // UPDATE existing transaction
      const txRef = doc(db, 'transactions', editingTransaction.id);
      await updateDoc(txRef, {
        description,
        amount: parsedAmount,
        category: type === 'transfer' ? 'Transferencia' : category,
        type,
        scope: transactionScope,
        date,
        accountId: accountId || null,
        accountName: sourceAcc ? sourceAcc.name : null,
        toAccountId: type === 'transfer' ? (toAccountId || null) : null,
        toAccountName: (type === 'transfer' && destAcc) ? destAcc.name : null,
        isRecurringBill: type === 'bill',
        frequency: type === 'bill' ? 'monthly' : null
      });
    } else {
      // CREATE new transaction
      const newTx: Omit<Transaction, 'id'> = {
        uid: user.uid,
        coupleId: userProfile?.coupleId || null,
        description,
        amount: parsedAmount,
        category: type === 'transfer' ? 'Transferencia' : category,
        type,
        scope: transactionScope,
        date,
        accountId: accountId || null,
        accountName: sourceAcc ? sourceAcc.name : null,
        toAccountId: type === 'transfer' ? (toAccountId || null) : null,
        toAccountName: (type === 'transfer' && destAcc) ? destAcc.name : null,
        isRecurringBill: type === 'bill',
        frequency: type === 'bill' ? 'monthly' : undefined,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'transactions'), newTx);
    }

    setIsModalOpen(false);
  };

  // Delete Transaction
  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(db, 'transactions', id));
  };

  // Add Account
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAccountName.trim()) return;

    const newAcc: Omit<Account, 'id'> = {
      uid: user.uid,
      coupleId: userProfile?.coupleId || null,
      name: newAccountName.trim(),
      scope: newAccountScope,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'accounts'), newAcc);
    setNewAccountName('');
  };

  // Delete Account
  const handleDeleteAccount = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(db, 'accounts', id));
    if (selectedAccountId === id) {
      setSelectedAccountId('all');
    }
  };

  // Add Custom Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCatName.trim()) return;

    const newCat: Omit<CategoryItem, 'id'> = {
      uid: user.uid,
      coupleId: userProfile?.coupleId || null,
      name: newCatName.trim(),
      scope: scope === 'personal' ? 'personal' : 'shared',
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'categories'), newCat);
    setNewCatName('');
  };

  // Edit Custom Category
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.id || !editCatName.trim()) return;

    await updateDoc(doc(db, 'categories', editingCategory.id), {
      name: editCatName.trim()
    });
    setEditingCategory(null);
    setEditCatName('');
  };

  // Delete Custom Category
  const handleDeleteCategory = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(db, 'categories', id));
  };

  // Filter transactions by selected account
  const filteredTransactions = transactions.filter(t => {
    if (selectedAccountId === 'all') return true;
    return t.accountId === selectedAccountId || t.toAccountId === selectedAccountId;
  });

  // Calculations
  // Expenses include: 'expense' and 'bill'
  // Income: 'income'
  // Transfers: do not alter global net balance (money shifts accounts), but if filtered by account:
  // - If account is source: deduction
  // - If account is dest: addition
  const totalIncome = filteredTransactions.reduce((acc, t) => {
    if (t.type === 'income') return acc + t.amount;
    if (selectedAccountId !== 'all' && t.type === 'transfer' && t.toAccountId === selectedAccountId) {
      return acc + t.amount;
    }
    return acc;
  }, 0);

  const totalExpense = filteredTransactions.reduce((acc, t) => {
    if (t.type === 'expense' || t.type === 'bill') return acc + t.amount;
    if (selectedAccountId !== 'all' && t.type === 'transfer' && t.accountId === selectedAccountId) {
      return acc + t.amount;
    }
    return acc;
  }, 0);

  const totalTransfers = filteredTransactions.filter(t => t.type === 'transfer').reduce((acc, t) => acc + t.amount, 0);
  const totalBills = filteredTransactions.filter(t => t.type === 'bill').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Chart Data Preparation (includes expenses & bills)
  const chartCategories = allCategoryNames.filter(cat => cat !== 'Transferencia');
  const expensesByCategory = chartCategories.map(cat => {
    return filteredTransactions
      .filter(t => (t.type === 'expense' || t.type === 'bill') && t.category === cat)
      .reduce((acc, t) => acc + t.amount, 0);
  });

  const chartColors = [
    '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e', '#64748b'
  ];

  const chartData = {
    labels: chartCategories,
    datasets: [
      {
        data: expensesByCategory,
        backgroundColor: chartColors.slice(0, chartCategories.length),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.financialSummary}</h2>
          <p className="text-xs text-slate-500">{t.financeSub}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl text-xs transition-colors border border-slate-200 dark:border-slate-700"
          >
            <FolderPlus className="w-4 h-4 text-emerald-500" />
            <span>{t.manageCategories}</span>
          </button>

          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl text-xs transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>{t.manageAccounts}</span>
          </button>
          
          <button
            onClick={openNewTransactionModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newTransaction}</span>
          </button>
        </div>
      </div>

      {/* Account Filters Bar */}
      {accounts.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium flex items-center space-x-1 pr-1">
            <Filter className="w-3 h-3" />
            <span>{t.account}:</span>
          </span>
          <button
            onClick={() => setSelectedAccountId('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              selectedAccountId === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            {t.allAccounts}
          </button>
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id || 'all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                selectedAccountId === acc.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <span>{acc.name}</span>
              <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-bold ${
                acc.scope === 'shared' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {acc.scope === 'shared' ? 'C' : 'P'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.totalBalance}</span>
            <Wallet className="w-4 h-4 text-indigo-500" />
          </div>
          <p className={`text-2xl font-extrabold ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Ingresos */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">{t.income}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Gastos Totales */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-500">{t.expenses}</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-extrabold text-red-500">
            -${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Facturas & Transferencias */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">{t.bills}</span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              ${totalBills.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-400 font-medium">
              ⇄ ${totalTransfers.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* Grid: Chart & Transaction List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 self-start">
            {t.byCategory}
          </h3>
          {totalExpense > 0 ? (
            <div className="w-48 h-48">
              <Doughnut data={chartData} options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              {t.noExpenses}
            </div>
          )}
        </div>

        {/* Transactions Table / List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            {t.movementHistory}
          </h3>

          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              {t.noMovements}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {filteredTransactions.map((tx) => {
                const isTransfer = tx.type === 'transfer';
                const isBill = tx.type === 'bill';
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-lg ${
                        isIncome ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' :
                        isTransfer ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500' :
                        isBill ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500' :
                        'bg-red-50 dark:bg-red-950/40 text-red-500'
                      }`}>
                        {isIncome && <TrendingUp className="w-4 h-4" />}
                        {isTransfer && <ArrowRightLeft className="w-4 h-4" />}
                        {isBill && <Repeat className="w-4 h-4" />}
                        {!isIncome && !isTransfer && !isBill && <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                            {tx.description}
                          </h4>
                          {isBill && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded">
                              Mensual
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                          {isTransfer ? (
                            <span className="inline-flex items-center space-x-1 font-medium text-indigo-600 dark:text-indigo-400">
                              <span>{tx.accountName || 'Origen'}</span>
                              <span>➔</span>
                              <span>{tx.toAccountName || 'Destino'}</span>
                            </span>
                          ) : (
                            <>
                              <span className="inline-flex items-center space-x-1">
                                <Tag className="w-3 h-3" />
                                <span>{tx.category}</span>
                              </span>
                              {tx.accountName && (
                                <>
                                  <span>•</span>
                                  <span className="inline-flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                                    <Building2 className="w-3 h-3" />
                                    <span>{tx.accountName}</span>
                                  </span>
                                </>
                              )}
                            </>
                          )}
                          <span>•</span>
                          <span className="inline-flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-indigo-400" />
                            <span className="font-medium text-slate-600 dark:text-slate-300">{tx.date}</span>
                          </span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${tx.scope === 'shared' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            {tx.scope === 'shared' ? t.shared : t.personal}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold pr-1 ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' :
                        isTransfer ? 'text-indigo-600 dark:text-indigo-400' :
                        isBill ? 'text-amber-600 dark:text-amber-400' :
                        'text-slate-900 dark:text-white'
                      }`}>
                        {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => openEditTransactionModal(tx)}
                        className="text-slate-400 hover:text-indigo-600 p-1.5 transition-colors rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                        title={t.edit}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 transition-colors rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modal: Crear o Editar Transacción */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingTransaction ? t.editTransaction : t.newTransaction}
            </h3>
            
            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.type}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-medium border transition-all ${
                      type === 'expense'
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-600 dark:text-red-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Gasto (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-medium border transition-all ${
                      type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Ingreso (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('transfer')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-medium border transition-all ${
                      type === 'transfer'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Transf. (⇄)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('bill')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-medium border transition-all ${
                      type === 'bill'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Factura (📅)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.description}</label>
                <input
                  type="text"
                  required
                  placeholder={type === 'transfer' ? 'Ej: Transferencia ahorros' : type === 'bill' ? 'Ej: Factura de Electricidad' : 'Ej: Mercado semanal'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.amount} ($)</label>
                  <input
                    type="text"
                    required
                    placeholder="0.00"
                    value={amountRaw}
                    onChange={handleAmountChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.date}</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Accounts Selection based on Type */}
              {type === 'transfer' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.sourceAccount}</label>
                    <select
                      required
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white"
                    >
                      <option value="">{t.selectAccount}</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.scope === 'shared' ? t.shared : t.personal})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.destAccount}</label>
                    <select
                      required
                      value={toAccountId}
                      onChange={(e) => setToAccountId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white"
                    >
                      <option value="">{t.selectDestAccount}</option>
                      {accounts.filter(a => a.id !== accountId).map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.scope === 'shared' ? t.shared : t.personal})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.account}</label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white"
                    >
                      <option value="">{t.selectAccount}</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.scope === 'shared' ? t.shared : t.personal})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.category}</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white"
                    >
                      {allCategoryNames.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Scope */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.scope}</label>
                <select
                  value={transactionScope}
                  onChange={(e) => setTransactionScope(e.target.value as TransactionScope)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white"
                >
                  <option value="shared">{t.shared}</option>
                  <option value="personal">{t.personal}</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs shadow-sm"
                >
                  {editingTransaction ? t.updateTransaction : t.saveTransaction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gestión de Categorías */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <FolderPlus className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.manageCategories}</h3>
              </div>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Crear o Editar Categoría Form */}
            {editingCategory ? (
              <form onSubmit={handleUpdateCategory} className="space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{t.editCategory}</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition-colors"
                  >
                    {t.saveCategory}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs"
                  >
                    {t.cancel}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddCategory} className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t.newCategory}</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    placeholder={t.categoryName}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition-colors whitespace-nowrap"
                  >
                    {t.addCategory}
                  </button>
                </div>
              </form>
            )}

            {/* Lista de Categorías */}
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {/* Default categories notice */}
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-1">Categorías de Sistema</div>
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                {DEFAULT_CATEGORIES.map(cat => (
                  <span key={cat} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                    {cat}
                  </span>
                ))}
              </div>

              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-2">Tus Categorías Personalizadas</div>
              {customCategories.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">No has agregado categorías personalizadas aún.</p>
              ) : (
                customCategories.map(cat => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80"
                  >
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{cat.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditCatName(cat.name);
                        }}
                        className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
                        title={t.edit}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gestión de Cuentas / Bancos */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.manageAccounts}</h3>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Crear Cuenta Form */}
            <form onSubmit={handleAddAccount} className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t.newAccount}</h4>
              <input
                type="text"
                required
                placeholder={t.accountName}
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
              />
              <div className="flex space-x-2">
                <select
                  value={newAccountScope}
                  onChange={(e) => setNewAccountScope(e.target.value as TransactionScope)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white"
                >
                  <option value="personal">{t.personal}</option>
                  <option value="shared">{t.shared}</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs transition-colors"
                >
                  {t.addAccount}
                </button>
              </div>
            </form>

            {/* Lista de Cuentas */}
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {accounts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">{t.noAccountsYet}</p>
              ) : (
                accounts.map(acc => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80"
                  >
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{acc.name}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        acc.scope === 'shared' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {acc.scope === 'shared' ? t.shared : t.personal}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

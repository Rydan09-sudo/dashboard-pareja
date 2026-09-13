import React, { useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import type {
  Transaction,
  TransactionScope,
  TransactionType,
  Account,
  AccountType,
  CategoryItem,
  CategoryType
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
  Landmark,
  CreditCard,
  Coins,
  Smartphone,
  PiggyBank,
  Edit2,
  SlidersHorizontal,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const DEFAULT_EXPENSE_CATEGORIES = [
  'Supermercado',
  'Servicios',
  'Restaurantes',
  'Entretenimiento',
  'Transporte',
  'Salud',
  'Otros'
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salario / Sueldo',
  'Trabajo Independiente',
  'Rendimientos / Inversiones',
  'Regalos / Bonos',
  'Otros Ingresos'
];

const CHART_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6',
  '#14b8a6', '#f97316', '#06b6d4', '#e11d48', '#84cc16', '#64748b'
];

interface FinanceDashboardProps {
  scope: 'all' | 'personal' | 'shared';
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ scope }) => {
  const { user, userProfile, t } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Editing state
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Transaction Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [transactionScope, setTransactionScope] = useState<TransactionScope>('shared');

  // Account Form State
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [accountInitialBalance, setAccountInitialBalance] = useState('');
  const [accountScope, setAccountScope] = useState<TransactionScope>('personal');

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<CategoryType>('expense');
  const [newCatScope, setNewCatScope] = useState<TransactionScope>('shared');
  const [categoryTab, setCategoryTab] = useState<CategoryType>('expense');

  // 1. Sync Transactions
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

      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(docs);
    });

    return () => unsubscribe();
  }, [user, userProfile, scope]);

  // 2. Sync Accounts
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

  // 3. Sync Categories & Seed defaults into Firestore if empty
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

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial default categories in Firestore so user can edit/delete them freely
        const batchPromises: Promise<any>[] = [];
        DEFAULT_EXPENSE_CATEGORIES.forEach((name) => {
          batchPromises.push(
            addDoc(collection(db, 'categories'), {
              uid: user.uid,
              coupleId: userProfile.coupleId || null,
              name,
              type: 'expense',
              scope: 'shared',
              createdAt: serverTimestamp()
            })
          );
        });
        DEFAULT_INCOME_CATEGORIES.forEach((name) => {
          batchPromises.push(
            addDoc(collection(db, 'categories'), {
              uid: user.uid,
              coupleId: userProfile.coupleId || null,
              name,
              type: 'income',
              scope: 'shared',
              createdAt: serverTimestamp()
            })
          );
        });
        await Promise.all(batchPromises);
      } else {
        const docs: CategoryItem[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        } as CategoryItem));
        setCategories(docs);
      }
    });

    return () => unsubscribe();
  }, [user, userProfile, scope]);

  // Filtered categories according to current selected transaction type
  const availableExpenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  const availableIncomeCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'income');
  }, [categories]);

  const currentCategoriesForTx = type === 'expense' ? availableExpenseCategories : availableIncomeCategories;

  // Set default category when type or category list changes
  useEffect(() => {
    if (currentCategoriesForTx.length > 0) {
      if (!currentCategoriesForTx.some((c) => c.name === category)) {
        setCategory(currentCategoriesForTx[0].name);
      }
    } else {
      setCategory('');
    }
  }, [type, currentCategoriesForTx]);

  // Calculate balances per account
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach((acc) => {
      if (acc.id) {
        let bal = Number(acc.initialBalance) || 0;
        transactions.forEach((tx) => {
          if (tx.accountId === acc.id || tx.account === acc.name) {
            if (tx.type === 'income') bal += tx.amount;
            else if (tx.type === 'expense') bal -= tx.amount;
          }
        });
        balances[acc.id] = bal;
      }
    });
    return balances;
  }, [accounts, transactions]);

  // Filter transactions by selected account if any
  const filteredTransactions = useMemo(() => {
    if (selectedAccountId === 'all') return transactions;
    return transactions.filter(
      (t) => t.accountId === selectedAccountId || accounts.find((a) => a.id === selectedAccountId)?.name === t.account
    );
  }, [transactions, selectedAccountId, accounts]);

  // Calculations
  const totalIncome = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalBalance = useMemo(() => {
    if (selectedAccountId !== 'all' && accounts.length > 0) {
      return accountBalances[selectedAccountId] ?? (totalIncome - totalExpense);
    }
    // Sum initial balances of all active accounts + net movements
    const totalInitial = accounts.reduce((acc, a) => acc + (Number(a.initialBalance) || 0), 0);
    return totalInitial + (totalIncome - totalExpense);
  }, [selectedAccountId, accounts, accountBalances, totalIncome, totalExpense]);

  // Chart Data Preparation (by categories)
  const chartData = useMemo(() => {
    const catTotals: { label: string; amount: number }[] = [];
    const targetCategories = availableExpenseCategories;

    targetCategories.forEach((cat) => {
      const sum = filteredTransactions
        .filter((t) => t.type === 'expense' && t.category === cat.name)
        .reduce((acc, t) => acc + t.amount, 0);
      if (sum > 0) {
        catTotals.push({ label: cat.name, amount: sum });
      }
    });

    // Also include transactions whose category was deleted or unlisted
    const otherSum = filteredTransactions
      .filter((t) => t.type === 'expense' && !targetCategories.some((c) => c.name === t.category))
      .reduce((acc, t) => acc + t.amount, 0);
    if (otherSum > 0) {
      catTotals.push({ label: t.catOthers || 'Otros', amount: otherSum });
    }

    return {
      labels: catTotals.map((c) => c.label),
      datasets: [
        {
          data: catTotals.map((c) => c.amount),
          backgroundColor: CHART_COLORS.slice(0, catTotals.length),
          borderWidth: 0
        }
      ]
    };
  }, [filteredTransactions, availableExpenseCategories, t]);

  // --------------------------------------------------------------------------
  // HANDLERS: Transactions
  // --------------------------------------------------------------------------
  const handleOpenTxModal = () => {
    setDescription('');
    setAmount('');
    setType('expense');
    setAccountId(accounts[0]?.id || '');
    setTransactionScope(scope === 'personal' ? 'personal' : 'shared');
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !description) return;

    const selectedAcc = accounts.find((a) => a.id === accountId);

    const newTx: Omit<Transaction, 'id'> = {
      uid: user.uid,
      coupleId: userProfile?.coupleId || null,
      description: description.trim(),
      amount: parseFloat(amount),
      category: category || (type === 'expense' ? 'Otros' : 'Otros Ingresos'),
      account: selectedAcc ? selectedAcc.name : '',
      accountId: selectedAcc?.id || '',
      type,
      scope: transactionScope,
      date: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'transactions'), newTx);

    setDescription('');
    setAmount('');
    setIsTxModalOpen(false);
  };

  const handleDeleteTransaction = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(db, 'transactions', id));
  };

  // --------------------------------------------------------------------------
  // HANDLERS: Accounts
  // --------------------------------------------------------------------------
  const handleOpenNewAccountModal = () => {
    setEditingAccount(null);
    setAccountName('');
    setAccountType('bank');
    setAccountInitialBalance('');
    setAccountScope(scope === 'personal' ? 'personal' : 'shared');
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setAccountName(acc.name);
    setAccountType(acc.type);
    setAccountInitialBalance(acc.initialBalance?.toString() || '0');
    setAccountScope(acc.scope || 'personal');
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accountName.trim()) return;

    if (editingAccount?.id) {
      await updateDoc(doc(db, 'accounts', editingAccount.id), {
        name: accountName.trim(),
        type: accountType,
        initialBalance: parseFloat(accountInitialBalance) || 0,
        scope: accountScope
      });
    } else {
      await addDoc(collection(db, 'accounts'), {
        uid: user.uid,
        coupleId: userProfile?.coupleId || null,
        name: accountName.trim(),
        type: accountType,
        initialBalance: parseFloat(accountInitialBalance) || 0,
        scope: accountScope,
        createdAt: serverTimestamp()
      });
    }

    setIsAccountModalOpen(false);
  };

  const handleDeleteAccount = async (accId?: string) => {
    if (!accId) return;
    if (confirm('¿Seguro que deseas eliminar esta cuenta?')) {
      await deleteDoc(doc(db, 'accounts', accId));
      if (selectedAccountId === accId) {
        setSelectedAccountId('all');
      }
    }
  };

  const getAccountIcon = (accType: AccountType) => {
    switch (accType) {
      case 'bank':
        return <Landmark className="w-4 h-4 text-blue-500" />;
      case 'wallet':
        return <Smartphone className="w-4 h-4 text-indigo-500" />;
      case 'cash':
        return <Coins className="w-4 h-4 text-amber-500" />;
      case 'credit':
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      case 'savings':
        return <PiggyBank className="w-4 h-4 text-emerald-500" />;
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-teal-500" />;
      default:
        return <Wallet className="w-4 h-4 text-slate-500" />;
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: Categories
  // --------------------------------------------------------------------------
  const handleOpenCategoriesModal = () => {
    setEditingCategory(null);
    setNewCatName('');
    setNewCatType(categoryTab);
    setNewCatScope('shared');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCatName.trim()) return;

    if (editingCategory?.id) {
      await updateDoc(doc(db, 'categories', editingCategory.id), {
        name: newCatName.trim(),
        type: newCatType,
        scope: newCatScope
      });
    } else {
      await addDoc(collection(db, 'categories'), {
        uid: user.uid,
        coupleId: userProfile?.coupleId || null,
        name: newCatName.trim(),
        type: newCatType,
        scope: newCatScope,
        createdAt: serverTimestamp()
      });
    }

    setEditingCategory(null);
    setNewCatName('');
  };

  const handleStartEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatType(cat.type);
    setNewCatScope(cat.scope || 'shared');
  };

  const handleDeleteCategory = async (catId?: string) => {
    if (!catId) return;
    if (confirm('¿Eliminar esta categoría? Las transacciones previas conservarán su registro.')) {
      await deleteDoc(doc(db, 'categories', catId));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.financialSummary}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.financeSub}
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Manage Categories Button */}
          <button
            onClick={handleOpenCategoriesModal}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
            title={t.manageCategories}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t.manageCategories}</span>
          </button>

          {/* New Account Button */}
          <button
            onClick={handleOpenNewAccountModal}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
            title={t.newAccount}
          >
            <Wallet className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t.newAccount}</span>
          </button>

          {/* New Transaction Button */}
          <button
            onClick={handleOpenTxModal}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newTransaction}</span>
          </button>
        </div>
      </div>

      {/* Accounts Carousel / Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t.accounts}
          </span>
          {accounts.length > 0 && (
            <button
              onClick={() => setSelectedAccountId('all')}
              className={`text-xs font-medium px-2 py-0.5 rounded-lg transition-colors ${
                selectedAccountId === 'all'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {t.allAccounts}
            </button>
          )}
        </div>

        {accounts.length === 0 ? (
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-dashed border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs text-indigo-700 dark:text-indigo-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-indigo-500" />
              <span>{t.noAccounts}</span>
            </div>
            <button
              onClick={handleOpenNewAccountModal}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors shrink-0 ml-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.newAccount}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 pt-1 scrollbar-none">
            {accounts.map((acc) => {
              const bal = accountBalances[acc.id || ''] ?? acc.initialBalance;
              const isSelected = selectedAccountId === acc.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountId(isSelected ? 'all' : (acc.id || 'all'))}
                  className={`relative shrink-0 w-44 p-3.5 rounded-2xl border transition-all cursor-pointer select-none group ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                        {getAccountIcon(acc.type)}
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[80px]">
                        {acc.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAccount(acc);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title={t.edit}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAccount(acc.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className={`text-base font-bold ${bal >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
                    ${bal.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">
                    {acc.scope === 'shared' ? t.shared : t.personal}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.totalBalance}</span>
            <Wallet className="w-4 h-4 text-indigo-500" />
          </div>
          <p className={`text-2xl font-extrabold ${totalBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
            ${totalBalance.toLocaleString()}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t.income}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            +${totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
              {t.expenses}
            </span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-500">
            -${totalExpense.toLocaleString()}
          </p>
        </div>

      </div>

      {/* Grid: Chart & Transaction List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 self-start">
            {t.byCategory}
          </h3>
          {totalExpense > 0 && chartData.labels.length > 0 ? (
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.movementHistory}
            </h3>
            {selectedAccountId !== 'all' && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium">
                Filtrado por cuenta
              </span>
            )}
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              {t.noMovements}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-lg ${tx.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'}`}>
                      {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                        {tx.description}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 flex-wrap gap-y-1">
                        <span className="inline-flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-indigo-500" />
                          <span>{tx.category}</span>
                        </span>
                        {tx.account && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center space-x-1">
                              <Wallet className="w-3 h-3 text-slate-400" />
                              <span>{tx.account}</span>
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="inline-flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{tx.date}</span>
                        </span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${tx.scope === 'shared' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          {tx.scope === 'shared' ? t.shared : t.personal}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ======================================================================
          MODAL: NUEVA TRANSACCIÓN
      ====================================================================== */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.newTransaction}
              </h3>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  {t.description}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mercado semanal, Pago de nómina..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.amount} ($)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.type}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  >
                    <option value="expense">{t.expenseType}</option>
                    <option value="income">{t.incomeType}</option>
                  </select>
                </div>
              </div>

              {/* Category selector & quick add */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    {t.category} ({type === 'expense' ? 'Gasto' : 'Ingreso'})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTxModalOpen(false);
                      setCategoryTab(type);
                      handleOpenCategoriesModal();
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    + {t.newCategory}
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                >
                  {currentCategoriesForTx.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  {currentCategoriesForTx.length === 0 && (
                    <option value="General">General</option>
                  )}
                </select>
              </div>

              {/* Account & Scope */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase text-slate-500">
                      {t.selectAccount}
                    </label>
                    {accounts.length === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsTxModalOpen(false);
                          handleOpenNewAccountModal();
                        }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                      >
                        + Crear
                      </button>
                    )}
                  </div>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  >
                    <option value="">Sin cuenta asignada</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (${(accountBalances[acc.id || ''] ?? acc.initialBalance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.scope}
                  </label>
                  <select
                    value={transactionScope}
                    onChange={(e) => setTransactionScope(e.target.value as TransactionScope)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  >
                    <option value="shared">{t.shared}</option>
                    <option value="personal">{t.personal}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/20"
                >
                  {t.saveTransaction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: GESTIÓN DE CUENTAS
      ====================================================================== */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingAccount ? t.editAccount : t.newAccount}
              </h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  {t.accountName}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Bancolombia, Nequi, Efectivo, Tarjeta Visa..."
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.accountType}
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  >
                    <option value="bank">{t.bankAccount}</option>
                    <option value="wallet">{t.digitalWallet}</option>
                    <option value="cash">{t.cash}</option>
                    <option value="credit">{t.creditCard}</option>
                    <option value="savings">{t.savingsAccount}</option>
                    <option value="investment">{t.investment}</option>
                    <option value="other">{t.otherAccount}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.initialBalance} ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={accountInitialBalance}
                    onChange={(e) => setAccountInitialBalance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  {t.scope}
                </label>
                <select
                  value={accountScope}
                  onChange={(e) => setAccountScope(e.target.value as TransactionScope)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                >
                  <option value="personal">{t.personal}</option>
                  <option value="shared">{t.shared}</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/20"
                >
                  {editingAccount ? t.saveChanges : t.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: GESTIÓN DE CATEGORÍAS (GASTOS E INGRESOS)
      ====================================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.manageCategories}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector: Gastos vs Ingresos */}
            <div className="flex items-center space-x-2 my-4 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
              <button
                onClick={() => {
                  setCategoryTab('expense');
                  setNewCatType('expense');
                  setEditingCategory(null);
                  setNewCatName('');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  categoryTab === 'expense'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t.expenseCategories} ({availableExpenseCategories.length})
              </button>
              <button
                onClick={() => {
                  setCategoryTab('income');
                  setNewCatType('income');
                  setEditingCategory(null);
                  setNewCatName('');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  categoryTab === 'income'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t.incomeCategories} ({availableIncomeCategories.length})
              </button>
            </div>

            {/* Add or Edit Category Form */}
            <form onSubmit={handleSaveCategory} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 mb-4">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {editingCategory ? `${t.editCategory}: "${editingCategory.name}"` : `+ ${t.newCategory}`}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  required
                  placeholder={`Ej: ${categoryTab === 'expense' ? 'Mascotas, Gimnasio...' : 'Ventas, Alquiler...'}`}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shrink-0 flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCategory ? t.saveChanges : t.create}</span>
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setNewCatName('');
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* List of existing categories */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {(categoryTab === 'expense' ? availableExpenseCategories : availableIncomeCategories).map((cat) => (
                <div
                  key={cat.id || cat.name}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg ${cat.type === 'expense' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500'}`}>
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleStartEditCategory(cat)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title={t.edit}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {(categoryTab === 'expense' ? availableExpenseCategories : availableIncomeCategories).length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  {t.noCategories}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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


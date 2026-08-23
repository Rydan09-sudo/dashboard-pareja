import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import type { Transaction, TransactionCategory, TransactionScope, TransactionType } from '../../types';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Plus, TrendingUp, TrendingDown, Trash2, Tag, Calendar, Wallet } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORIES: TransactionCategory[] = [
  'Supermercado', 'Servicios', 'Restaurantes', 'Entretenimiento', 'Transporte', 'Salud', 'Otros'
];

interface FinanceDashboardProps {
  scope: 'all' | 'personal' | 'shared';
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ scope }) => {
  const { user, userProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('Supermercado');
  const [transactionScope, setTransactionScope] = useState<TransactionScope>('shared');

  useEffect(() => {
    if (!user || !userProfile) return;

    let q;
    if (scope === 'personal') {
      q = query(collection(db, 'transactions'), where('uid', '==', user.uid), where('scope', '==', 'personal'));
    } else if (scope === 'shared' && userProfile.coupleId) {
      q = query(collection(db, 'transactions'), where('coupleId', '==', userProfile.coupleId), where('scope', '==', 'shared'));
    } else if (userProfile.coupleId) {
      // Fetch both personal and shared
      q = query(
        collection(db, 'transactions'),
        where('coupleId', '==', userProfile.coupleId)
      );
    } else {
      q = query(collection(db, 'transactions'), where('uid', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Transaction[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Transaction));
      
      // Sort client-side by date descending
      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(docs);
    });

    return () => unsubscribe();
  }, [user, userProfile, scope]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !description) return;

    const newTx: Omit<Transaction, 'id'> = {
      uid: user.uid,
      coupleId: userProfile?.coupleId || null,
      description,
      amount: parseFloat(amount),
      category,
      type,
      scope: transactionScope,
      date: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'transactions'), newTx);

    // Reset Form
    setDescription('');
    setAmount('');
    setIsModalOpen(false);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(db, 'transactions', id));
  };

  // Calculations
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Chart Data Preparation
  const expensesByCategory = CATEGORIES.map(cat => {
    return transactions
      .filter(t => t.type === 'expense' && t.category === cat)
      .reduce((acc, t) => acc + t.amount, 0);
  });

  const chartData = {
    labels: CATEGORIES,
    datasets: [
      {
        data: expensesByCategory,
        backgroundColor: [
          '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#64748b'
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Resumen Financiero</h2>
          <p className="text-xs text-slate-500">Control de ingresos, gastos e inversiones</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Transacción</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Balance Total</span>
            <Wallet className="w-4 h-4 text-indigo-500" />
          </div>
          <p className={`text-2xl font-extrabold ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
            ${balance.toLocaleString()}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Ingresos</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            +${totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-500">Gastos Total</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-extrabold text-red-500">
            -${totalExpense.toLocaleString()}
          </p>
        </div>

      </div>

      {/* Grid: Chart & Transaction List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 self-start">
            Gastos por Categoría
          </h3>
          {totalExpense > 0 ? (
            <div className="w-48 h-48">
              <Doughnut data={chartData} options={{ maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No hay gastos registrados en este periodo
            </div>
          )}
        </div>

        {/* Transactions Table / List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Histórico de Movimientos
          </h3>

          {transactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No hay movimientos agregados aún.
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-lg ${tx.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-red-50 dark:bg-red-950/40 text-red-500'}`}>
                      {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                        {tx.description}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                        <span className="inline-flex items-center space-x-1">
                          <Tag className="w-3 h-3" />
                          <span>{tx.category}</span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{tx.date}</span>
                        </span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${tx.scope === 'shared' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          {tx.scope === 'shared' ? 'Compartido' : 'Personal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      title="Eliminar"
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

      {/* Modal Nueva Transacción */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Nueva Transacción</h3>
            
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mercado semanal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Monto ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="expense">Gasto (-)</option>
                    <option value="income">Ingreso (+)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Espacio</label>
                  <select
                    value={transactionScope}
                    onChange={(e) => setTransactionScope(e.target.value as TransactionScope)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="shared">Compartido</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs shadow-sm"
                >
                  Guardar Transacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

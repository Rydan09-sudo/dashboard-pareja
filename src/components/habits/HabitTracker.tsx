import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import type { Habit } from '../../types';
import { Sparkles, Plus, CheckCircle2, Flame, Trash2 } from 'lucide-react';

interface HabitTrackerProps {
  scope: 'all' | 'personal' | 'shared';
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ scope }) => {
  const { user, userProfile } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [habitScope, setHabitScope] = useState<'personal' | 'shared'>('shared');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user || !userProfile) return;

    let q;
    if (scope === 'personal') {
      q = query(collection(db, 'habits'), where('uid', '==', user.uid), where('scope', '==', 'personal'));
    } else if (scope === 'shared' && userProfile.coupleId) {
      q = query(collection(db, 'habits'), where('coupleId', '==', userProfile.coupleId), where('scope', '==', 'shared'));
    } else if (userProfile.coupleId) {
      q = query(collection(db, 'habits'), where('coupleId', '==', userProfile.coupleId));
    } else {
      q = query(collection(db, 'habits'), where('uid', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Habit[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Habit));
      setHabits(docs);
    });

    return () => unsubscribe();
  }, [user, userProfile, scope]);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newHabitName.trim()) return;

    const habit: Omit<Habit, 'id'> = {
      uid: user.uid,
      coupleId: userProfile?.coupleId || null,
      name: newHabitName.trim(),
      streak: 0,
      completedDates: [],
      scope: habitScope
    };

    await addDoc(collection(db, 'habits'), habit);
    setNewHabitName('');
  };

  const toggleHabitToday = async (habit: Habit) => {
    if (!habit.id) return;

    const habitRef = doc(db, 'habits', habit.id);
    const isCompletedToday = habit.completedDates.includes(today);

    let updatedDates: string[];
    let updatedStreak = habit.streak;

    if (isCompletedToday) {
      updatedDates = habit.completedDates.filter(d => d !== today);
      updatedStreak = Math.max(0, habit.streak - 1);
    } else {
      updatedDates = [...habit.completedDates, today];
      updatedStreak = habit.streak + 1;
    }

    await updateDoc(habitRef, {
      completedDates: updatedDates,
      streak: updatedStreak
    });
  };

  const handleDeleteHabit = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(db, 'habits', id));
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Seguimiento de Hábitos</h2>
          <p className="text-xs text-slate-500">Construye constancia y rachas compartidas</p>
        </div>
      </div>

      {/* Add Habit Bar */}
      <form onSubmit={handleAddHabit} className="flex gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <input
          type="text"
          required
          placeholder="Ej: Leer 15 min en pareja..."
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          className="flex-1 px-4 py-2 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
        <select
          value={habitScope}
          onChange={(e) => setHabitScope(e.target.value as 'personal' | 'shared')}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="shared">Compartido</option>
          <option value="personal">Personal</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs flex items-center space-x-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar</span>
        </button>
      </form>

      {/* Habits List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-slate-400">
            No tienes hábitos registrados aún.
          </div>
        ) : (
          habits.map((habit) => {
            const completedToday = habit.completedDates.includes(today);

            return (
              <div
                key={habit.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleHabitToday(habit)}
                    className={`p-2 rounded-xl transition-all ${
                      completedToday
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-300 hover:text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>

                  <div>
                    <h3 className={`text-sm font-semibold ${completedToday ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {habit.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center space-x-1 text-xs font-medium text-amber-500">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>Racha: {habit.streak} días</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {habit.scope === 'shared' ? 'Compartido' : 'Personal'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteHabit(habit.id)}
                  className="text-slate-300 hover:text-red-500 p-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

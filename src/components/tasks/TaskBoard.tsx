import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import type { Task } from '../../types';
import { Plus, CheckSquare, Square, Trash2 } from 'lucide-react';

interface TaskBoardProps {
  scope: 'all' | 'personal' | 'shared';
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ scope }) => {
  const { user, userProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [taskScope, setTaskScope] = useState<'personal' | 'shared'>('shared');

  useEffect(() => {
    if (!user || !userProfile) return;

    let q;
    if (scope === 'personal') {
      q = query(collection(db, 'tasks'), where('uid', '==', user.uid), where('scope', '==', 'personal'));
    } else if (scope === 'shared' && userProfile.coupleId) {
      q = query(collection(db, 'tasks'), where('coupleId', '==', userProfile.coupleId), where('scope', '==', 'shared'));
    } else if (userProfile.coupleId) {
      q = query(collection(db, 'tasks'), where('coupleId', '==', userProfile.coupleId));
    } else {
      q = query(collection(db, 'tasks'), where('uid', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Task[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Task));
      setTasks(docs);
    });

    return () => unsubscribe();
  }, [user, userProfile, scope]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;

    const task: Omit<Task, 'id'> = {
      uid: user.uid,
      coupleId: userProfile?.coupleId || null,
      title: newTitle.trim(),
      completed: false,
      scope: taskScope
    };

    await addDoc(collection(db, 'tasks'), task);
    setNewTitle('');
  };

  const toggleTask = async (task: Task) => {
    if (!task.id) return;
    await updateDoc(doc(db, 'tasks', task.id), {
      completed: !task.completed
    });
  };

  const handleDeleteTask = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(db, 'tasks', id));
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tablero de Tareas</h2>
          <p className="text-xs text-slate-500">Gestión de pendientes personales y grupales</p>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="flex gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <input
          type="text"
          required
          placeholder="Ej: Pagar servicio de internet..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 px-4 py-2 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
        <select
          value={taskScope}
          onChange={(e) => setTaskScope(e.target.value as 'personal' | 'shared')}
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

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No hay tareas pendientes.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
            >
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => toggleTask(task)}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {task.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <span className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                  {task.title}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {task.scope === 'shared' ? 'Compartido' : 'Personal'}
                </span>
              </div>

              <button
                onClick={() => handleDeleteTask(task.id)}
                className="text-slate-300 hover:text-red-500 p-1 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

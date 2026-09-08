import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { Heart, LogOut, Users, User as UserIcon, Wallet, CheckSquare, Sparkles, Settings } from 'lucide-react';

interface NavbarProps {
  activeTab: 'finances' | 'habits' | 'tasks' | 'settings';
  setActiveTab: (tab: 'finances' | 'habits' | 'tasks' | 'settings') => void;
  scope: 'all' | 'personal' | 'shared';
  setScope: (scope: 'all' | 'personal' | 'shared') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, scope, setScope }) => {
  const { userProfile, coupleData, t } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Status */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-none">MayDa</h1>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${coupleData ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {coupleData ? t.partnerConnected : t.personalMode}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <button
              onClick={() => setActiveTab('finances')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'finances'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>{t.finances}</span>
            </button>

            <button
              onClick={() => setActiveTab('habits')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'habits'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.habits}</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tasks'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{t.tasks}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{t.settings}</span>
            </button>
          </nav>

          {/* Scope Filters & Settings / Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl text-xs">
              <button
                onClick={() => setScope('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  scope === 'all' ? 'bg-white dark:bg-slate-900 font-semibold shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                {t.all}
              </button>
              <button
                onClick={() => setScope('personal')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                  scope === 'personal' ? 'bg-white dark:bg-slate-900 font-semibold shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                <UserIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{t.personal}</span>
              </button>
              <button
                onClick={() => setScope('shared')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                  scope === 'shared' ? 'bg-white dark:bg-slate-900 font-semibold shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                <Users className="w-3 h-3" />
                <span className="hidden sm:inline">{t.shared}</span>
              </button>
            </div>

            <button
              onClick={() => setActiveTab('settings')}
              title={t.settings}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => auth.signOut()}
              title={t.logout}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

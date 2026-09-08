import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { 
  Heart, 
  LogOut, 
  Users, 
  User as UserIcon, 
  Wallet, 
  CheckSquare, 
  Sparkles, 
  Settings, 
  Menu, 
  X 
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'finances' | 'habits' | 'tasks' | 'settings';
  setActiveTab: (tab: 'finances' | 'habits' | 'tasks' | 'settings') => void;
  scope: 'all' | 'personal' | 'shared';
  setScope: (scope: 'all' | 'personal' | 'shared') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, scope, setScope }) => {
  const { userProfile, coupleData, t } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: 'finances' | 'habits' | 'tasks' | 'settings') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Hamburger Button (Mobile Only) & Logo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-white leading-none">MayDa</h1>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${coupleData ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[120px] sm:max-w-none">
                    {coupleData ? t.partnerConnected : t.personalMode}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <button
              onClick={() => handleTabClick('finances')}
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
              onClick={() => handleTabClick('habits')}
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
              onClick={() => handleTabClick('tasks')}
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
              onClick={() => handleTabClick('settings')}
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

          {/* Right: Scope Filter & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl text-xs">
              <button
                onClick={() => setScope('all')}
                className={`px-2 py-1 sm:px-2.5 rounded-lg transition-all ${
                  scope === 'all' ? 'bg-white dark:bg-slate-900 font-semibold shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                {t.all}
              </button>
              <button
                onClick={() => setScope('personal')}
                className={`flex items-center space-x-1 px-2 py-1 sm:px-2.5 rounded-lg transition-all ${
                  scope === 'personal' ? 'bg-white dark:bg-slate-900 font-semibold shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                <UserIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{t.personal}</span>
              </button>
              <button
                onClick={() => setScope('shared')}
                className={`flex items-center space-x-1 px-2 py-1 sm:px-2.5 rounded-lg transition-all ${
                  scope === 'shared' ? 'bg-white dark:bg-slate-900 font-semibold shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                <Users className="w-3 h-3" />
                <span className="hidden sm:inline">{t.shared}</span>
              </button>
            </div>

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

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200 shadow-xl">
          <button
            onClick={() => handleTabClick('finances')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'finances'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Wallet className="w-5 h-5 text-indigo-500" />
            <span>{t.finances}</span>
          </button>

          <button
            onClick={() => handleTabClick('habits')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'habits'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>{t.habits}</span>
          </button>

          <button
            onClick={() => handleTabClick('tasks')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'tasks'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <CheckSquare className="w-5 h-5 text-indigo-500" />
            <span>{t.tasks}</span>
          </button>

          <button
            onClick={() => handleTabClick('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-5 h-5 text-indigo-500" />
            <span>{t.settings}</span>
          </button>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2 text-xs text-slate-400">
            <span>Usuario: <strong className="text-slate-700 dark:text-slate-200">{userProfile?.displayName || userProfile?.email?.split('@')[0]}</strong></span>
            <button
              onClick={() => auth.signOut()}
              className="text-red-500 font-medium hover:underline flex items-center space-x-1 py-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

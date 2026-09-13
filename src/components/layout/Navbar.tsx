import React, { useState, useEffect } from 'react';
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
  X,
  Layers,
  Sparkle
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'finances' | 'habits' | 'tasks' | 'settings';
  setActiveTab: (tab: 'finances' | 'habits' | 'tasks' | 'settings') => void;
  scope: 'all' | 'personal' | 'shared';
  setScope: (scope: 'all' | 'personal' | 'shared') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, scope, setScope }) => {
  const { user, userProfile, coupleData, t } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Usuario';

  // Saludo interactivo: muestra "Hola, [Username]" y a los 30 segundos cambia a "MayDa"
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(false);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleSelectTab = (tab: 'finances' | 'habits' | 'tasks' | 'settings') => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const handleSelectScope = (newScope: 'all' | 'personal' | 'shared') => {
    setScope(newScope);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await auth.signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Interactive Greeting */}
            <div 
              onClick={() => setShowGreeting(prev => !prev)}
              className="flex items-center space-x-3 cursor-pointer select-none group"
              title="Haz clic para alternar saludo / nombre de la app"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5 overflow-hidden">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-none tracking-tight transition-all duration-300">
                    {showGreeting ? `Hola, ${displayName}` : 'MayDa'}
                  </h1>
                  {showGreeting && (
                    <Sparkle className="w-3.5 h-3.5 text-amber-400 animate-pulse hidden sm:inline" />
                  )}
                </div>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${coupleData ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {coupleData ? t.partnerConnected : t.personalMode}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs (Hidden on mobile) */}
            <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <button
                onClick={() => setActiveTab('finances')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>{t.settings}</span>
              </button>
            </nav>

            {/* Desktop Scope Filters & Settings / Logout */}
            <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl text-xs border border-slate-200/50 dark:border-slate-700/50">
                <button
                  onClick={() => setScope('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    scope === 'all' ? 'bg-white dark:bg-slate-900 font-semibold shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {t.all}
                </button>
                <button
                  onClick={() => setScope('personal')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                    scope === 'personal' ? 'bg-white dark:bg-slate-900 font-semibold shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <UserIcon className="w-3 h-3" />
                  <span>{t.personal}</span>
                </button>
                <button
                  onClick={() => setScope('shared')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                    scope === 'shared' ? 'bg-white dark:bg-slate-900 font-semibold shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>{t.shared}</span>
                </button>
              </div>

              <button
                onClick={() => auth.signOut()}
                title={t.logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Button (Top Right) */}
            <div className="flex items-center space-x-2 md:hidden">
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown / Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-start">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Drawer */}
          <div className="relative w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xl rounded-b-2xl p-5 pt-4 z-10 animate-in slide-in-from-top-4 duration-200">
            
            {/* Header within drawer */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">MayDa</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">{displayName}</span>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* SECCIÓN 1: Tipo de Actividad (Finanzas, Hábitos, Tareas) */}
              <div>
                <div className="flex items-center space-x-2 px-1 mb-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-500 font-semibold" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t.activitySection}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => handleSelectTab('finances')}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === 'finances'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className="w-4 h-4" />
                      <span>{t.finances}</span>
                    </div>
                    {activeTab === 'finances' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSelectTab('habits')}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === 'habits'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Sparkles className="w-4 h-4" />
                      <span>{t.habits}</span>
                    </div>
                    {activeTab === 'habits' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSelectTab('tasks')}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === 'tasks'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CheckSquare className="w-4 h-4" />
                      <span>{t.tasks}</span>
                    </div>
                    {activeTab === 'tasks' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* SEPARADOR VISUAL 1 */}
              <div className="border-t border-slate-200 dark:border-slate-800" />

              {/* SECCIÓN 2: Tipo de Cuenta (Todo, Compartido, Personal) */}
              <div>
                <div className="flex items-center space-x-2 px-1 mb-2">
                  <Users className="w-3.5 h-3.5 text-indigo-500 font-semibold" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t.accountSection}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSelectScope('all')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-medium transition-all ${
                      scope === 'all'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-4 h-4 mb-1" />
                    <span>{t.all}</span>
                  </button>

                  <button
                    onClick={() => handleSelectScope('shared')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-medium transition-all ${
                      scope === 'shared'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4 mb-1" />
                    <span>{t.shared}</span>
                  </button>

                  <button
                    onClick={() => handleSelectScope('personal')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-medium transition-all ${
                      scope === 'personal'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <UserIcon className="w-4 h-4 mb-1" />
                    <span>{t.personal}</span>
                  </button>
                </div>
              </div>

              {/* SEPARADOR VISUAL 2 */}
              <div className="border-t border-slate-200 dark:border-slate-800" />

              {/* SECCIÓN 3: Configuraciones y Cerrar Sesión */}
              <div>
                <div className="flex items-center space-x-2 px-1 mb-2">
                  <Settings className="w-3.5 h-3.5 text-indigo-500 font-semibold" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t.systemSection}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => handleSelectTab('settings')}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === 'settings'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Settings className="w-4 h-4" />
                      <span>{t.settings}</span>
                    </div>
                    {activeTab === 'settings' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.logout}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};


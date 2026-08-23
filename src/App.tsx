import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthCard } from './components/auth/AuthCard';
import { CoupleLinkCard } from './components/auth/CoupleLinkCard';
import { Navbar } from './components/layout/Navbar';
import { FinanceDashboard } from './components/finance/FinanceDashboard';
import { HabitTracker } from './components/habits/HabitTracker';
import { TaskBoard } from './components/tasks/TaskBoard';

const MainContent: React.FC = () => {
  const { user, userProfile, coupleData, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'finances' | 'habits' | 'tasks'>('finances');
  const [scope, setScope] = useState<'all' | 'personal' | 'shared'>('all');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400 text-sm">
        Cargando Shared Life Hub...
      </div>
    );
  }

  if (!user) {
    return <AuthCard />;
  }

  if (userProfile && !userProfile.coupleId && !coupleData) {
    return <CoupleLinkCard />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scope={scope}
        setScope={setScope}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'finances' && <FinanceDashboard scope={scope} />}
        {activeTab === 'habits' && <HabitTracker scope={scope} />}
        {activeTab === 'tasks' && <TaskBoard scope={scope} />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;

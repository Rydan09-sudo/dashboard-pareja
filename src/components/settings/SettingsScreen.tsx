import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { User, Lock, HeartHandshake, Globe, Moon, Sun, Copy, Check, Link2, CheckCircle } from 'lucide-react';
import type { Language } from '../../types';

export const SettingsScreen: React.FC = () => {
  const { userProfile, coupleData, linkPartner, updateProfileName, language, setLanguage, theme, setTheme, t } = useAuth();

  // Name State
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);

  // Partner Link State
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Handle Save Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setNameLoading(true);
    try {
      await updateProfileName(displayName.trim());
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setNameLoading(false);
    }
  };

  // Handle Copy Code
  const handleCopyCode = () => {
    if (userProfile?.coupleCode) {
      navigator.clipboard.writeText(userProfile.coupleCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle Link Partner
  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCodeInput.trim()) return;
    setLinkError('');
    setLinkSuccess(false);
    setLinkLoading(true);

    try {
      await linkPartner(partnerCodeInput);
      setLinkSuccess(true);
      setPartnerCodeInput('');
      setTimeout(() => setLinkSuccess(false), 3000);
    } catch (err: any) {
      setLinkError(err.message || 'Error al vincular código');
    } finally {
      setLinkLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    if (newPassword.length < 6) {
      setPassError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Las contraseñas no coinciden');
      return;
    }

    if (!auth.currentUser || !auth.currentUser.email) return;

    setPassLoading(true);

    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, newPassword);
      setPassSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPassError('La contraseña actual es incorrecta');
      } else {
        setPassError('Error al actualizar contraseña. Vuelve a intentarlo.');
      }
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.settings}</h2>
        <p className="text-xs text-slate-500">Personaliza tu experiencia, perfil y vinculación</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Profile / Display Name */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
            <User className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.profileSettings}</h3>
          </div>

          <form onSubmit={handleSaveName} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.displayName}</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
              />
            </div>

            {nameSuccess && (
              <div className="flex items-center space-x-1 text-xs text-emerald-500">
                <CheckCircle className="w-4 h-4" />
                <span>Nombre guardado exitosamente</span>
              </div>
            )}

            <button
              type="submit"
              disabled={nameLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              {t.saveName}
            </button>
          </form>
        </div>

        {/* 2. Language & Theme */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
            <Globe className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.appearance}</h3>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{t.theme}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{t.themeLight}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>{t.themeDark}</span>
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">{t.language}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['es', 'en', 'pt'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`py-2 px-2 rounded-xl border text-xs font-medium transition-all uppercase tracking-wider ${
                    language === lang
                      ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {lang === 'es' ? '🇪🇸 ES' : lang === 'en' ? '🇬🇧 EN' : '🇧🇷 PT'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Partner Linking Section */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-pink-500">
              <HeartHandshake className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.linkTitle}</h3>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${coupleData ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'}`}>
              {coupleData ? t.partnerConnected : t.personalMode}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Display Code */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {t.yourCode}
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold tracking-widest text-slate-900 dark:text-white">
                  {userProfile?.coupleCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.copy}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Form to Link */}
            <form onSubmit={handleLink} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                {t.enterPartnerCode}
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  required
                  value={partnerCodeInput}
                  onChange={(e) => setPartnerCodeInput(e.target.value.toUpperCase())}
                  placeholder="EJ: X7A9K2"
                  className="flex-1 text-center font-mono tracking-widest uppercase py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={linkLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs flex items-center space-x-1 transition-colors disabled:opacity-50"
                >
                  <Link2 className="w-4 h-4" />
                  <span>{t.linkButton}</span>
                </button>
              </div>

              {linkError && (
                <div className="text-xs text-red-500">
                  {linkError}
                </div>
              )}

              {linkSuccess && (
                <div className="flex items-center space-x-1 text-xs text-emerald-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t.partnerLinkedSuccess}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* 4. Password Change Section */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
            <Lock className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.changePassword}</h3>
          </div>

          <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.currentPassword}</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.newPassword}</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{t.confirmPassword}</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
              />
            </div>

            {passError && (
              <div className="md:col-span-3 text-xs text-red-500">
                {passError}
              </div>
            )}

            {passSuccess && (
              <div className="md:col-span-3 flex items-center space-x-1 text-xs text-emerald-500">
                <CheckCircle className="w-4 h-4" />
                <span>Contraseña actualizada correctamente</span>
              </div>
            )}

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={passLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50"
              >
                {t.updatePasswordBtn}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

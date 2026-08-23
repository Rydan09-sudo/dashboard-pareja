import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { Link2, Copy, Check, LogOut, HeartHandshake } from 'lucide-react';

export const CoupleLinkCard: React.FC = () => {
  const { userProfile, linkPartner } = useAuth();
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCopyCode = () => {
    if (userProfile?.coupleCode) {
      navigator.clipboard.writeText(userProfile.coupleCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCodeInput.trim()) return;

    setError('');
    setLoading(true);

    try {
      await linkPartner(partnerCodeInput);
    } catch (err: any) {
      setError(err.message || 'Error al vincular el código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 mb-4">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Conecta con tu Pareja</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comparte tu código o ingresa el de tu pareja para sincronizar finanzas y hábitos.
          </p>
        </div>

        {/* My Code Section */}
        <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Tu Código Único
          </span>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xl font-bold tracking-wider text-slate-900 dark:text-white">
              {userProfile?.coupleCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Link Form */}
        <form onSubmit={handleLink} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Ingresa el código de tu pareja
            </label>
            <input
              type="text"
              required
              value={partnerCodeInput}
              onChange={(e) => setPartnerCodeInput(e.target.value.toUpperCase())}
              placeholder="EJ: X7A9K2"
              className="w-full text-center tracking-widest font-mono text-lg py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
          >
            <Link2 className="w-4 h-4" />
            <span>Vincular Cuentas</span>
          </button>
        </form>

        {/* Sign Out option */}
        <div className="mt-8 text-center">
          <button
            onClick={() => auth.signOut()}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

      </div>
    </div>
  );
};

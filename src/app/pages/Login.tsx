import React from 'react';
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Lock, User, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { BrandLogo } from '../components/BrandLogo';
import { getHomePath } from '../lib/permissions';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!user) return;
    navigate(getHomePath(user), { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await login(username.trim(), password);
    if (!result.ok) {
      setError(result.error ?? t('login.errorGeneric'));
      return;
    }
    navigate(result.redirectTo ?? '/products', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-3">
            <BrandLogo className="h-16 w-auto max-w-[220px] mx-auto object-center" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 text-center">{t('login.title')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              {t('login.hint')}
            </p>
          </div>

          {error && (
            <div className="mb-4 py-2.5 px-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('login.username')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="diyor"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('login.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800 dark:text-slate-100"
                  required
                  minLength={4}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors"
            >
              {t('login.submit')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          {t('layout.footer')}
        </p>
      </div>
    </div>
  );
}

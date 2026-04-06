import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { BrandLogo } from '../components/BrandLogo';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!user) return;
    const target = user.role === 'director' ? '/analytics' : '/products';
    navigate(target, { replace: true });
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(username, password);
    if (!result.ok) {
      setError(result.error ?? t('login.errorGeneric'));
      return;
    }
    const target = result.role === 'director' ? '/analytics' : '/products';
    navigate(target, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-3">
            <BrandLogo className="h-16 w-auto max-w-[220px] mx-auto object-center" />
            <h1 className="text-2xl font-semibold text-slate-800">{t('layout.title')}</h1>
            <p className="text-slate-600 text-sm max-w-md leading-relaxed">{t('layout.brandTagline')}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-slate-900 text-center">{t('login.title')}</h2>
            <p className="text-xs text-slate-500 text-center mt-2">
              {t('login.hint')}
            </p>
          </div>

          {error && (
            <div className="mb-4 py-2.5 px-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('login.username')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="например diyor"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
                  required
                  minLength={2}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('login.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
                  required
                  minLength={4}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              {t('login.submit')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          {t('layout.footer')}
        </p>
      </div>
    </div>
  );
}

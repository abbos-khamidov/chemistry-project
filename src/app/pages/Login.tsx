import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Lock, Mail, Phone, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      const result = register({ fullName, phone, email, password });
      if (!result.ok) {
        setError(result.error ?? 'Ошибка регистрации');
        return;
      }
    } else {
      const result = login(email, password);
      if (!result.ok) {
        setError(result.error ?? 'Ошибка входа');
        return;
      }
    }

    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-700 rounded-xl mb-4">
            <span className="text-2xl font-semibold text-white">W</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">Warehouse System</h1>
          <p className="text-slate-600 mt-1 text-sm">Управление складом и учёт</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                !isSignUp ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isSignUp ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Регистрация
            </button>
          </div>

          {error && (
            <div className="mb-4 py-2.5 px-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">ФИО</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Иван Иванов"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Телефон</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+998 90 123 45 67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {isSignUp ? 'Email' : 'Email или логин'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
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
              {isSignUp ? 'Создать аккаунт' : 'Войти'}
            </button>
          </form>

          {isSignUp && (
            <p className="text-xs text-slate-500 text-center mt-4">
              Демо: для входа после регистрации используйте введённый email и пароль.
            </p>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Сделано aisolution.uz
        </p>
      </div>
    </div>
  );
}

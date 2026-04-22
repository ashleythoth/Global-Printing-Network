import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Globe } from 'lucide-react';
import { useLanguage, Language } from '@/context/LanguageContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    setTimeout(() => {
      const success = login(normalizedEmail, password);
      if (success) {
        const users = JSON.parse(localStorage.getItem('printhub_users') || '[]');
        const user = users.find((u: any) => u.email.toLowerCase() === normalizedEmail);
        navigate(user?.role === 'admin' ? '/admin' : '/shop');
      } else {
        setError(t('login_error'));
      }
      setLoading(false);
    }, 400);
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language switcher */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <Globe size={14} className="text-gray-400 ml-2" />
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  language === lang.code
                    ? 'bg-[#1E3A5F] text-white shadow-sm'
                    : 'text-gray-500 hover:text-[#1E293B]'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Global Printing Network" className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4 shadow-lg" />
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">{t('login_title')}</h1>
          <p className="text-gray-500 mt-1">{t('login_subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-[#1E293B] mb-6">{t('login_heading')}</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#F43F5E] rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('login_email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
                spellCheck={false}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">{t('login_password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t('login_loading') : t('login_submit')}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('login_demo')}</p>
            <div className="space-y-2">
              <div className="bg-[#F8FAFC] rounded-lg px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-[#1E3A5F]">{t('login_admin')}:</span> admin@printhub.com / admin123
              </div>
              <div className="bg-[#F8FAFC] rounded-lg px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-[#2563EB]">{t('login_shop')}:</span> shop1@printhub.com / shop123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

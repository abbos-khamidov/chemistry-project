import { Languages } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

type Props = { className?: string };

export function LanguageSwitcher({ className = '' }: Props) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 ${className}`}
      title={t('lang.label')}
    >
      <Languages className="w-3.5 h-3.5 text-slate-500 ml-1 hidden sm:block" />
      <button
        type="button"
        onClick={() => setLocale('ru')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
          locale === 'ru' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {t('lang.ru')}
      </button>
      <button
        type="button"
        onClick={() => setLocale('uz')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
          locale === 'uz' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {t('lang.uz')}
      </button>
    </div>
  );
}

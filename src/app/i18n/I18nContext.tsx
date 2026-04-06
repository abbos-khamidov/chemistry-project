import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppLocale } from './types';
import { messages } from './messages';
import { formatUzsAmount } from '../lib/formatUzs';

const STORAGE_KEY = 'warehouse-locale';

function getString(obj: unknown, parts: string[]): string | undefined {
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur !== null && typeof cur === 'object' && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  t: (key: string) => string;
  formatUzs: (amount: number) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    if (typeof window === 'undefined') return 'ru';
    const s = localStorage.getItem(STORAGE_KEY);
    return s === 'uz' ? 'uz' : 'ru';
  });

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string) => {
      const parts = key.split('.');
      const tree = messages[locale];
      const s = getString(tree, parts);
      if (s !== undefined) return s;
      const fallback = messages.ru;
      return getString(fallback, parts) ?? key;
    },
    [locale]
  );

  const formatUzs = useCallback((amount: number) => formatUzsAmount(amount, locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, formatUzs }),
    [locale, setLocale, t, formatUzs]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export type { AppLocale } from './types';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router';
import { Bell, AlertTriangle } from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { productName } from '../lib/productLocale';
import { canAddProducts, canEditProducts } from '../lib/permissions';
import {
  formatAuditAtDisplay,
  formatDateDotDMY,
  daysLeftUntilExpiration,
  parseExpirationDateYmd,
} from '../lib/warehouseUtils';

const MAX_ITEMS = 50;
const EXPIRY_MILESTONES = [30, 7, 3] as const;
const MAX_EXPIRY_ITEMS = 30;
const EXPIRY_READ_STORAGE = 'warehouse-expiry-read-v1';

function loadExpiryReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(EXPIRY_READ_STORAGE);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveExpiryReadSet(next: Set<string>) {
  try {
    localStorage.setItem(EXPIRY_READ_STORAGE, JSON.stringify([...next]));
  } catch {
    /* ignore */
  }
}

function expiryDismissKey(productId: string, expirationYmd: string, daysLeft: number) {
  return `${productId}|${expirationYmd}|${daysLeft}`;
}

export function NotificationsPopover() {
  const { products, auditLog, readAuditIds, markAuditRead, markAllAuditRead } = useWarehouse();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [expiryReadBump, setExpiryReadBump] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const showExpiryAlerts = Boolean(user && (canEditProducts(user) || canAddProducts(user)));

  const expiryReadSet = useMemo(() => {
    void expiryReadBump;
    return loadExpiryReadSet();
  }, [expiryReadBump]);

  const expiryRows = useMemo(() => {
    if (!showExpiryAlerts) return [] as Array<{
      kind: 'expiry';
      product: (typeof products)[number];
      daysLeft: number;
      ymd: string;
      key: string;
      read: boolean;
    }>;

    const out: Array<{
      kind: 'expiry';
      product: (typeof products)[number];
      daysLeft: number;
      ymd: string;
      key: string;
      read: boolean;
    }> = [];

    for (const product of products) {
      if (!product.quantity || product.quantity <= 0) continue;
      const daysLeft = daysLeftUntilExpiration(product.expirationDate);
      if (daysLeft === null) continue;
      if (!EXPIRY_MILESTONES.includes(daysLeft as (typeof EXPIRY_MILESTONES)[number])) continue;

      const ymd = parseExpirationDateYmd(product.expirationDate) ?? '';
      const key = expiryDismissKey(product.id, ymd, daysLeft);
      out.push({
        kind: 'expiry',
        product,
        daysLeft,
        ymd,
        key,
        read: expiryReadSet.has(key),
      });
    }

    out.sort((a, b) => a.daysLeft - b.daysLeft);
    return out;
  }, [products, showExpiryAlerts, expiryReadSet]);

  const expiryShown = expiryRows.slice(0, MAX_EXPIRY_ITEMS);
  const auditSlots = Math.max(0, MAX_ITEMS - expiryShown.length);
  const auditRows = auditLog.slice(0, auditSlots);

  const displayedRows = useMemo(() => {
    type Row =
      | { kind: 'expiry'; key: string; read: boolean; product: (typeof expiryRows)[0]['product']; daysLeft: number }
      | { kind: 'audit'; key: string; read: boolean; entry: (typeof auditLog)[0] };
    const out: Row[] = expiryShown.map((e) => ({
      kind: 'expiry',
      key: e.key,
      read: e.read,
      product: e.product,
      daysLeft: e.daysLeft,
    }));
    for (const entry of auditRows) {
      out.push({
        kind: 'audit',
        key: entry.id,
        read: readAuditIds.includes(entry.id),
        entry,
      });
    }
    return out;
  }, [expiryShown, auditRows, readAuditIds]);

  const unreadCount = useMemo(
    () => displayedRows.filter((r) => !r.read).length,
    [displayedRows]
  );

  const dismissExpiryOne = useCallback((key: string) => {
    const s = loadExpiryReadSet();
    s.add(key);
    saveExpiryReadSet(s);
    setExpiryReadBump((b) => b + 1);
  }, []);

  const markAllReadCombined = useCallback(() => {
    markAllAuditRead();
    const s = loadExpiryReadSet();
    for (const e of expiryShown) {
      s.add(e.key);
    }
    saveExpiryReadSet(s);
    setExpiryReadBump((b) => b + 1);
  }, [markAllAuditRead, expiryShown]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('notifications.title')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-amber-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-[min(calc(100vw-2rem),22rem)] max-h-[min(70vh,28rem)] overflow-hidden flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg"
          role="dialog"
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{t('notifications.title')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('notifications.subtitle').replace('{days}', EXPIRY_MILESTONES.join('/'))}</p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllReadCombined}
                  className="shrink-0 text-xs font-medium text-slate-700 dark:text-slate-200 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {displayedRows.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 px-2 py-6 text-center">{t('notifications.empty')}</p>
            ) : (
              <ul className="space-y-1">
                {displayedRows.map((row) => {
                  if (row.kind === 'expiry') {
                    const name = productName(row.product, locale);
                    const dateStr = formatDateDotDMY(row.product.expirationDate);
                    const details = t('notifications.expiryLine')
                      .replace('{name}', name)
                      .replace('{days}', String(row.daysLeft))
                      .replace('{date}', dateStr);
                    return (
                      <li
                        key={row.key}
                        className={`rounded-lg border text-left p-3 text-sm ${
                          row.read
                            ? 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900'
                            : 'border-amber-200 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-900/25'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" aria-hidden />
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-amber-800 dark:text-amber-200/90">
                                {t('notifications.expiryKind')}
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 break-words">{details}</p>
                              <Link
                                to={`/products/${row.product.id}`}
                                className="inline-block mt-2 text-xs font-medium text-slate-700 dark:text-slate-200 underline underline-offset-2 hover:text-slate-900 dark:hover:text-white"
                                onClick={() => setOpen(false)}
                              >
                                {t('notifications.openProduct')}
                              </Link>
                            </div>
                          </div>
                          {!row.read && (
                            <button
                              type="button"
                              onClick={() => dismissExpiryOne(row.key)}
                              className="shrink-0 text-xs font-medium text-slate-700 dark:text-slate-200 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              {t('notifications.markRead')}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  }
                  const r = row.entry;
                  return (
                    <li
                      key={r.id}
                      className={`rounded-lg border text-left p-3 text-sm ${
                        row.read
                          ? 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900'
                          : 'border-amber-100 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{formatAuditAtDisplay(r.at)}</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{r.userName}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            <span className="font-medium">{r.action}</span>
                            <span className="text-slate-400 dark:text-slate-500"> · </span>
                            <span>{r.entity}</span>
                          </p>
                          {r.details ? (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 break-words">{r.details}</p>
                          ) : null}
                        </div>
                        {!row.read && (
                          <button
                            type="button"
                            onClick={() => markAuditRead(r.id)}
                            className="shrink-0 text-xs font-medium text-slate-700 dark:text-slate-200 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            {t('notifications.markRead')}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useI18n } from '../i18n/I18nContext';

const MAX_ITEMS = 50;

export function NotificationsPopover() {
  const { auditLog, readAuditIds, markAuditRead } = useWarehouse();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => auditLog.slice(0, MAX_ITEMS), [auditLog]);

  const unreadCount = useMemo(
    () => rows.filter((r) => !readAuditIds.includes(r.id)).length,
    [rows, readAuditIds]
  );

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
        className="relative p-2 hover:bg-slate-100 rounded-lg text-slate-600"
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
          className="absolute right-0 top-full mt-1 z-50 w-[min(calc(100vw-2rem),22rem)] max-h-[min(70vh,28rem)] overflow-hidden flex flex-col rounded-xl border border-slate-200 bg-white shadow-lg"
          role="dialog"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900 text-sm">{t('notifications.title')}</p>
            <p className="text-xs text-slate-500 mt-0.5">{t('notifications.subtitle')}</p>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {rows.length === 0 ? (
              <p className="text-sm text-slate-500 px-2 py-6 text-center">{t('notifications.empty')}</p>
            ) : (
              <ul className="space-y-1">
                {rows.map((r) => {
                  const read = readAuditIds.includes(r.id);
                  return (
                    <li
                      key={r.id}
                      className={`rounded-lg border text-left p-3 text-sm ${
                        read ? 'border-slate-100 bg-white' : 'border-amber-100 bg-amber-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-slate-500 tabular-nums">{r.at}</p>
                          <p className="font-medium text-slate-900 mt-0.5">{r.userName}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            <span className="font-medium">{r.action}</span>
                            <span className="text-slate-400"> · </span>
                            <span>{r.entity}</span>
                          </p>
                          {r.details ? (
                            <p className="text-xs text-slate-600 mt-1.5 break-words">{r.details}</p>
                          ) : null}
                        </div>
                        {!read && (
                          <button
                            type="button"
                            onClick={() => markAuditRead(r.id)}
                            className="shrink-0 text-xs font-medium text-slate-700 px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
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

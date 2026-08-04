import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Archive, FileDown, Package, RotateCcw, Search, Trash2, UserCircle } from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useI18n } from '../i18n/I18nContext';
import { productName } from '../lib/productLocale';
import { compareClientSalesNewestFirst, formatDateDotDMY } from '../lib/warehouseUtils';
import { formatPhoneDisplay } from '../lib/phone';
import { exportClientsToXlsx } from '../lib/exportXlsx';
import { useAuth } from '../context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import type { ClientSale } from '../data/mockData';

type ClientView = 'active' | 'archive';
type PendingAction = 'archive' | 'restore' | 'delete';

export default function Clients() {
  const { clientSales, products, archiveClientSale, restoreClientSale, deleteClientSale, appendAudit } = useWarehouse();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [q, setQ] = useState('');
  const [view, setView] = useState<ClientView>('active');
  const [pending, setPending] = useState<{ action: PendingAction; sale: ClientSale } | null>(null);

  const activeRows = useMemo(
    () => [...(clientSales ?? [])].filter((r) => !r.archivedAt).sort(compareClientSalesNewestFirst),
    [clientSales]
  );

  const archivedRows = useMemo(
    () => [...(clientSales ?? [])].filter((r) => r.archivedAt).sort(compareClientSalesNewestFirst),
    [clientSales]
  );

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = view === 'archive' ? archivedRows : activeRows;
    if (!s) return list;
    return list.filter((r) => {
      const blob = [r.fullName, r.phone, r.productName, r.company ?? ''].join(' ').toLowerCase();
      return blob.includes(s);
    });
  }, [activeRows, archivedRows, q, view]);

  const total = rows.reduce((sum, r) => sum + r.amountUzs, 0);
  const pendingTitle =
    pending?.action === 'archive'
      ? t('clients.confirmArchiveTitle')
      : pending?.action === 'restore'
        ? t('clients.confirmRestoreTitle')
        : t('clients.confirmDeleteTitle');
  const pendingDescription =
    pending?.action === 'archive'
      ? t('clients.confirmArchiveDesc')
      : pending?.action === 'restore'
        ? t('clients.confirmRestoreDesc')
        : t('clients.confirmDeleteDesc');
  const pendingConfirm =
    pending?.action === 'archive'
      ? t('clients.archive')
      : pending?.action === 'restore'
        ? t('clients.restore')
        : t('common.delete');

  const confirmPending = () => {
    if (!pending) return;
    const { sale, action } = pending;
    const result =
      action === 'archive'
        ? archiveClientSale(sale.id)
        : action === 'restore'
          ? restoreClientSale(sale.id)
          : deleteClientSale(sale.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    appendAudit({
      userName: user?.fullName ?? '—',
      userRole: (user?.role as any) ?? 'worker',
      action: action === 'archive' ? 'Архивирование' : action === 'restore' ? 'Восстановление' : 'Удаление',
      entity: 'Клиент',
      details: `${sale.fullName}, ${sale.productName}, ${sale.amountUzs.toLocaleString()} UZS`,
      ip: '—',
    });
    toast.success(
      action === 'archive'
        ? t('clients.toastArchived')
        : action === 'restore'
          ? t('clients.toastRestored')
          : t('clients.toastDeleted')
    );
    setPending(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('clients.pageTitle')}</h1>
          <p className="text-slate-600 mt-1">{t('clients.pageSubtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-3 text-right">
            <p className="text-xs text-slate-500">{t('clients.totalPeriod')}</p>
            <p className="text-lg font-semibold text-slate-900">{total.toLocaleString()} UZS</p>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                exportClientsToXlsx(rows);
                toast.success('Файл готов', { description: 'clients.xlsx скачан' });
              } catch {
                toast.error('Не удалось сформировать файл');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 whitespace-nowrap"
          >
            <FileDown className="w-4 h-4" />
            Выгрузить в Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="inline-flex w-full sm:w-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setView('active')}
              className={`min-h-10 flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                view === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCircle className="w-4 h-4" />
              {t('clients.tabActive')}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{activeRows.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setView('archive')}
              className={`min-h-10 flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                view === 'archive' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="w-4 h-4" />
              {t('clients.tabArchive')}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{archivedRows.length}</span>
            </button>
          </div>
          <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t('clients.searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-800"
          />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('clients.colDate')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('clients.colClient')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('clients.colProduct')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('clients.colQty')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('clients.colAmount')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">{t('clients.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const pr = products.find((p) => p.id === r.productId);
                const name = pr ? productName(pr, locale) : r.productName;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{formatDateDotDMY(r.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900">{r.fullName}</p>
                          <p className="text-xs text-slate-500">{formatPhoneDisplay(r.phone)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/products/${r.productId}`}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 hover:underline"
                      >
                        <Package className="w-3.5 h-3.5" />
                        {name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                      {r.amountUzs.toLocaleString()} UZS
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {view === 'archive' ? (
                          <button
                            type="button"
                            onClick={() => setPending({ action: 'restore', sale: r })}
                            className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                            {t('clients.restore')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPending({ action: 'archive', sale: r })}
                            className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Archive className="w-4 h-4" />
                            {t('clients.archive')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPending({ action: 'delete', sale: r })}
                          className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="p-12 text-center text-slate-600">
            <p>{t('clients.empty')}</p>
          </div>
        )}
      </div>
      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.sale.fullName ? `${pendingDescription} ${pending.sale.fullName}` : pendingDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPending}
              className={pending?.action === 'delete' ? 'bg-red-600 text-white hover:bg-red-700' : undefined}
            >
              {pendingConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

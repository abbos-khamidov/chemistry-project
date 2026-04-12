import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Search, UserCircle, Package } from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useI18n } from '../i18n/I18nContext';
import { productName } from '../lib/productLocale';
import { compareClientSalesNewestFirst, formatDateDotDMY } from '../lib/warehouseUtils';
import { formatPhoneDisplay } from '../lib/phone';

export default function Clients() {
  const { clientSales, products } = useWarehouse();
  const { t, locale } = useI18n();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = [...(clientSales ?? [])].sort(compareClientSalesNewestFirst);
    if (!s) return list;
    return list.filter((r) => {
      const blob = [r.fullName, r.phone, r.productName, r.company ?? ''].join(' ').toLowerCase();
      return blob.includes(s);
    });
  }, [clientSales, q]);

  const total = rows.reduce((sum, r) => sum + r.amountUzs, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('clients.pageTitle')}</h1>
          <p className="text-slate-600 mt-1">{t('clients.pageSubtitle')}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-3 text-right">
          <p className="text-xs text-slate-500">{t('clients.totalPeriod')}</p>
          <p className="text-lg font-semibold text-slate-900">{total.toLocaleString()} UZS</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-6">
        <div className="relative">
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
    </div>
  );
}

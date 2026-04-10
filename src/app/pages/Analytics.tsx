import { useMemo, useState } from 'react';
import { format, eachMonthOfInterval, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { uz } from 'date-fns/locale/uz';
import { toast } from 'sonner';
import { Download, Calendar, TrendingUp, TrendingDown, Banknote, Package, FileText } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useWarehouse } from '../context/WarehouseContext';
import { useI18n } from '../i18n/I18nContext';
import { dateInRange } from '../lib/warehouseUtils';
import { exportAnalyticsToXlsx } from '../lib/exportAnalyticsXlsx';

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

export default function Analytics() {
  const { products, debts, clientSales } = useWarehouse();
  const { t, formatUzs, locale } = useI18n();
  const dateFnsLocale = useMemo(() => (locale === 'uz' ? uz : ru), [locale]);
  const dr = defaultRange();
  const [startDate, setStartDate] = useState(dr.start);
  const [endDate, setEndDate] = useState(dr.end);

  const stats = useMemo(() => {
    const totalWarehouseValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const totalDebtsRemaining = debts
      .filter((d) => d.status !== 'paid')
      .reduce((sum, d) => sum + d.remainingAmount, 0);
    let operationsInRange = 0;
    for (const p of products) {
      for (const h of p.history) {
        if (dateInRange(h.date, startDate, endDate)) operationsInRange++;
      }
    }
    let collectedDebtInRange = 0;
    for (const d of debts) {
      for (const ph of d.paymentHistory) {
        if (dateInRange(ph.date, startDate, endDate)) collectedDebtInRange += ph.amount;
      }
    }
    let collectedSalesInRange = 0;
    for (const sale of clientSales ?? []) {
      if (dateInRange(sale.date, startDate, endDate)) collectedSalesInRange += sale.amountUzs;
    }
    const collectedInRange = collectedDebtInRange + collectedSalesInRange;
    const overdueDebts = debts.filter((d) => d.status === 'overdue').length;
    return {
      totalWarehouseValue,
      totalDebtsRemaining,
      collectedInRange,
      collectedDebtInRange,
      collectedSalesInRange,
      operationsInRange,
      overdueDebts,
    };
  }, [products, debts, clientSales, startDate, endDate]);

  const monthlyInventoryData = useMemo(() => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (start > end) return [];
      const months = eachMonthOfInterval({ start, end });
      return months.map((m) => {
        const key = format(m, 'yyyy-MM');
        let operations = 0;
        let valueDelta = 0;
        for (const p of products) {
          for (const h of p.history) {
            if (h.date.slice(0, 7) !== key) continue;
            if (!dateInRange(h.date, startDate, endDate)) continue;
            operations += 1;
            valueDelta += Math.abs(h.quantity) * p.price;
          }
        }
        return {
          month: format(m, 'LLL yy', { locale: dateFnsLocale }),
          value: valueDelta,
          operations,
        };
      });
    } catch {
      return [];
    }
  }, [products, startDate, endDate, dateFnsLocale]);

  const debtAnalytics = useMemo(() => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (start > end) return [];
      const months = eachMonthOfInterval({ start, end });
      return months.map((m) => {
        const key = format(m, 'yyyy-MM');
        let paid = 0;
        for (const d of debts) {
          for (const ph of d.paymentHistory) {
            if (ph.date.slice(0, 7) === key && dateInRange(ph.date, startDate, endDate)) {
              paid += ph.amount;
            }
          }
        }
        let unpaid = 0;
        for (const d of debts) {
          if (d.status === 'paid') continue;
          if (d.issueDate.slice(0, 7) === key && dateInRange(d.issueDate, startDate, endDate)) {
            unpaid += d.remainingAmount;
          }
        }
        return { month: format(m, 'LLL yy', { locale: dateFnsLocale }), paid, unpaid };
      });
    } catch {
      return [];
    }
  }, [debts, startDate, endDate, dateFnsLocale]);

  const topProducts = useMemo(() => {
    return [...products]
      .map((p) => ({ name: p.name, quantity: p.quantity, value: p.price * p.quantity }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  const handleExport = () => {
    try {
      exportAnalyticsToXlsx({
        startDate,
        endDate,
        t,
        stats,
        monthlyInventoryData,
        debtAnalytics,
        topProducts,
        totalWarehouseValue,
      });
      toast.success(t('analytics.exportToastTitle'), {
        description: `${startDate} — ${endDate}. ${t('analytics.exportToastDesc')}`,
      });
    } catch {
      toast.error(t('analytics.exportError'));
    }
  };

  const totalWarehouseValue = stats.totalWarehouseValue;
  const totalDebtsRemaining = stats.totalDebtsRemaining;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('analytics.pageTitle')}</h1>
            <p className="text-slate-600 mt-1">{t('analytics.pageSubtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">{t('analytics.periodStart')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">{t('analytics.periodEnd')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors sm:ml-auto"
            >
              <Download className="w-4 h-4" />
              <span>{t('analytics.export')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-600 mb-1">{t('analytics.cardWarehouseValue')}</p>
          <p className="text-2xl font-bold text-slate-900 break-words">{formatUzs(totalWarehouseValue)}</p>
          <p className="text-xs text-slate-500 mt-1">{t('analytics.cardWarehouseHint')}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Banknote className="w-5 h-5 text-emerald-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-600 mb-1">{t('analytics.cardCollected')}</p>
          <p className="text-2xl font-bold text-slate-900 break-words">{formatUzs(stats.collectedInRange)}</p>
          <p className="text-xs text-slate-500 mt-1">{t('analytics.cardCollectedHint')}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <TrendingDown className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-sm text-slate-600 mb-1">{t('analytics.cardDebts')}</p>
          <p className="text-2xl font-bold text-slate-900 break-words">{formatUzs(totalDebtsRemaining)}</p>
          <p className="text-xs text-amber-600 mt-1">{stats.overdueDebts} {t('analytics.cardOverdue')}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-600 mb-1">{t('analytics.cardOps')}</p>
          <p className="text-2xl font-bold text-slate-900">{stats.operationsInRange}</p>
          <p className="text-xs text-slate-500 mt-1">{t('analytics.cardOpsHint')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{t('analytics.chartInventory')}</h3>
            <span className="text-xs text-slate-600">
              {startDate} — {endDate}
            </span>
          </div>
          {monthlyInventoryData.length === 0 ? (
            <p className="text-slate-600 text-sm py-8 text-center">{t('analytics.chartInventoryEmpty')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyInventoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(v: number) => [formatUzs(Number(v)), t('analytics.tooltipValue')]}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="value" stroke="#475569" strokeWidth={3} dot={{ r: 4 }} name={t('analytics.lineTurnover')} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{t('analytics.chartCollectionsBreakdown')}</h3>
            <span className="text-xs text-slate-600">{t('analytics.chartCollectionsBreakdownHint')}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBar
              data={[
                {
                  month: t('analytics.periodLabel'),
                  debtPayments: stats.collectedDebtInRange,
                  directSales: stats.collectedSalesInRange,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                formatter={(v: number) => [formatUzs(Number(v)), t('analytics.tooltipValue')]}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="debtPayments" fill="#10b981" radius={[8, 8, 0, 0]} name={t('analytics.seriesDebtPayments')} />
              <Bar dataKey="directSales" fill="#3b82f6" radius={[8, 8, 0, 0]} name={t('analytics.seriesDirectSales')} />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{t('analytics.chartDebts')}</h3>
            <span className="text-xs text-slate-600">{t('analytics.chartDebtsHint')}</span>
          </div>
          {debtAnalytics.length === 0 ? (
            <p className="text-slate-600 text-sm py-8 text-center">{t('analytics.chartDebtsEmpty')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBar data={debtAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(v: number) => [formatUzs(Number(v)), t('analytics.tooltipValue')]}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="paid" fill="#10b981" radius={[8, 8, 0, 0]} name={t('analytics.barPaid')} />
                <Bar dataKey="unpaid" fill="#ef4444" radius={[8, 8, 0, 0]} name={t('analytics.barUnpaid')} />
              </RechartsBar>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{t('analytics.chartMonthlyOps')}</h3>
            <span className="text-xs text-slate-600">{t('analytics.chartMonthlyOpsHint')}</span>
          </div>
          {monthlyInventoryData.length === 0 ? (
            <p className="text-slate-600 text-sm py-8 text-center">{t('analytics.chartDebtsEmpty')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBar data={monthlyInventoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(v: number) => [String(v), t('analytics.tooltipOps')]}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="operations" fill="#64748b" radius={[8, 8, 0, 0]} />
              </RechartsBar>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">{t('analytics.topTitle')}</h3>
        </div>
        {topProducts.length === 0 ? (
          <p className="text-slate-600 text-sm">{t('analytics.topEmpty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">{t('analytics.colNo')}</th>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">{t('analytics.colProduct')}</th>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">{t('analytics.colQty')}</th>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">{t('analytics.colValue')}</th>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">{t('analytics.colShare')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.map((product, index) => {
                  const contribution =
                    totalWarehouseValue > 0 ? ((product.value / totalWarehouseValue) * 100).toFixed(1) : '0';
                  return (
                    <tr key={product.name} className="hover:bg-slate-50">
                      <td className="py-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 font-medium text-slate-900">{product.name}</td>
                      <td className="py-4 text-slate-600">{product.quantity}</td>
                      <td className="py-4 font-medium text-slate-900">{formatUzs(product.value)}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                            <div className="h-full bg-slate-500 rounded-full" style={{ width: `${contribution}%` }} />
                          </div>
                          <span className="text-sm text-slate-600">{contribution}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

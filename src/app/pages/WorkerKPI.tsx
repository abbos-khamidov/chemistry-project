import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Target, TrendingUp } from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useI18n } from '../i18n/I18nContext';
import { kpiInDateRange } from '../lib/warehouseUtils';

export default function WorkerKPI() {
  const { workerKpis } = useWarehouse();
  const { t } = useI18n();
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const filtered = useMemo(
    () =>
      workerKpis.filter((k) => kpiInDateRange(k.periodStart, k.periodEnd, startDate, endDate)),
    [workerKpis, startDate, endDate]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t("workerKpi.pageTitle")}</h1>
        <p className="text-slate-600 mt-1">{t("workerKpi.pageSubtitle")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div>
          <label className="block text-xs text-slate-600 mb-1">{t("workerKpi.periodStart")}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">{t("workerKpi.periodEnd")}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-600">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p>{t("workerKpi.empty")}</p>
          <p className="text-sm mt-2">{t("workerKpi.emptyHint")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filtered.map((k) => (
              <div key={`${k.userId}-${k.periodStart}`} className="bg-white rounded-xl border border-slate-200/80 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      {k.periodStart} — {k.periodEnd}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{k.period}</p>
                    <h2 className="text-lg font-semibold text-slate-900 mt-1">{k.fullName}</h2>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-600">{t("workerKpi.ops")}</dt>
                    <dd className="font-semibold text-slate-900">{k.operationsCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">{t("workerKpi.accuracy")}</dt>
                    <dd className="font-semibold text-emerald-700">{k.receptionAccuracy}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">{t("workerKpi.deadlines")}</dt>
                    <dd className="font-semibold text-slate-900">{k.deadlineCompliance}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">{t("workerKpi.tasksOnTime")}</dt>
                    <dd className="font-semibold text-slate-900">{k.tasksOnTime}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">{t("workerKpi.tableTitle")}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 text-slate-600">{t("workerKpi.colEmployee")}</th>
                    <th className="text-left py-2 text-slate-600">{t("workerKpi.colPeriod")}</th>
                    <th className="text-right py-2 text-slate-600">{t("workerKpi.colOps")}</th>
                    <th className="text-right py-2 text-slate-600">{t("workerKpi.colAcc")}</th>
                    <th className="text-right py-2 text-slate-600">{t("workerKpi.colDead")}</th>
                    <th className="text-right py-2 text-slate-600">{t("workerKpi.colOnTime")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((k) => (
                    <tr key={`${k.userId}-${k.periodStart}-row`}>
                      <td className="py-3 font-medium text-slate-900">{k.fullName}</td>
                      <td className="py-3 text-slate-600">
                        {k.periodStart} — {k.periodEnd}
                      </td>
                      <td className="py-3 text-right">{k.operationsCount}</td>
                      <td className="py-3 text-right">{k.receptionAccuracy}</td>
                      <td className="py-3 text-right">{k.deadlineCompliance}</td>
                      <td className="py-3 text-right">{k.tasksOnTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

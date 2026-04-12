import { Search, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useWarehouse } from '../context/WarehouseContext';
import { useI18n } from '../i18n/I18nContext';
import { formatAuditAtDisplay } from '../lib/warehouseUtils';

export default function Audit() {
  const { auditLog } = useWarehouse();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'director' | 'worker'>('all');

  const rows = useMemo(() => {
    return auditLog.filter((e) => {
      if (roleFilter !== 'all' && e.userRole !== roleFilter) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return (
        e.userName.toLowerCase().includes(s) ||
        e.action.toLowerCase().includes(s) ||
        e.entity.toLowerCase().includes(s) ||
        e.details.toLowerCase().includes(s)
      );
    });
  }, [auditLog, q, roleFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t("audit.pageTitle")}</h1>
        <p className="text-slate-600 mt-1">{t("audit.pageSubtitle")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            placeholder={t("audit.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-500" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'director' | 'worker')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="all">{t("audit.filterAll")}</option>
            <option value="director">{t("audit.filterDirector")}</option>
            <option value="worker">{t("audit.filterWorker")}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-600">{t("audit.colTime")}</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">{t("audit.colUser")}</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">{t("audit.colRole")}</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">{t("audit.colAction")}</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">{t("audit.colEntity")}</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">{t("audit.colDetails")}</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">{t("audit.colIp")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{formatAuditAtDisplay(r.at)}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{r.userName}</td>
                  <td className="py-3 px-4">
                    <span
                      className={
                        r.userRole === 'director'
                          ? 'text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full'
                          : 'text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full'
                      }
                    >
                      {r.userRole === "director" ? t("common.roleDirectorShort") : t("common.roleWorkerShort")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{r.action}</td>
                  <td className="py-3 px-4 text-slate-700">{r.entity}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={r.details}>
                    {r.details}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-xs">{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {rows.length === 0 && (
        <p className="text-center text-slate-600 mt-6 text-sm">{t("audit.empty")}</p>
      )}
    </div>
  );
}

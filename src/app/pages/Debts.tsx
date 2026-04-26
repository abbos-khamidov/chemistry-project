import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Search,
  Filter,
  FileText,
  Phone,
  Calendar,
  Banknote,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { debtLineProductName } from '../lib/productLocale';
import { compareDebtsNewestFirst, formatDateDotDMY } from '../lib/warehouseUtils';
import { formatPhoneDisplay } from '../lib/phone';

export default function Debts() {
  const { debts, products } = useWarehouse();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isDirector = user?.role === 'director';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredDebts = useMemo(() => {
    const rows = debts.filter((debt) => {
      const matchesSearch =
        debt.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.phone.includes(searchQuery) ||
        (debt.company ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || debt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    return [...rows].sort(compareDebtsNewestFirst);
  }, [debts, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'active':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'partial':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return t('common.debtStatusPaid');
      case 'active':
        return t('common.debtStatusActive');
      case 'partial':
        return t('common.debtStatusPartial');
      case 'overdue':
        return t('common.debtStatusOverdue');
      default:
        return status;
    }
  };

  const totalDebts = filteredDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const overdueCount = filteredDebts.filter((d) => d.status === 'overdue').length;
  const activeCount = filteredDebts.filter((d) => d.status === 'active' || d.status === 'partial').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('debts.pageTitle')}</h1>
          <p className="text-slate-600 mt-1">
            {t('debts.records')}: {filteredDebts.length}
          </p>
          {!isDirector && (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3 max-w-2xl">
              {t('debts.workerHint')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">{t('debts.statActive')}</p>
              <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">{t('debts.statOverdue')}</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Banknote className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">{t('debts.statTotal')}</p>
              <p className="text-2xl font-bold text-slate-900">{totalDebts.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-1">UZS</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={t('debts.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
          >
            <option value="all">{t('debts.filterAllStatus')}</option>
            <option value="active">{t('common.debtStatusActive')}</option>
            <option value="partial">{t('common.debtStatusPartial')}</option>
            <option value="overdue">{t('common.debtStatusOverdue')}</option>
            <option value="paid">{t('common.debtStatusPaid')}</option>
          </select>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="text-sm text-slate-600">
            {t('debts.foundLine')}: {filteredDebts.length}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {filteredDebts.map((debt) => (
          <Link
            key={debt.id}
            to={`/debts/${debt.id}`}
            className="block bg-white rounded-xl border border-slate-200/80 p-6 hover:border-slate-400 hover:shadow-md transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{debt.fullName}</h3>
                  {debt.company && <p className="text-sm text-slate-500 mt-0.5">{debt.company}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      <span>{formatPhoneDisplay(debt.phone)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {t('debts.dueLabel')}: {formatDateDotDMY(debt.dueDate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {debt.products.slice(0, 2).map((product, idx) => (
                      <span
                        key={`${product.productId}-${idx}`}
                        className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full"
                      >
                        {debtLineProductName(product.productId, product.productName, products, locale)} ×{' '}
                        {product.quantity}
                      </span>
                    ))}
                    {debt.products.length > 2 && (
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                        +{debt.products.length - 2} {t('debts.moreProducts')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between lg:justify-end gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-600 mb-1">{t('debts.remaining')}</p>
                  <p className="text-xl font-bold text-slate-900">{debt.remainingAmount.toLocaleString()} UZS</p>
                  {debt.paidAmount > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">
                      {t('debts.paidPart')}: {debt.paidAmount.toLocaleString()} UZS
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap ${getStatusColor(debt.status)}`}
                  >
                    {getStatusLabel(debt.status)}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </div>
            {debt.status === 'overdue' && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t('debts.overdueBanner')}</span>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {filteredDebts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">{t('debts.emptyTitle')}</h3>
          <p className="text-slate-600 mb-4">{t('debts.emptyHint')}</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-slate-600 hover:underline"
          >
            {t('common.resetFilters')}
          </button>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Phone,
  Calendar,
  DollarSign,
  ChevronRight,
  AlertCircle,
  X,
  Trash2,
} from 'lucide-react';
import type { Debt } from '../data/mockData';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { debtLineProductName, productName } from '../lib/productLocale';

type DebtLine = { id: string; productId: string; quantity: string };

function newLine(): DebtLine {
  return { id: `l-${crypto.randomUUID()}`, productId: '', quantity: '1' };
}

export default function Debts() {
  const { debts, products, addDebt, appendAudit } = useWarehouse();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isDirector = user?.role === 'director';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DebtLine[]>(() => [newLine()]);

  const filteredDebts = debts.filter((debt) => {
    const matchesSearch =
      debt.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      debt.phone.includes(searchQuery) ||
      (debt.company ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || debt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const computedTotal = useMemo(() => {
    let sum = 0;
    for (const line of lines) {
      if (!line.productId) continue;
      const p = products.find((x) => x.id === line.productId);
      const q = Number(line.quantity);
      if (!p || !Number.isInteger(q) || q <= 0) continue;
      sum += q * p.price;
    }
    return sum;
  }, [lines, products]);

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

  const resetModal = () => {
    setFullName('');
    setPhone('');
    setCompany('');
    setIssueDate('');
    setDueDate('');
    setNotes('');
    setLines([newLine()]);
  };

  const submitDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error(t('debts.toastName'));
      return;
    }
    const productRows: Debt['products'] = [];
    for (const line of lines) {
      if (!line.productId) continue;
      const p = products.find((x) => x.id === line.productId);
      const q = Number(line.quantity);
      if (!p) continue;
      if (!Number.isInteger(q) || q <= 0) {
        toast.error(t('debts.toastQtyInteger'));
        return;
      }
      if (q > p.quantity) {
        toast.error(t('debts.toastStockExceeded').replace('{name}', productName(p, locale)));
        return;
      }
      productRows.push({
        productId: p.id,
        productName: p.name,
        quantity: q,
        price: p.price,
      });
    }
    if (productRows.length === 0) {
      toast.error(t('debts.toastLine'));
      return;
    }
    const total = productRows.reduce((s, row) => s + row.quantity * row.price, 0);
    if (total <= 0) {
      toast.error(t('debts.toastSum'));
      return;
    }

    const row: Omit<Debt, 'id'> = {
      fullName: fullName.trim(),
      phone: phone.trim() || '—',
      company: company.trim() || undefined,
      createdByRole: isDirector ? 'director' : 'worker',
      createdByUserId: user?.id,
      totalAmount: total,
      paidAmount: 0,
      remainingAmount: total,
      issueDate: issueDate || new Date().toISOString().slice(0, 10),
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      status: 'active',
      products: productRows,
      debtHistory: [],
      paymentHistory: [],
      notes: notes.trim() || undefined,
    };
    const result = addDebt(row);
    if (!result.ok) {
      toast.error(result.error || t('debts.toastStockFailed'));
      return;
    }
    appendAudit({
      userName: user?.fullName ?? '—',
      userRole: isDirector ? 'director' : 'worker',
      action: 'Создание',
      entity: 'Долг',
      details: `${fullName.trim()}, ${total.toLocaleString()} UZS, позиций: ${productRows.length}`,
      ip: '—',
    });
    toast.success(t('debts.toastOk'));
    setModalOpen(false);
    resetModal();
  };

  const addDebtLine = () => setLines((prev) => [...prev, newLine()]);
  const removeDebtLine = (lineId: string) =>
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== lineId)));
  const updateLine = (lineId: string, patch: Partial<Pick<DebtLine, 'productId' | 'quantity'>>) => {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("debts.pageTitle")}</h1>
            <p className="text-slate-600 mt-1">{t("debts.records")}: {filteredDebts.length}</p>
            {!isDirector && (
              <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3 max-w-2xl">
                {t("debts.workerHint")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{t("debts.issueProduct")}</span>
          </button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{t("debts.modalIssueTitle")}</h2>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  resetModal();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitDebt} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-700 mb-1">{t("debts.debtorName")}</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t("debts.phone")}</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t("debts.company")}</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{t("debts.linesTitle")}</p>
                  <button
                    type="button"
                    onClick={addDebtLine}
                    className="text-sm text-slate-700 font-medium hover:underline"
                  >
                    {t("debts.addLine")}
                  </button>
                </div>
                {products.length === 0 && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    {t("debts.noProducts")}
                  </p>
                )}
                {lines.map((line, index) => (
                  <div
                    key={line.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-3 items-end bg-white rounded-lg border border-slate-200 p-3"
                  >
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">{t("debts.productN").replace("{n}", String(index + 1))}</label>
                      <select
                        value={line.productId}
                        onChange={(e) => updateLine(line.id, { productId: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        required={index === 0}
                      >
                        <option value="">{t("debts.selectProduct")}</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {productName(p, locale)} — {p.price.toLocaleString()} UZS / {p.unit} ({t("debts.stockLeft")}: {p.quantity} {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">{t("debts.quantity")}</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, { quantity: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex justify-end pb-1">
                      <button
                        type="button"
                        onClick={() => removeDebtLine(line.id)}
                        disabled={lines.length <= 1}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"
                        aria-label={t("debts.lineRemove")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-sm text-slate-600">{t("debts.totalLines")}</span>
                  <span className="text-lg font-semibold text-slate-900">{computedTotal.toLocaleString()} UZS</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t("debts.issueDate")}</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t("debts.dueDate")}</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t("products.labelNotes")}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetModal();
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded-lg">
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">{t("debts.statActive")}</p>
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
              <p className="text-sm text-slate-600">{t("debts.statOverdue")}</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">{t("debts.statTotal")}</p>
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
            <option value="all">{t("debts.filterAllStatus")}</option>
            <option value="active">{t("common.debtStatusActive")}</option>
            <option value="partial">{t("common.debtStatusPartial")}</option>
            <option value="overdue">{t("common.debtStatusOverdue")}</option>
            <option value="paid">{t("common.debtStatusPaid")}</option>
          </select>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="text-sm text-slate-600">{t("debts.foundLine")}: {filteredDebts.length}</span>
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
                      <span>{debt.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{t("debts.dueLabel")}: {debt.dueDate}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {debt.products.slice(0, 2).map((product, idx) => (
                      <span key={`${product.productId}-${idx}`} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                        {debtLineProductName(product.productId, product.productName, products, locale)} × {product.quantity}
                      </span>
                    ))}
                    {debt.products.length > 2 && (
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                        +{debt.products.length - 2} {t("debts.moreProducts")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between lg:justify-end gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-600 mb-1">{t("debts.remaining")}</p>
                  <p className="text-xl font-bold text-slate-900">{debt.remainingAmount.toLocaleString()} UZS</p>
                  {debt.paidAmount > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">{t("debts.paidPart")}: {debt.paidAmount.toLocaleString()} UZS</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap ${getStatusColor(debt.status)}`}>
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
                  <span>{t("debts.overdueBanner")}</span>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {filteredDebts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">{t("debts.emptyTitle")}</h3>
          <p className="text-slate-600 mb-4">{t("debts.emptyHint")}</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-slate-600 hover:underline"
          >
            {t("common.resetFilters")}
          </button>
        </div>
      )}
    </div>
  );
}

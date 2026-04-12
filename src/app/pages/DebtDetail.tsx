import { useState, useMemo } from 'react';
import { PhoneField } from '../components/PhoneField';
import { AmountField } from '../components/AmountField';
import { isCompleteInternationalPhone12, normalizePhoneForStore } from '../lib/phone';
import { useParams, Link } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowLeft,
  FileText,
  Phone,
  Calendar,
  DollarSign,
  AlertCircle,
  Edit,
  CheckCircle,
  Building2,
  X,
} from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';
import { canIssueDebt, canEditDebtRecords } from '../lib/permissions';
import { useI18n } from '../i18n/I18nContext';
import { debtLineProductName } from '../lib/productLocale';
import { formatDateDotDMY } from '../lib/warehouseUtils';
import type { DebtHistoryEntry } from '../data/mockData';

const GENERAL_PRODUCT = '__general__';
const LINE_PREFIX = 'line:';

export default function DebtDetail() {
  const { id } = useParams();
  const { debts, products, applyDebtPayment, appendAudit, updateDebtorProfile, updateDebtHistoryEntry, updateDebtSchedule } =
    useWarehouse();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isDirector = user?.role === 'director';
  const canManageDebt = isDirector || canIssueDebt(user) || canEditDebtRecords(user);
  const canEditDebt = canEditDebtRecords(user);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');

  const [histOpen, setHistOpen] = useState(false);
  const [histEntryId, setHistEntryId] = useState<string | null>(null);
  const [histDate, setHistDate] = useState('');
  const [histPerson, setHistPerson] = useState('');
  const [histCompany, setHistCompany] = useState('');
  const [histAmount, setHistAmount] = useState('');
  const [histProductKey, setHistProductKey] = useState(GENERAL_PRODUCT);
  const [histMode, setHistMode] = useState<'partial' | 'full'>('partial');

  const debt = useMemo(() => debts.find((d) => d.id === id), [debts, id]);

  const [payOpen, setPayOpen] = useState(false);
  const [amountPay, setAmountPay] = useState('');
  const [paymentMode, setPaymentMode] = useState<'partial' | 'full'>('partial');
  const [productKey, setProductKey] = useState(GENERAL_PRODUCT);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedIssue, setSchedIssue] = useState('');
  const [schedDue, setSchedDue] = useState('');

  if (!debt) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">{t("debtDetail.notFound")}</h3>
          <Link to="/debts" className="text-slate-600 hover:underline">
            {t("debtDetail.backList")}
          </Link>
        </div>
      </div>
    );
  }

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

  const paymentPercentage =
    debt.totalAmount <= 0 ? 0 : (debt.paidAmount / debt.totalAmount) * 100;

  const resolveProductName = (key: string) => {
    if (key === GENERAL_PRODUCT) return t('debtDetail.generalPayment');
    if (key.startsWith(LINE_PREFIX)) {
      const idx = Number(key.slice(LINE_PREFIX.length));
      const row = debt.products[idx];
      if (!row) return '—';
      const nm = debtLineProductName(row.productId, row.productName, products, locale);
      return debt.products.length > 1 ? `${nm} ${t('debtDetail.positionN').replace('{n}', String(idx + 1))}` : nm;
    }
    const row = debt.products.find((pr) => pr.productId === key);
    if (!row) return '—';
    return debtLineProductName(row.productId, row.productName, products, locale);
  };

  const resolvePaymentProductId = (key: string): string => {
    if (key === GENERAL_PRODUCT) return GENERAL_PRODUCT;
    if (key.startsWith(LINE_PREFIX)) {
      const idx = Number(key.slice(LINE_PREFIX.length));
      return debt.products[idx]?.productId ?? GENERAL_PRODUCT;
    }
    return key;
  };

  const historyProductKey = (h: DebtHistoryEntry) => {
    if (h.productId === GENERAL_PRODUCT) return GENERAL_PRODUCT;
    const idx = debt.products.findIndex((p) => p.productId === h.productId);
    if (idx >= 0) return debt.products.length > 1 ? `${LINE_PREFIX}${idx}` : h.productId;
    return GENERAL_PRODUCT;
  };

  const openProfileModal = () => {
    setProfileFullName(debt.fullName);
    setProfilePhone(debt.phone);
    setProfileCompany(debt.company ?? '');
    setProfileOpen(true);
  };

  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canEditDebt) return;
    const pn = normalizePhoneForStore(profilePhone);
    if (!isCompleteInternationalPhone12(pn)) {
      toast.error(t('common.phoneInvalid12'));
      return;
    }
    const result = updateDebtorProfile(id, {
      fullName: profileFullName,
      phone: pn,
      company: profileCompany,
    });
    if (!result.ok) {
      toast.error(result.error ?? t('debtDetail.toastPayError'));
      return;
    }
    appendAudit({
      userName: user?.fullName ?? '—',
      userRole: (user?.role as 'director' | 'assistant' | 'worker') ?? 'director',
      action: 'Изменение',
      entity: 'Долг',
      details: `Данные должника обновлены: ${profileFullName.trim()}`,
      ip: '—',
    });
    toast.success(t('debtDetail.profileSaved'));
    setProfileOpen(false);
  };

  const openHistModal = (h: DebtHistoryEntry) => {
    setHistEntryId(h.id);
    setHistDate(h.date);
    setHistPerson(h.personName);
    setHistCompany(h.company);
    setHistAmount(String(h.amount));
    setHistProductKey(historyProductKey(h));
    setHistMode('partial');
    setHistOpen(true);
  };

  const submitHistEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !histEntryId || !canEditDebt) return;
    const base = {
      date: histDate,
      personName: histPerson,
      company: histCompany,
      productId: resolvePaymentProductId(histProductKey),
      productName: resolveProductName(histProductKey),
    };
    const payload =
      histMode === 'full'
        ? { ...base, repaymentMode: 'full' as const }
        : { ...base, amount: Number(histAmount), repaymentMode: 'partial' as const };
    const result = updateDebtHistoryEntry(id, histEntryId, payload);
    if (!result.ok) {
      toast.error(result.error ?? t('debtDetail.toastPayError'));
      return;
    }
    appendAudit({
      userName: user?.fullName ?? '—',
      userRole: (user?.role as 'director' | 'assistant' | 'worker') ?? 'director',
      action: 'Изменение',
      entity: 'Долг',
      details: `Исправлена запись в истории оплат (${debt.fullName})`,
      ip: '—',
    });
    toast.success(t('debtDetail.historySaved'));
    setHistOpen(false);
    setHistEntryId(null);
  };

  const submitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canEditDebt) return;
    const result = updateDebtSchedule(id, { issueDate: schedIssue, dueDate: schedDue });
    if (!result.ok) {
      toast.error(result.error ?? t('debtDetail.toastPayError'));
      return;
    }
    appendAudit({
      userName: user?.fullName ?? '—',
      userRole: (user?.role as 'director' | 'assistant' | 'worker') ?? 'director',
      action: 'Изменение',
      entity: 'Долг',
      details: `Сроки долга обновлены: ${debt.fullName}`,
      ip: '—',
    });
    toast.success(t('debtDetail.profileSaved'));
    setScheduleOpen(false);
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canManageDebt) return;
    const amt = paymentMode === 'full' ? debt.remainingAmount : Number(amountPay);
    const result = applyDebtPayment(id, {
      personName: debt.fullName.trim(),
      company: (debt.company ?? '').trim(),
      amount: amt,
      productId: resolvePaymentProductId(productKey),
      productName: resolveProductName(productKey),
    });
    if (!result.ok) {
      toast.error(result.error ?? t('debtDetail.toastPayError'));
      return;
    }
    appendAudit({
      userName: user?.fullName ?? '—',
      userRole: (user?.role as 'director' | 'assistant' | 'worker') ?? 'director',
      action: 'Оплата',
      entity: 'Долг',
      details: `${debt.fullName}: ${amt.toLocaleString()} UZS`,
      ip: '—',
    });
    toast.success(t('debtDetail.toastPayOk'));
    setPayOpen(false);
    setAmountPay('');
    setPaymentMode('partial');
    setProductKey(GENERAL_PRODUCT);
  };

  const history = debt.debtHistory ?? [];
  const legacyPayments = debt.paymentHistory ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <Link to="/debts" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span>К списку должников</span>
        </Link>
        {!canManageDebt && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {t('debtDetail.viewOnly')}
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{debt.fullName}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Phone className="w-4 h-4 text-slate-600" />
                <span className="text-slate-600">{debt.phone}</span>
              </div>
              {debt.company && (
                <div className="flex items-center gap-2 mt-1 text-slate-600">
                  <Building2 className="w-4 h-4" />
                  <span>{debt.company}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManageDebt && debt.status !== 'paid' && (
              <button
                type="button"
                onClick={() => setPayOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Записать оплату</span>
              </button>
            )}
            {canEditDebt && (
              <button
                type="button"
                onClick={openProfileModal}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
              >
                <Edit className="w-4 h-4" />
                <span>{t('debtDetail.editProfile')}</span>
              </button>
            )}
            {canEditDebt && (
              <button
                type="button"
                onClick={() => {
                  setSchedIssue(debt.issueDate.slice(0, 10));
                  setSchedDue(debt.dueDate.slice(0, 10));
                  setScheduleOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
              >
                <Calendar className="w-4 h-4" />
                <span>Сроки оплаты</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{t('debtDetail.payModalTitle')}</h2>
              <button type="button" onClick={() => setPayOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitPayment} className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-2">
                <p className="text-sm font-medium text-slate-800">{t('debtDetail.payDebtorTitle')}</p>
                <p className="text-base font-semibold text-slate-900">{debt.fullName}</p>
                <p className="text-sm text-slate-600">{debt.phone}</p>
                {debt.company ? <p className="text-sm text-slate-600">{debt.company}</p> : null}
                <p className="text-xs text-slate-500 pt-1">{t('debtDetail.payDebtorHint')}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('debtDetail.repaymentType')}</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as 'partial' | 'full')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="partial">{t('debtDetail.partialRepayment')}</option>
                  <option value="full">{t('debtDetail.fullRepayment')}</option>
                </select>
              </div>
              {paymentMode === 'full' ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <p className="text-sm text-emerald-900">{t('debtDetail.toSettle')}: <span className="font-semibold">{debt.remainingAmount.toLocaleString()} UZS</span></p>
                </div>
              ) : (
                <div>
                  <AmountField
                    label={t('debtDetail.amountUZSLabel').replace('{max}', debt.remainingAmount.toLocaleString())}
                    value={amountPay}
                    onChange={setAmountPay}
                    required
                    inputClassName="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('debtDetail.productRepaymentLabel')}</label>
                <select
                  value={productKey}
                  onChange={(e) => setProductKey(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value={GENERAL_PRODUCT}>{t('debtDetail.generalPayment')}</option>
                  {debt.products.map((p, idx) => (
                    <option key={`${p.productId}-${idx}`} value={`${LINE_PREFIX}${idx}`}>
                      {debtLineProductName(p.productId, p.productName, products, locale)} ({p.quantity} × {p.price.toLocaleString()} UZS)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">{t('debtDetail.productRepaymentHint')}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPayOpen(false)} className="px-4 py-2 border rounded-lg">
                  {t('debtDetail.payCancel')}
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded-lg">
                  {t('debtDetail.paySave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">{t('debtDetail.profileModalTitle')}</h2>
              <button type="button" onClick={() => setProfileOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitProfile} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('debtDetail.profileName')}</label>
                <input
                  required
                  value={profileFullName}
                  onChange={(e) => setProfileFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <PhoneField
                  label={t('debtDetail.profilePhone')}
                  value={profilePhone}
                  onChange={setProfilePhone}
                  required
                  inputClassName="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('debtDetail.profileCompany')}</label>
                <input
                  value={profileCompany}
                  onChange={(e) => setProfileCompany(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setProfileOpen(false)} className="px-4 py-2 border rounded-lg">
                  {t('debtDetail.payCancel')}
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded-lg">
                  {t('debtDetail.paySave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Сроки долга</h2>
              <button type="button" onClick={() => setScheduleOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitSchedule} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Дата выдачи</label>
                <input
                  required
                  type="date"
                  value={schedIssue}
                  onChange={(e) => setSchedIssue(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Срок оплаты</label>
                <input
                  required
                  type="date"
                  value={schedDue}
                  onChange={(e) => setSchedDue(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setScheduleOpen(false)} className="px-4 py-2 border rounded-lg">
                  {t('debtDetail.payCancel')}
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded-lg">
                  {t('debtDetail.paySave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {histOpen && histEntryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">{t('debtDetail.historyEditTitle')}</h2>
              <button
                type="button"
                onClick={() => {
                  setHistOpen(false);
                  setHistEntryId(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitHistEdit} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('debtDetail.historyDate')}</label>
                <input
                  required
                  type="date"
                  value={histDate.length >= 10 ? histDate.slice(0, 10) : histDate}
                  onChange={(e) => setHistDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('debtDetail.historyPerson')}</label>
                <input
                  value={histPerson}
                  onChange={(e) => setHistPerson(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('debtDetail.historyCompany')}</label>
                <input
                  value={histCompany}
                  onChange={(e) => setHistCompany(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('debtDetail.repaymentType')}</label>
                <select
                  value={histMode}
                  onChange={(e) => setHistMode(e.target.value as 'partial' | 'full')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="partial">{t('debtDetail.partialRepayment')}</option>
                  <option value="full">{t('debtDetail.fullRepayment')}</option>
                </select>
              </div>
              {histMode === 'partial' ? (
                <div>
                  <AmountField
                    label={t('debtDetail.historyAmount')}
                    value={histAmount}
                    onChange={setHistAmount}
                    required
                    inputClassName="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-600">{t('debtDetail.historyFullHint')}</p>
              )}
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('debtDetail.productRepaymentLabel')}</label>
                <select
                  value={histProductKey}
                  onChange={(e) => setHistProductKey(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value={GENERAL_PRODUCT}>{t('debtDetail.generalPayment')}</option>
                  {debt.products.map((p, idx) => (
                    <option key={`${p.productId}-${idx}`} value={`${LINE_PREFIX}${idx}`}>
                      {debtLineProductName(p.productId, p.productName, products, locale)} ({p.quantity} × {p.price.toLocaleString()} UZS)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setHistOpen(false);
                    setHistEntryId(null);
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  {t('debtDetail.payCancel')}
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded-lg">
                  {t('debtDetail.paySave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {debt.status === 'overdue' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Просрочка</h3>
              <p className="text-sm text-red-700 mt-1">Срок оплаты истёк. Требуется срочная связь с клиентом.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Сумма долга</p>
              <p className="text-2xl font-bold text-slate-900">{debt.totalAmount.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-1">UZS</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Оплачено</p>
              <p className="text-2xl font-bold text-emerald-600">{debt.paidAmount.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-1">UZS</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Остаток</p>
              <p className="text-2xl font-bold text-red-600">{debt.remainingAmount.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-1">UZS</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Ход оплаты</h3>
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Оплачено {paymentPercentage.toFixed(1)}%</span>
            <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(debt.status)}`}>
              {getStatusLabel(debt.status)}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, paymentPercentage)}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-slate-600">Дата выдачи</p>
            <p className="font-medium text-slate-900">{formatDateDotDMY(debt.issueDate)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Срок оплаты</p>
            <p className="font-medium text-slate-900">{formatDateDotDMY(debt.dueDate)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Товары по долгу</h3>
        {debt.products.length === 0 ? (
          <p className="text-slate-600 text-sm">Позиции не указаны — в форме оплаты доступно только «Общее погашение».</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">Товар</th>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">Кол-во</th>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">Цена</th>
                  <th className="text-left py-3 text-sm font-medium text-slate-600">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {debt.products.map((product, index) => (
                  <tr key={index}>
                    <td className="py-3 text-slate-900">{debtLineProductName(product.productId, product.productName, products, locale)}</td>
                    <td className="py-3 text-slate-600">{product.quantity}</td>
                    <td className="py-3 text-slate-600">{product.price.toLocaleString()} UZS</td>
                    <td className="py-3 font-medium text-slate-900">{(product.quantity * product.price).toLocaleString()} UZS</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3 font-semibold text-slate-900">
                    Итого
                  </td>
                  <td className="py-3 font-bold text-slate-900">{debt.totalAmount.toLocaleString()} UZS</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6 overflow-x-auto">
        <h3 className="font-semibold text-slate-900 mb-4">История погашения долга</h3>
        {history.length > 0 ? (
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 pr-3 font-medium">Дата</th>
                <th className="py-2 pr-3 font-medium">Фамилия, имя</th>
                <th className="py-2 pr-3 font-medium">Компания</th>
                <th className="py-2 pr-3 font-medium text-right">Сумма</th>
                <th className="py-2 pr-3 font-medium">Товар / основание</th>
                <th className="py-2 pr-3 font-medium text-right">Остаток</th>
                <th className="py-2 pr-3 font-medium text-right">% оплачено</th>
                {canEditDebt ? <th className="py-2 pr-3 font-medium text-right">{t('debtDetail.historyActions')}</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h.id} className="text-slate-800">
                  <td className="py-3 pr-3 whitespace-nowrap">{formatDateDotDMY(h.date)}</td>
                  <td className="py-3 pr-3">{h.personName}</td>
                  <td className="py-3 pr-3">{h.company}</td>
                  <td className="py-3 pr-3 text-right font-medium text-emerald-700">+{h.amount.toLocaleString()}</td>
                  <td className="py-3 pr-3">{debtLineProductName(h.productId, h.productName, products, locale)}</td>
                  <td className="py-3 pr-3 text-right">
                    {h.fullyPaid ? (
                      <span className="text-emerald-700 font-medium">Полностью</span>
                    ) : (
                      <span>{h.remainingAfter.toLocaleString()} UZS</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right font-semibold text-slate-900">{h.paidPercentOfTotal.toFixed(1)}%</td>
                  {canEditDebt ? (
                    <td className="py-3 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => openHistModal(h)}
                        className="text-sm font-medium text-slate-700 underline hover:no-underline"
                      >
                        {t('debtDetail.historyEditBtn')}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        ) : legacyPayments.length > 0 ? (
          <div className="space-y-2 text-slate-600 text-sm">
            <p className="text-slate-500 mb-2">Ранние записи (без детализации):</p>
            {legacyPayments.map((payment, index) => (
              <div key={index} className="flex justify-between border-b border-slate-100 pb-2">
                <span>{payment.date}</span>
                <span className="font-medium text-emerald-700">+{payment.amount.toLocaleString()} UZS</span>
                <span className="text-slate-500">{payment.method}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Пока нет оплат — нажмите «Записать оплату».</p>
          </div>
        )}
      </div>

      {debt.notes && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Примечания</h3>
          <p className="text-slate-700">{debt.notes}</p>
        </div>
      )}
    </div>
  );
}

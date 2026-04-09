import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Package,
  Edit,
  Trash2,
  AlertCircle,
  Calendar,
  DollarSign,
  Building,
  X,
  Truck,
  Wallet,
  ShoppingBag,
} from 'lucide-react';
import type { Debt } from '../data/mockData';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { productName } from '../lib/productLocale';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addProductInbound, updateProduct, deleteProduct, appendAudit, addDebt, recordClientSale } = useWarehouse();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isDirector = user?.role === 'director';

  const product = products.find((p) => p.id === id);
  const [inQty, setInQty] = useState('');
  const [inNote, setInNote] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [eName, setEName] = useState('');
  const [eQty, setEQty] = useState('');
  const [ePrice, setEPrice] = useState('');
  const [eSupplier, setESupplier] = useState('');
  const [eExp, setEExp] = useState('');
  const [eNotes, setENotes] = useState('');
  const [eNameUz, setENameUz] = useState('');

  const [debtOpen, setDebtOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [dName, setDName] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dCompany, setDCompany] = useState('');
  const [dQty, setDQty] = useState('1');
  const [dIssue, setDIssue] = useState('');
  const [dDue, setDDue] = useState('');
  const [dNotes, setDNotes] = useState('');
  const [sName, setSName] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sCompany, setSCompany] = useState('');
  const [sQty, setSQty] = useState('1');

  useEffect(() => {
    if (!product || !editOpen) return;
    setEName(product.name);
    setEQty(String(product.quantity));
    setEPrice(String(product.price));
    setESupplier(product.supplier);
    setEExp(product.expirationDate);
    setENotes(product.notes ?? '');
    setENameUz(product.nameUz ?? '');
  }, [product, editOpen]);

  if (!product) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">{t("products.detailNotFound")}</h3>
          <Link to="/products" className="text-slate-600 hover:underline">
            {t("products.detailBack")}
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'low-stock':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'out-of-stock':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in-stock':
        return t('common.productStatusInStock');
      case 'low-stock':
        return t('common.productStatusLow');
      case 'out-of-stock':
        return t('common.productStatusOut');
      default:
        return status;
    }
  };

  const historyActionLabel = (action: string) => {
    switch (action) {
      case 'Added':
        return t('products.historyAdded');
      case 'Removed':
        return t('products.historyRemoved');
      case 'Adjust':
        return t('products.historyAdjust');
      default:
        return action;
    }
  };

  const handleInbound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirector) return;
    const q = Number(inQty);
    if (!Number.isFinite(q) || q <= 0) {
      toast.error(t('products.toastQty'));
      return;
    }
    const ok = addProductInbound(product.id, q, user?.fullName ?? 'Директор');
    if (!ok) {
      toast.error(t('products.toastInboundFail'));
      return;
    }
    appendAudit({
      userName: user?.fullName ?? 'Директор',
      userRole: 'director',
      action: 'Изменение',
      entity: 'Товар',
      details: `${product.name}: приход +${q}${inNote ? ` (${inNote})` : ''}`,
      ip: '—',
    });
    toast.success(t('products.toastInboundOk'));
    setInQty('');
    setInNote('');
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirector || !id) return;
    const q = Number(eQty);
    const pr = Number(ePrice);
    if (!eName.trim() || !Number.isFinite(q) || !Number.isFinite(pr)) {
      toast.error(t('products.toastEditCheck'));
      return;
    }
    updateProduct(id, {
      name: eName.trim(),
      nameUz: eNameUz.trim() || undefined,
      quantity: q,
      unit: 'шт',
      price: pr,
      supplier: eSupplier.trim() || '—',
      expirationDate: eExp || product.expirationDate,
      notes: eNotes.trim() || undefined,
    });
    appendAudit({
      userName: user?.fullName ?? 'Директор',
      userRole: 'director',
      action: 'Изменение',
      entity: 'Товар',
      details: `Редактирование: ${eName.trim()}`,
      ip: '—',
    });
    toast.success(t('products.toastSaved'));
    setEditOpen(false);
  };

  const handleDelete = () => {
    if (!isDirector || !id) return;
    if (!window.confirm(t('products.confirmDelete').replace('{name}', productName(product, locale)))) return;
    deleteProduct(id);
    appendAudit({
      userName: user?.fullName ?? 'Директор',
      userRole: 'director',
      action: 'Удаление',
      entity: 'Товар',
      details: product.name,
      ip: '—',
    });
    toast.success(t('products.toastDeleted'));
    navigate('/products', { replace: true });
  };


  const submitDebtFromProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!dName.trim()) {
      toast.error(t('products.toastDebtName'));
      return;
    }
    const qty = Number(dQty);
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error(t('debts.toastQtyInteger'));
      return;
    }
    if (qty > product.quantity) {
      toast.error(t('debts.toastStockExceeded').replace('{name}', productName(product, locale)));
      return;
    }
    const total = qty * product.price;
    if (total <= 0) {
      toast.error(t('debts.toastSum'));
      return;
    }
    const row: Omit<Debt, 'id'> = {
      fullName: dName.trim(),
      phone: dPhone.trim() || '—',
      company: dCompany.trim() || undefined,
      createdByRole: isDirector ? 'director' : 'worker',
      createdByUserId: user?.id,
      totalAmount: total,
      paidAmount: 0,
      remainingAmount: total,
      issueDate: dIssue || new Date().toISOString().slice(0, 10),
      dueDate: dDue || new Date().toISOString().slice(0, 10),
      status: 'active',
      products: [
        {
          productId: product.id,
          productName: product.name,
          quantity: qty,
          price: product.price,
        },
      ],
      debtHistory: [],
      paymentHistory: [],
      notes: dNotes.trim() || undefined,
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
      details: `${productName(product, locale)}, ${dName.trim()}, ${total.toLocaleString()} UZS`,
      ip: '—',
    });
    toast.success(t('products.toastDebtOk'));
    setDebtOpen(false);
    setDName('');
    setDPhone('');
    setDCompany('');
    setDQty('1');
    setDIssue('');
    setDDue('');
    setDNotes('');
  };

  const submitSaleFromProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!sName.trim()) {
      toast.error(t('products.toastSaleName'));
      return;
    }
    const qty = Number(sQty);
    const result = recordClientSale({
      productId: product.id,
      quantity: qty,
      fullName: sName.trim(),
      phone: sPhone.trim() || undefined,
      company: sCompany.trim() || undefined,
      createdByUserId: user?.id,
      createdByRole: isDirector ? 'director' : 'worker',
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const amount = qty * product.price;
    appendAudit({
      userName: user?.fullName ?? '—',
      userRole: isDirector ? 'director' : 'worker',
      action: 'Создание',
      entity: 'Продажа',
      details: `${productName(product, locale)}, ${sName.trim()}, ${amount.toLocaleString()} UZS`,
      ip: '—',
    });
    toast.success(t('products.toastSaleOk'));
    setSaleOpen(false);
    setSName('');
    setSPhone('');
    setSCompany('');
    setSQty('1');
  };

  const r = product.shipmentRecipient;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <Link to="/products" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span>{t("products.detailBack")}</span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="w-[300px] h-[300px] flex-shrink-0 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package className="w-20 h-20 text-slate-400" />
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{productName(product, locale)}</h1>
              {!isDirector && (
                <p className="text-sm text-slate-500 mt-2 max-w-md">
{t("products.detailViewOnly")}
                </p>
              )}
            </div>
            {isDirector && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
                >
                  <Edit className="w-4 h-4" />
                  <span>{t("common.edit")}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t("common.delete")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {editOpen && isDirector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{t("products.detailEditTitle")}</h2>
              <button type="button" onClick={() => setEditOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitEdit} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t("products.labelName")}</label>
                <input
                  required
                  value={eName}
                  onChange={(e) => setEName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t("common.nameUz")}</label>
                <input
                  value={eNameUz}
                  onChange={(e) => setENameUz(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t("products.labelQty")}</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={eQty}
                    onChange={(e) => setEQty(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t("products.colPrice")}</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={ePrice}
                    onChange={(e) => setEPrice(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t("products.labelSupplier")}</label>
                <input value={eSupplier} onChange={(e) => setESupplier(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t("products.labelExp")}</label>
                <input type="date" value={eExp} onChange={(e) => setEExp(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t("products.labelNotes")}</label>
                <textarea value={eNotes} onChange={(e) => setENotes(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 border rounded-lg">
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

      {r && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">{t("products.recipientBlock")}</h2>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">{t("debtDetail.firstName")}</dt>
              <dd className="font-medium text-slate-900">{r.firstName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("debtDetail.lastName")}</dt>
              <dd className="font-medium text-slate-900">{r.lastName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("debts.phone")}</dt>
              <dd className="font-medium text-slate-900">{r.phone}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("debtDetail.company")}</dt>
              <dd className="font-medium text-slate-900">{r.company}</dd>
            </div>
          </dl>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-2">{t('products.issueBlockTitle')}</h2>
        <p className="text-sm text-slate-600 mb-1">{t('products.issueHintDebt')}</p>
        <p className="text-sm text-slate-600 mb-4">{t('products.issueHintSale')}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={product.quantity <= 0}
            onClick={() => setDebtOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wallet className="w-4 h-4" />
            {t('products.issueDebt')}
          </button>
          <button
            type="button"
            disabled={product.quantity <= 0}
            onClick={() => setSaleOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-4 h-4" />
            {t('products.issueSale')}
          </button>
        </div>
      </div>


      {isDirector && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">{t("products.inboundTitle")}</h2>
          <p className="text-sm text-slate-600 mb-4">
            {t("products.inboundHint")}
          </p>
          <form onSubmit={handleInbound} className="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm text-slate-700 mb-1">{t("products.inboundQty")}</label>
              <input
                type="number"
                min={1}
                step="any"
                value={inQty}
                onChange={(e) => setInQty(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="50"
              />
            </div>
            <div className="flex-[2] min-w-[200px]">
              <label className="block text-sm text-slate-700 mb-1">{t("products.inboundNote")}</label>
              <input
                value={inNote}
                onChange={(e) => setInNote(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder={t("products.inboundPlaceholder")}
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800">
              {t("products.inboundSubmit")}
            </button>
          </form>
        </div>
      )}

      {product.status === 'low-stock' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900">{t("products.lowTitle")}</h3>
              <p className="text-sm text-amber-700 mt-1">{t("products.lowDesc")}</p>
            </div>
          </div>
        </div>
      )}

      {product.status === 'out-of-stock' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">{t("products.outTitle")}</h3>
              <p className="text-sm text-red-700 mt-1">{t("products.outDesc")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">{t("products.infoBlock")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-slate-600 block mb-1">{t("products.labelName")}</label>
              <p className="font-medium text-slate-900">{productName(product, locale)}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">{t("products.labelQty")}</label>
              <p className="font-medium text-slate-900">
                {product.quantity}
              </p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">{t("products.labelPriceUnit")}</label>
              <p className="font-medium text-slate-900">{product.price.toLocaleString()} UZS</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">{t("products.labelTotalValue")}</label>
              <p className="font-medium text-slate-900">{(product.price * product.quantity).toLocaleString()} UZS</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">{t("products.labelSupplier")}</label>
              <p className="font-medium text-slate-900">{product.supplier}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">{t("products.labelExp")}</label>
              <p className="font-medium text-slate-900">{product.expirationDate}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-slate-600 block mb-1">{t("common.status")}</label>
              <span className={`inline-block text-xs font-medium px-3 py-1.5 rounded-full border ${getStatusColor(product.status)}`}>
                {getStatusLabel(product.status)}
              </span>
            </div>
            {product.notes && (
              <div className="sm:col-span-2">
                <label className="text-sm text-slate-600 block mb-1">{t("products.labelNotes")}</label>
                <p className="text-slate-900">{product.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">{t("products.stockCard")}</p>
                <p className="text-xl font-bold text-slate-900">{product.quantity}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">{t("products.valueCard")}</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {(product.price * product.quantity).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600">UZS</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">{t("products.colSupplier")}</p>
                <p className="text-sm font-medium text-slate-900">{product.supplier}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">{t("products.goodUntil")}</p>
                <p className="text-sm font-medium text-slate-900">{product.expirationDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {debtOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{t('products.modalDebtTitle')}</h2>
              <button
                type="button"
                onClick={() => setDebtOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitDebtFromProduct} className="space-y-3">
              <p className="text-sm text-slate-700 font-medium">{productName(product, locale)}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t('debts.debtorName')}</label>
                  <input
                    required
                    value={dName}
                    onChange={(e) => setDName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t('debts.phone')}</label>
                  <input
                    value={dPhone}
                    onChange={(e) => setDPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('debts.company')}</label>
                <input
                  value={dCompany}
                  onChange={(e) => setDCompany(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t('products.modalQty')}</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={dQty}
                    onChange={(e) => setDQty(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="text-sm text-slate-600 pb-2">
                  {t('products.modalStock')}: <span className="font-medium text-slate-900">{product.quantity}</span>
                </div>
              </div>
              <div className="flex justify-between items-center rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                <span className="text-sm text-slate-600">{t('products.modalTotal')}</span>
                <span className="text-lg font-semibold text-slate-900">
                  {(Number(dQty) > 0 && Number.isInteger(Number(dQty))
                    ? Number(dQty) * product.price
                    : 0
                  ).toLocaleString()}{' '}
                  UZS
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t('debts.issueDate')}</label>
                  <input
                    type="date"
                    value={dIssue}
                    onChange={(e) => setDIssue(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t('debts.dueDate')}</label>
                  <input
                    type="date"
                    value={dDue}
                    onChange={(e) => setDDue(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('products.modalNotes')}</label>
                <textarea
                  value={dNotes}
                  onChange={(e) => setDNotes(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setDebtOpen(false)} className="px-4 py-2 border rounded-lg">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded-lg">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {saleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{t('products.modalSaleTitle')}</h2>
              <button
                type="button"
                onClick={() => setSaleOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitSaleFromProduct} className="space-y-3">
              <p className="text-sm text-slate-700 font-medium">{productName(product, locale)}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-700 mb-1">{t('products.modalClientName')}</label>
                  <input
                    required
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t('debts.phone')}</label>
                  <input
                    value={sPhone}
                    onChange={(e) => setSPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t('debts.company')}</label>
                  <input
                    value={sCompany}
                    onChange={(e) => setSCompany(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t('products.modalQty')}</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={sQty}
                    onChange={(e) => setSQty(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="text-sm text-slate-600 pb-2">
                  {t('products.modalStock')}: <span className="font-medium text-slate-900">{product.quantity}</span>
                </div>
              </div>
              <div className="flex justify-between items-center rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                <span className="text-sm text-slate-600">{t('products.modalTotal')}</span>
                <span className="text-lg font-semibold text-slate-900">
                  {(Number(sQty) > 0 && Number.isInteger(Number(sQty))
                    ? Number(sQty) * product.price
                    : 0
                  ).toLocaleString()}{' '}
                  UZS
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSaleOpen(false)} className="px-4 py-2 border rounded-lg">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-700 text-white rounded-lg">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">{t("products.movementTitle")}</h2>
        <div className="space-y-3">
          {product.history.map((entry, index) => (
            <div key={index} className="flex items-start gap-4 pb-3 border-b border-slate-100 last:border-0">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mt-0.5">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{historyActionLabel(entry.action)}</p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {t("products.historyQty")}:{' '}
                      <span className={entry.quantity > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {entry.quantity > 0 ? '+' : ''}
                        {entry.quantity}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">{entry.date}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t("products.historyUser")}: {entry.user}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

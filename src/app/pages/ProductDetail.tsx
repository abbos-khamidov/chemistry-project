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
} from 'lucide-react';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { productName, productCategory } from '../lib/productLocale';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addProductInbound, updateProduct, deleteProduct, appendAudit } = useWarehouse();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isDirector = user?.role === 'director';

  const product = products.find((p) => p.id === id);
  const [inQty, setInQty] = useState('');
  const [inNote, setInNote] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [eName, setEName] = useState('');
  const [eCategory, setECategory] = useState('');
  const [eQty, setEQty] = useState('');
  const [eUnit, setEUnit] = useState('');
  const [ePrice, setEPrice] = useState('');
  const [eSupplier, setESupplier] = useState('');
  const [eExp, setEExp] = useState('');
  const [eNotes, setENotes] = useState('');
  const [eNameUz, setENameUz] = useState('');
  const [eCategoryUz, setECategoryUz] = useState('');

  useEffect(() => {
    if (!product || !editOpen) return;
    setEName(product.name);
    setECategory(product.category);
    setEQty(String(product.quantity));
    setEUnit(product.unit);
    setEPrice(String(product.price));
    setESupplier(product.supplier);
    setEExp(product.expirationDate);
    setENotes(product.notes ?? '');
    setENameUz(product.nameUz ?? '');
    setECategoryUz(product.categoryUz ?? '');
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
      category: eCategory || 'Прочее',
      categoryUz: eCategoryUz.trim() || undefined,
      quantity: q,
      unit: eUnit.trim() || 'шт',
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
              <p className="text-slate-600 mt-1">{productCategory(product, locale)}</p>
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
                  <label className="block text-sm text-slate-700 mb-1">{t("products.labelCategory")}</label>
                  <input value={eCategory} onChange={(e) => setECategory(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">{t("common.categoryUz")}</label>
                  <input value={eCategoryUz} onChange={(e) => setECategoryUz(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t("products.labelUnit")}</label>
                <input value={eUnit} onChange={(e) => setEUnit(e.target.value)} className="w-full border rounded-lg px-3 py-2 max-w-md" />
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
              <label className="text-sm text-slate-600 block mb-1">{t("products.labelCategory")}</label>
              <p className="font-medium text-slate-900">{productCategory(product, locale)}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">{t("products.labelQty")}</label>
              <p className="font-medium text-slate-900">
                {product.quantity} {product.unit}
              </p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">{t("products.labelUnit")}</label>
              <p className="font-medium text-slate-900">{product.unit}</p>
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
            <p className="text-xs text-slate-600">{product.unit}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">{t("products.valueCard")}</p>
                <p className="text-xl font-bold text-slate-900">
                  {((product.price * product.quantity) / 1000000).toFixed(2)}M
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
                        {entry.quantity} {product.unit}
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

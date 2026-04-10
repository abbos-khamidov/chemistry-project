import { useState, useRef } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Plus, Search, Filter, Grid, List, AlertCircle, Package, ChevronRight, X, ImageIcon } from "lucide-react";
import { useWarehouse } from "../context/WarehouseContext";
import { useAuth } from "../context/AuthContext";
import { canAddProducts } from '../lib/permissions';
import { useI18n } from "../i18n/I18nContext";
import { productName } from "../lib/productLocale";

const MAX_IMAGE_BYTES = 600 * 1024;

export default function Products() {
  const { products, addProduct, appendAudit } = useWarehouse();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isDirector = user?.role === "director";
  const canAdd = canAddProducts(user);

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [workerPhotoDataUrl, setWorkerPhotoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter((product) => {
    const q = searchQuery.toLowerCase();
    const blob = [product.name, product.nameUz ?? ""].join(" ").toLowerCase();
    const matchesSearch = !q.trim() || blob.includes(q);
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-green-50 text-green-700 border-green-200";
      case "low-stock":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "out-of-stock":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in-stock":
        return t("common.productStatusInStock");
      case "low-stock":
        return t("common.productStatusLow");
      case "out-of-stock":
        return t("common.productStatusOut");
      default:
        return status;
    }
  };

  const resetForm = () => {
    setName("");
    setQuantity("");
    setPrice("");
    setSupplier("");
    setNotes("");
    setWorkerPhotoDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onWorkerPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("products.toastImage"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("products.toastImageBig"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") setWorkerPhotoDataUrl(r);
    };
    reader.readAsDataURL(file);
  };

  const submitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    const q = Number(quantity);
    const pr = Number(price);
    if (!name.trim() || !Number.isFinite(q) || !Number.isFinite(pr)) {
      toast.error(t("products.toastCheck"));
      return;
    }

    addProduct({
      name: name.trim(),
      imageUrl: workerPhotoDataUrl || undefined,
      category: "Без категории",
      categoryUz: undefined,
      quantity: q,
      unit: "шт",
      price: pr,
      supplier: supplier.trim() || "—",
      expirationDate: expirationDate || new Date().toISOString().slice(0, 10),
      notes: notes.trim() || undefined,
      createdBy: user?.fullName ?? "Директор",
    });
    appendAudit({
      userName: user?.fullName ?? "—",
      userRole: (user?.role as any) ?? "director",
      action: "Создание",
      entity: "Товар",
      details: name.trim(),
      ip: "—",
    });
    toast.success(t("products.toastAddedDirector"));
    setModalOpen(false);
    resetForm();
  };

  const productThumb = (imageUrl: string | undefined, size: "grid" | "table") => {
    const cls =
      size === "grid"
        ? "w-full max-w-[300px] aspect-square mx-auto mb-4 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
        : "w-[80px] h-[80px] bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden";
    if (imageUrl) {
      return (
        <div className={cls}>
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`${cls} border-2 border-dashed border-slate-300`}>
        <div className="text-center px-2">
          <Package className={size === "grid" ? "w-16 h-16 text-slate-400 mx-auto" : "w-8 h-8 text-slate-400 mx-auto"} />
          {size === "grid" && <p className="text-xs text-slate-500 mt-2">{t("products.photoPlaceholder")}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("products.pageTitle")}</h1>
            <p className="text-slate-600 mt-1">{t("products.positionsCount").replace("{count}", String(filteredProducts.length))}</p>
            {!isDirector && (
              <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3 max-w-2xl">
                {t("products.workerHint")}
              </p>
            )}
          </div>
          {canAdd && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{t("products.addDirector")}</span>
          </button>
          )}
        </div>
      </div>

      {modalOpen && canAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {t("products.modalNewDirector")}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitProduct} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t("products.photoOptional")}</label>
                <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-white text-sm bg-white">
                      <ImageIcon className="w-4 h-4 text-slate-600" />
                      {t("products.chooseFile")}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onWorkerPhoto}
                      />
                    </label>
                    {workerPhotoDataUrl && (
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => {
                          setWorkerPhotoDataUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        {t("products.removePhoto")}
                      </button>
                    )}
                  </div>
                  {workerPhotoDataUrl ? (
                    <div className="mt-3 w-32 h-32 rounded-lg border border-slate-200 overflow-hidden bg-white">
                      <img src={workerPhotoDataUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="mt-3 w-32 h-32 rounded-lg border-2 border-dashed border-slate-300 bg-white flex items-center justify-center text-center px-2">
                      <span className="text-xs text-slate-500">{t("products.photoPlaceholder")}</span>
                    </div>
                  )}
                </div>
              </div>
              <>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">{t("products.labelNameDirector")}</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">{t("products.labelQty")}</label>
                      <input
                        required
                        type="number"
                        min={0}
                        step="any"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">{t("products.labelPriceUzs")}</label>
                      <input
                        required
                        type="number"
                        min={0}
                        step="any"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">{t("products.labelSupplier")}</label>
                    <input
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">{t("products.labelExp")}</label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">{t("products.labelNotes")}</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">
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

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={t("products.searchPlaceholder")}
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
            <option value="all">{t("products.filterAllStatus")}</option>
            <option value="in-stock">{t("common.productStatusInStock")}</option>
            <option value="low-stock">{t("common.productStatusLow")}</option>
            <option value="out-of-stock">{t("common.productStatusOut")}</option>
          </select>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-600">{t("products.foundLine")}: {filteredProducts.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-slate-100 text-slate-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg ${viewMode === "table" ? "bg-slate-100 text-slate-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="bg-white rounded-xl border border-slate-200/80 p-6 hover:border-slate-400 hover:shadow-md transition-all"
            >
              {productThumb(product.imageUrl, "grid")}
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(product.status)}`}>
                  {getStatusLabel(product.status)}
                </span>
              </div>

              <h3 className="font-semibold text-slate-900 mb-1">{productName(product, locale)}</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{t("common.qty")}:</span>
                  <span className="font-medium text-slate-900">
                    {product.quantity}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{t("products.colPrice")}:</span>
                  <span className="font-medium text-slate-900">{product.price.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{t("products.colSupplier")}:</span>
                  <span className="font-medium text-slate-900 truncate ml-2">{product.supplier}</span>
                </div>
              </div>

              {product.status === "low-stock" && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t("products.lowStockBanner")}</span>
                </div>
              )}

              {product.status === "out-of-stock" && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t("products.outStockBanner")}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">{t("products.colPhoto")}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">{t("products.colProduct")}</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">{t("products.colQtyShort")}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">{t("products.colPrice")}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">{t("products.colSupplier")}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">{t("products.colStatus")}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">{productThumb(product.imageUrl, "table")}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{productName(product, locale)}</p>
                    </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">{product.price.toLocaleString()} UZS</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.supplier}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(product.status)}`}>
                        {getStatusLabel(product.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/products/${product.id}`} className="text-slate-600 hover:text-slate-800">
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">{t("products.emptyTitle")}</h3>
          <p className="text-slate-600 mb-4">{t("products.emptyHint")}</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
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

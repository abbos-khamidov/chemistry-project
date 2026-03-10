import { useParams, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Package, Edit, Trash2, AlertCircle, Calendar, DollarSign, Building } from 'lucide-react';
import { mockProducts } from '../data/mockData';

const actionLabels: Record<string, string> = {
  Added: 'Поступление',
  Removed: 'Списание',
  Adjust: 'Корректировка',
};

export default function ProductDetail() {
  const { id } = useParams();
  const product = mockProducts.find(p => p.id === id);

  if (!product) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Товар не найден</h3>
          <Link to="/products" className="text-slate-600 hover:underline">
            К списку товаров
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-50 text-green-700 border-green-200';
      case 'low-stock': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'out-of-stock': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in-stock': return 'В наличии';
      case 'low-stock': return 'Мало';
      case 'out-of-stock': return 'Нет в наличии';
      default: return status;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <Link to="/products" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span>К списку товаров</span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          {/* Место для фото товара 300×300 */}
          <div className="w-[300px] h-[300px] flex-shrink-0 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
            <Package className="w-20 h-20 text-slate-400" />
          </div>

          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
              <p className="text-slate-600 mt-1">{product.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toast.info('Редактирование товара', { description: product.name })}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
              >
                <Edit className="w-4 h-4" />
                <span>Изменить</span>
              </button>
              <button
                type="button"
                onClick={() => toast.error('Удаление', { description: `Товар «${product.name}» будет удалён. Подтвердите в полной версии.` })}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {product.status === 'low-stock' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900">Низкий остаток</h3>
              <p className="text-sm text-amber-700 mt-1">Товар заканчивается. Рекомендуется пополнить склад.</p>
            </div>
          </div>
        </div>
      )}

      {product.status === 'out-of-stock' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Нет в наличии</h3>
              <p className="text-sm text-red-700 mt-1">Товар отсутствует. Требуется срочное пополнение.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Информация о товаре</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-slate-600 block mb-1">Название</label>
              <p className="font-medium text-slate-900">{product.name}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">Категория</label>
              <p className="font-medium text-slate-900">{product.category}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">Количество</label>
              <p className="font-medium text-slate-900">{product.quantity} {product.unit}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">Единица</label>
              <p className="font-medium text-slate-900">{product.unit}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">Цена за ед.</label>
              <p className="font-medium text-slate-900">{product.price.toLocaleString()} UZS</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">Общая стоимость</label>
              <p className="font-medium text-slate-900">{(product.price * product.quantity).toLocaleString()} UZS</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">Поставщик</label>
              <p className="font-medium text-slate-900">{product.supplier}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 block mb-1">Срок годности</label>
              <p className="font-medium text-slate-900">{product.expirationDate}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-slate-600 block mb-1">Статус</label>
              <span className={`inline-block text-xs font-medium px-3 py-1.5 rounded-full border ${getStatusColor(product.status)}`}>
                {getStatusLabel(product.status)}
              </span>
            </div>
            {product.notes && (
              <div className="sm:col-span-2">
                <label className="text-sm text-slate-600 block mb-1">Примечания</label>
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
                <p className="text-sm text-slate-600">В наличии</p>
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
                <p className="text-sm text-slate-600">Стоимость</p>
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
                <p className="text-sm text-slate-600">Поставщик</p>
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
                <p className="text-sm text-slate-600">Годен до</p>
                <p className="text-sm font-medium text-slate-900">{product.expirationDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">История движения</h2>
        <div className="space-y-3">
          {product.history.map((entry, index) => (
            <div key={index} className="flex items-start gap-4 pb-3 border-b border-slate-100 last:border-0">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mt-0.5">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{actionLabels[entry.action] ?? entry.action}</p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      Кол-во: <span className={entry.quantity > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {entry.quantity > 0 ? '+' : ''}{entry.quantity} {product.unit}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">{entry.date}</p>
                    <p className="text-xs text-slate-500 mt-0.5">пользователь: {entry.user}</p>
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

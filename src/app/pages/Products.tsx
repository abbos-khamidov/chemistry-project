import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Plus, Search, Filter, Grid, List, AlertCircle, Package, ChevronRight } from 'lucide-react';
import { mockProducts } from '../data/mockData';

export default function Products() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Товары и склад</h1>
            <p className="text-slate-600 mt-1">На складе {filteredProducts.length} товаров</p>
          </div>
          <button
            type="button"
            onClick={() => toast.info('Добавление товара', { description: 'В полной версии откроется форма. Сейчас данные только в демо.' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Добавить товар</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
              />
            </div>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
          >
            <option value="all">Все категории</option>
            <option value="Chemicals">Химикаты</option>
            <option value="Safety Equipment">СИЗ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
          >
            <option value="all">Все статусы</option>
            <option value="in-stock">В наличии</option>
            <option value="low-stock">Мало</option>
            <option value="out-of-stock">Нет в наличии</option>
          </select>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-600">
              Найдено: {filteredProducts.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-slate-100 text-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="bg-white rounded-xl border border-slate-200/80 p-6 hover:border-slate-400 hover:shadow-md transition-all"
            >
              {/* Место для фото товара (до 300×300) */}
              <div className="w-full max-w-[300px] aspect-square mx-auto mb-4 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <Package className="w-16 h-16 text-slate-400" />
              </div>
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(product.status)}`}>
                  {getStatusLabel(product.status)}
                </span>
              </div>

              <h3 className="font-semibold text-slate-900 mb-1">{product.name}</h3>
              <p className="text-sm text-slate-600 mb-3">{product.category}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Кол-во:</span>
                  <span className="font-medium text-slate-900">{product.quantity} {product.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Цена:</span>
                  <span className="font-medium text-slate-900">{product.price.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Поставщик:</span>
                  <span className="font-medium text-slate-900 truncate ml-2">{product.supplier}</span>
                </div>
              </div>

              {product.status === 'low-stock' && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>Скоро пополнить</span>
                </div>
              )}

              {product.status === 'out-of-stock' && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>Нет в наличии</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Фото</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Товар</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Категория</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Кол-во</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Цена</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Поставщик</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Статус</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="w-[80px] h-[80px] bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{product.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{product.quantity} {product.unit}</td>
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

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Товары не найдены</h3>
          <p className="text-slate-600 mb-4">Измените фильтры или поиск</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setStatusFilter('all'); }}
            className="text-slate-600 hover:underline"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
}

import { Link } from 'react-router';
import { 
  Package, 
  AlertCircle, 
  Banknote, 
  Activity, 
  FileText, 
  Clock,
  Plus,
  Search,
  BarChart,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardStats, recentActivity } from '../data/mockData';

const monthlyData = [
  { name: 'Jan', value: 12500000, operations: 18 },
  { name: 'Feb', value: 14800000, operations: 22 },
  { name: 'Mar', value: 15850000, operations: 24 },
];


export default function Dashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Дашборд</h1>
        <p className="text-slate-600 mt-1">Ключевые показатели склада</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              Активно
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{dashboardStats.totalProducts}</h3>
          <p className="text-sm text-slate-600 mt-1">Товаров на складе</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              Низкий остаток
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{dashboardStats.lowStockItems}</h3>
          <p className="text-sm text-slate-600 mt-1">Требуют пополнения</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Banknote className="w-6 h-6 text-emerald-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {(dashboardStats.warehouseValue / 1000000).toFixed(1)}M
          </h3>
          <p className="text-sm text-slate-600 mt-1">Стоимость склада (UZS)</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-slate-600" />
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
              За месяц
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{dashboardStats.monthlyOperations}</h3>
          <p className="text-sm text-slate-600 mt-1">Операций</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Активные долги</p>
              <p className="text-xl font-bold text-slate-900">{dashboardStats.activeDebts}</p>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            Сумма: {(dashboardStats.totalDebtAmount / 1000000).toFixed(1)}M UZS
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Просрочено</p>
              <p className="text-xl font-bold text-red-600">{dashboardStats.overdueDebts}</p>
            </div>
          </div>
          <div className="text-sm text-red-600">Требуют внимания</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Собрано (март)</p>
              <p className="text-xl font-bold text-emerald-600">
                {(dashboardStats.collectedThisMonth / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-600">UZS</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Динамика стоимости склада</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#475569" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Действия</h3>
          <div className="space-y-2">
            <Link
              to="/products"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Добавить товар</p>
                <p className="text-xs text-slate-600">Новая позиция</p>
              </div>
            </Link>

            <Link
              to="/debts"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Добавить долг</p>
                <p className="text-xs text-slate-600">Записать долг клиента</p>
              </div>
            </Link>

            <Link
              to="/products"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-900">Поиск товара</p>
                <p className="text-xs text-slate-600">Найти на складе</p>
              </div>
            </Link>

            <Link
              to="/analytics"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <BarChart className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Отчёты</p>
                <p className="text-xs text-slate-600">Аналитика и экспорт</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Недавняя активность</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mt-0.5">
                  <Activity className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                  <p className="text-sm text-slate-600 truncate">{activity.item}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

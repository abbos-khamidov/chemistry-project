import { useState } from 'react';
import { toast } from 'sonner';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, Package, FileText } from 'lucide-react';
import { LineChart, Line, BarChart as RechartsBar, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardStats, mockProducts, mockDebts } from '../data/mockData';

const monthlyInventoryData = [
  { month: 'Oct', value: 12500000, operations: 18 },
  { month: 'Nov', value: 13200000, operations: 20 },
  { month: 'Dec', value: 14100000, operations: 19 },
  { month: 'Jan', value: 12800000, operations: 17 },
  { month: 'Feb', value: 14800000, operations: 22 },
  { month: 'Mar', value: 15850000, operations: 24 },
];

const categoryDistribution = [
  { name: 'Chemicals', value: 9200000, percentage: 58 },
  { name: 'Safety Equipment', value: 4100000, percentage: 26 },
  { name: 'Tools & Equipment', value: 2550000, percentage: 16 },
];

const debtAnalytics = [
  { month: 'Oct', paid: 3200000, unpaid: 1800000 },
  { month: 'Nov', paid: 2800000, unpaid: 2100000 },
  { month: 'Dec', paid: 4100000, unpaid: 1500000 },
  { month: 'Jan', paid: 3500000, unpaid: 2200000 },
  { month: 'Feb', paid: 4200000, unpaid: 1900000 },
  { month: 'Mar', paid: 2050000, unpaid: 2040000 },
];

const topProducts = [
  { name: 'Sulfuric Acid 98%', quantity: 150, value: 6750000 },
  { name: 'Sodium Hydroxide Pellets', quantity: 200, value: 2400000 },
  { name: 'Hydrogen Peroxide 30%', quantity: 80, value: 2240000 },
  { name: 'Protective Masks N95', quantity: 15, value: 1275000 },
  { name: 'Safety Gloves Industrial', quantity: 25, value: 375000 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const totalWarehouseValue = mockProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
const totalDebtsRemaining = mockDebts.filter((d) => d.status !== 'paid').reduce((sum, d) => sum + d.remainingAmount, 0);
const collectedThisMonth = dashboardStats.collectedThisMonth;

export default function Analytics() {
  const [dateRange, setDateRange] = useState('last-6-months');

  const handleExport = () => {
    toast.success('Отчёт подготовлен', { description: 'Экспорт за выбранный период. В продакшене здесь будет скачивание файла.' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Аналитика и отчёты</h1>
            <p className="text-slate-600 mt-1">Показатели по складу и долгам</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
            >
              <option value="last-30-days">За 30 дней</option>
              <option value="last-3-months">За 3 месяца</option>
              <option value="last-6-months">За 6 месяцев</option>
              <option value="last-year">За год</option>
              <option value="custom">Свой период</option>
            </select>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Экспорт</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-600 mb-1">Стоимость склада</p>
          <p className="text-2xl font-bold text-slate-900">{(totalWarehouseValue / 1_000_000).toFixed(2)}M</p>
          <p className="text-xs text-slate-500 mt-1">UZS по текущим остаткам</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-600 mb-1">Собрано (март)</p>
          <p className="text-2xl font-bold text-slate-900">{(collectedThisMonth / 1_000_000).toFixed(2)}M</p>
          <p className="text-xs text-slate-500 mt-1">UZS</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <TrendingDown className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-sm text-slate-600 mb-1">Неоплаченные долги</p>
          <p className="text-2xl font-bold text-slate-900">{(totalDebtsRemaining / 1_000_000).toFixed(2)}M</p>
          <p className="text-xs text-amber-600 mt-1">{dashboardStats.overdueDebts} просрочено</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-600 mb-1">Операций (март)</p>
          <p className="text-2xl font-bold text-slate-900">{dashboardStats.monthlyOperations}</p>
          <p className="text-xs text-slate-500 mt-1">движения по складу</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Динамика стоимости склада</h3>
            <span className="text-xs text-slate-600">За 6 месяцев</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyInventoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="value" stroke="#475569" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">По категориям</h3>
            <span className="text-xs text-slate-600">Текущее распределение</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Долги: оплачено / не оплачено</h3>
            <span className="text-xs text-slate-600">По месяцам</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBar data={debtAnalytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="paid" fill="#10b981" radius={[8, 8, 0, 0]} name="Оплачено" />
              <Bar dataKey="unpaid" fill="#ef4444" radius={[8, 8, 0, 0]} name="Не оплачено" />
            </RechartsBar>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Операции по месяцам</h3>
            <span className="text-xs text-slate-600">Приход / расход</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBar data={monthlyInventoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Bar dataKey="operations" fill="#64748b" radius={[8, 8, 0, 0]} />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Топ товаров по стоимости</h3>
          <button type="button" onClick={() => toast.info('Переход к списку товаров')} className="text-sm text-slate-600 hover:underline">
            Все товары
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="text-left py-3 text-sm font-medium text-slate-600">#</th>
                <th className="text-left py-3 text-sm font-medium text-slate-600">Товар</th>
                <th className="text-left py-3 text-sm font-medium text-slate-600">Кол-во</th>
                <th className="text-left py-3 text-sm font-medium text-slate-600">Стоимость</th>
                <th className="text-left py-3 text-sm font-medium text-slate-600">Доля</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.map((product, index) => {
                const contribution = totalWarehouseValue > 0 ? ((product.value / totalWarehouseValue) * 100).toFixed(1) : '0';
                return (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="py-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm">
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-4 font-medium text-slate-900">{product.name}</td>
                    <td className="py-4 text-slate-600">{product.quantity}</td>
                    <td className="py-4 font-medium text-slate-900">{product.value.toLocaleString()} UZS</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                          <div className="h-full bg-slate-500 rounded-full" style={{ width: `${contribution}%` }} />
                        </div>
                        <span className="text-sm text-slate-600">{contribution}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

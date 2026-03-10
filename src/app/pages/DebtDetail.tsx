import { useParams, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Phone, Calendar, DollarSign, AlertCircle, Edit, Printer, CheckCircle } from 'lucide-react';
import { mockDebts } from '../data/mockData';

export default function DebtDetail() {
  const { id } = useParams();
  const debt = mockDebts.find(d => d.id === id);

  if (!debt) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Долг не найден</h3>
          <Link to="/debts" className="text-slate-600 hover:underline">
            К списку долгов
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-50 text-green-700 border-green-200';
      case 'active': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'partial': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'overdue': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Оплачено';
      case 'active': return 'Активен';
      case 'partial': return 'Частично';
      case 'overdue': return 'Просрочен';
      default: return status;
    }
  };

  const paymentPercentage = (debt.paidAmount / debt.totalAmount) * 100;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/debts" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span>К списку долгов</span>
        </Link>
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
            </div>
          </div>
          <div className="flex items-center gap-2">
            {debt.status !== 'paid' && (
              <button
                type="button"
                onClick={() => toast.success('Отмечено как оплачено', { description: 'В полной версии сумма и статус обновятся.' })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Отметить оплаченным</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => toast.info('Редактирование долга', { description: debt.fullName })}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
            >
              <Edit className="w-4 h-4" />
              <span>Изменить</span>
            </button>
            <button
              type="button"
              onClick={() => toast.info('Печать', { description: 'Открыть печать в полной версии.' })}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span>Печать</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Alert */}
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
              <p className="text-2xl font-bold text-slate-900">
                {debt.totalAmount.toLocaleString()}
              </p>
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
              <p className="text-2xl font-bold text-emerald-600">
                {debt.paidAmount.toLocaleString()}
              </p>
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
              <p className="text-2xl font-bold text-red-600">
                {debt.remainingAmount.toLocaleString()}
              </p>
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
            <span className={`font-medium ${getStatusColor(debt.status)}`}>
              {getStatusLabel(debt.status)}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${paymentPercentage}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-slate-600">Дата выдачи</p>
            <p className="font-medium text-slate-900">{debt.issueDate}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Срок оплаты</p>
            <p className="font-medium text-slate-900">{debt.dueDate}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Товары</h3>
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
                  <td className="py-3 text-slate-900">{product.productName}</td>
                  <td className="py-3 text-slate-600">{product.quantity}</td>
                  <td className="py-3 text-slate-600">{product.price.toLocaleString()} UZS</td>
                  <td className="py-3 font-medium text-slate-900">
                    {(product.quantity * product.price).toLocaleString()} UZS
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="py-3 font-semibold text-slate-900">Итого</td>
                <td className="py-3 font-bold text-slate-900">
                  {debt.totalAmount.toLocaleString()} UZS
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">История оплат</h3>
          {debt.status !== 'paid' && (
            <button
              type="button"
              onClick={() => toast.info('Добавить оплату', { description: 'В полной версии откроется форма ввода суммы.' })}
              className="text-sm text-slate-600 hover:underline"
            >
              Добавить оплату
            </button>
          )}
        </div>
        
        {debt.paymentHistory.length > 0 ? (
          <div className="space-y-3">
            {debt.paymentHistory.map((payment, index) => (
              <div key={index} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Оплата получена</p>
                    <p className="text-sm text-slate-600">{payment.method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">+{payment.amount.toLocaleString()} UZS</p>
                  <p className="text-xs text-slate-600">{payment.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Пока нет оплат</p>
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

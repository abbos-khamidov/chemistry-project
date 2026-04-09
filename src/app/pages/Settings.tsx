import { toast } from 'sonner';
import { Save, Bell, Lock, Globe, Building } from 'lucide-react';

export default function Settings() {
  const handleSave = () => toast.success('Настройки сохранены', { description: 'Изменения применены (демо).' });
  const handleCancel = () => toast.info('Отменено', { description: 'Изменения не сохранены.' });
  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Настройки</h1>
        <p className="text-slate-600 mt-1">Управление параметрами системы склада</p>
      </div>

      <div className="max-w-4xl">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Информация о компании</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Название компании</label>
                <input
                  type="text"
                  defaultValue="Warehouse System"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Вид деятельности</label>
                <select className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800">
                  <option>Склад химикатов</option>
                  <option>Общий склад</option>
                  <option>Розница</option>
                  <option>Производство</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Адрес</label>
              <input
                type="text"
                defaultValue="Ташкент, Узбекистан"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Телефон</label>
                <input type="tel" defaultValue="+998 90 123 45 67" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input type="email" defaultValue="contact@warehouse.uz" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Уведомления</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Низкий остаток</p>
                <p className="text-sm text-slate-600">Уведомлять, когда товар заканчивается</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </label>
            <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Напоминания о просроченных долгах</p>
                <p className="text-sm text-slate-600">Уведомления о просрочке оплаты</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </label>
            <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Срок годности товаров</p>
                <p className="text-sm text-slate-600">Предупреждение о скором истечении срока</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </label>
            <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Новые пользователи</p>
                <p className="text-sm text-slate-600">Уведомлять о новых пользователях</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded" />
            </label>
            <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Уведомления по email</p>
                <p className="text-sm text-slate-600">Отправлять уведомления на почту</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Безопасность</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Текущий пароль</label>
              <input type="password" placeholder="Введите текущий пароль" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Новый пароль</label>
                <input type="password" placeholder="Введите новый пароль" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Подтвердите пароль</label>
                <input type="password" placeholder="Повторите новый пароль" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800" />
              </div>
            </div>
            <button type="button" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">
              Обновить пароль
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="font-semibold text-slate-900">Система</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Язык</label>
                <select className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800">
                  <option>Русский</option>
                  <option>English</option>
                  <option>O'zbek</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Валюта</label>
                <select className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800">
                  <option>UZS — узбекский сум</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Формат даты</label>
                <select className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800">
                  <option>ДД/ММ/ГГГГ</option>
                  <option>ММ/ДД/ГГГГ</option>
                  <option>ГГГГ-ММ-ДД</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Часовой пояс</label>
                <select className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800">
                  <option>UTC+5 (Ташкент)</option>
                  <option>UTC+3 (Москва)</option>
                  <option>UTC+0 (GMT)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Порог низкого остатка</label>
              <input type="number" defaultValue="30" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800" />
              <p className="text-xs text-slate-600 mt-1">Уведомлять, когда остаток ниже этого значения</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={handleCancel} className="px-6 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700">
            Отмена
          </button>
          <button type="button" onClick={handleSave} className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">
            <Save className="w-4 h-4" />
            <span>Сохранить</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Filter, Users as UsersIcon, Edit, UserX, UserCheck } from 'lucide-react';
import { mockUsers } from '../data/mockData';

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone.includes(searchQuery);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'manager': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'worker': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = { owner: 'Владелец', manager: 'Менеджер', worker: 'Сотрудник' };
    return labels[role] ?? role;
  };

  const activeUsers = filteredUsers.filter(u => u.status === 'active').length;
  const inactiveUsers = filteredUsers.filter(u => u.status === 'inactive').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Пользователи и роли</h1>
            <p className="text-slate-600 mt-1">В системе {filteredUsers.length} пользователей</p>
          </div>
          <button
            type="button"
            onClick={() => toast.info('Добавление пользователя', { description: 'В полной версии откроется форма.' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Добавить пользователя</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Активные</p>
              <p className="text-2xl font-bold text-slate-900">{activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <UserX className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Неактивные</p>
              <p className="text-2xl font-bold text-slate-900">{inactiveUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Всего</p>
              <p className="text-2xl font-bold text-slate-900">{mockUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
              />
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
          >
            <option value="all">Все роли</option>
            <option value="owner">Владелец</option>
            <option value="manager">Менеджер</option>
            <option value="worker">Сотрудник</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активен</option>
            <option value="inactive">Неактивен</option>
          </select>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="text-sm text-slate-600">
            Найдено: {filteredUsers.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Пользователь</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Контакты</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Роль</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Статус</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Активность</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {user.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      user.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {user.status === 'active' ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.lastActivity}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toast.info('Редактирование', { description: `Пользователь: ${user.fullName}` })}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toast.warning('Деактивация', { description: `Пользователь ${user.fullName} будет деактивирован.` })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Права по ролям</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-slate-900 mb-2">Владелец</p>
            <ul className="space-y-1 text-slate-700">
              <li>• Полный доступ</li>
              <li>• Управление пользователями</li>
              <li>• Отчёты и аналитика</li>
              <li>• Настройки</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-slate-900 mb-2">Менеджер</p>
            <ul className="space-y-1 text-slate-700">
              <li>• Управление складом</li>
              <li>• Управление долгами</li>
              <li>• Просмотр отчётов</li>
              <li>• Ограниченные настройки</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-slate-900 mb-2">Сотрудник</p>
            <ul className="space-y-1 text-slate-700">
              <li>• Просмотр товаров</li>
              <li>• Изменение остатков</li>
              <li>• Создание долгов</li>
              <li>• Базовые операции</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center mt-6">
          <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Пользователи не найдены</h3>
          <p className="text-slate-600 mb-4">Измените фильтры или поиск</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setRoleFilter('all'); setStatusFilter('all'); }}
            className="text-slate-600 hover:underline"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
}

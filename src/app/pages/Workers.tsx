import { useState } from 'react';
import { toast } from 'sonner';
import { UserPlus, Copy, Users, UserX, Trash2, UserCheck, KeyRound } from 'lucide-react';
import type { User } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useWarehouse } from '../context/WarehouseContext';
import { useI18n } from '../i18n/I18nContext';

type PendingAction =
  | null
  | { type: 'deactivate' | 'activate' | 'delete'; worker: User };

export default function Workers() {
  const { user, workers, createStaffAccount, setWorkerStatus, setStaffPermissionsByDirector, deleteWorkerAccount, updateStaffAccountByDirector } =
    useAuth();
  const { appendAudit } = useWarehouse();
  const { t } = useI18n();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'worker' | 'assistant'>('worker');
  const [permAnalytics, setPermAnalytics] = useState(false);
  const [permAddProducts, setPermAddProducts] = useState(false);
  const [permEditProducts, setPermEditProducts] = useState(false);
  const [permIssueDebt, setPermIssueDebt] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [editWorker, setEditWorker] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'worker' | 'assistant'>('worker');
  const [editPermAnalytics, setEditPermAnalytics] = useState(false);
  const [editPermAddProducts, setEditPermAddProducts] = useState(false);
  const [editPermEditProducts, setEditPermEditProducts] = useState(false);
  const [editPermIssueDebt, setEditPermIssueDebt] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const sortedWorkers = [...workers].sort((a, b) => {
    if (a.status === b.status) return a.fullName.localeCompare(b.fullName, 'ru');
    return a.status === 'active' ? -1 : 1;
  });

  const openEdit = (w: User) => {
    setEditWorker(w);
    setEditFullName(w.fullName);
    setEditPhone(w.phone);
    setEditRole(w.role === 'assistant' ? 'assistant' : 'worker');
    setEditPermAnalytics(Boolean(w.permissions?.analytics));
    setEditPermAddProducts(Boolean(w.permissions?.addProducts));
    setEditPermEditProducts(Boolean(w.permissions?.editProducts));
    setEditPermIssueDebt(Boolean(w.permissions?.issueDebt));
    setEditUsername(w.username);
    setEditPassword('');
  };

  const closeEdit = () => {
    setEditWorker(null);
    setEditFullName('');
    setEditPhone('');
    setEditRole('worker');
    setEditPermAnalytics(false);
    setEditPermAddProducts(false);
    setEditPermEditProducts(false);
    setEditPermIssueDebt(false);
    setEditUsername('');
    setEditPassword('');
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWorker || !user) return;

    const u = editUsername.trim().toLowerCase();
    const payload = {
      fullName: editFullName.trim(),
      phone: editPhone.trim(),
      username: u,
      password: editPassword || undefined,
      role: editRole,
      permissions:
        editRole === 'assistant'
          ? {
              analytics: editPermAnalytics,
              addProducts: editPermAddProducts,
              editProducts: editPermEditProducts,
              issueDebt: editPermIssueDebt,
            }
          : undefined,
    };

    setEditSaving(true);
    const result = updateStaffAccountByDirector(user, editWorker.id, payload);
    setEditSaving(false);
    if (!result.ok) {
      toast.error(result.error ?? t('workers.toastCredsFail'));
      return;
    }

    appendAudit({
      userName: user.fullName,
      userRole: 'director',
      action: 'Изменение',
      entity: 'Пользователь',
      details: `Учётка обновлена: ${editFullName.trim()} (@${u}), роль: ${editRole === 'assistant' ? 'ассистент' : 'рабочий'}`,
      ip: '—',
    });
    toast.success(t('workers.toastCredsOk'));
    closeEdit();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = createStaffAccount(user, {
      role: staffRole,
      permissions: staffRole === 'assistant' ? {
        analytics: permAnalytics,
        addProducts: permAddProducts,
        editProducts: permEditProducts,
        issueDebt: permIssueDebt,
      } : undefined,

      fullName,
      phone,
      username,
      password,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error ?? t("workers.toastCreateFail"));
      return;
    }
    appendAudit({
      userName: user?.fullName ?? 'Директор',
      userRole: 'director',
      action: 'Создание',
      entity: 'Пользователь',
      details: `${staffRole === 'assistant' ? 'Ассистент' : 'Рабочий'}: ${fullName.trim()}, логин ${username.trim().toLowerCase()}`,
      ip: '—',
    });
    toast.success(t('workers.toastCreateOk'), {
      description: `${t('workers.login')}: ${username.trim().toLowerCase()} — ${t('workers.toastCreateDesc')}`,
    });
    setFullName('');
    setPhone('');
    setUsername('');
    setPassword('');
    setStaffRole('worker');
    setPermAnalytics(false);
    setPermAddProducts(false);
    setPermEditProducts(false);
    setPermIssueDebt(false);
  };

  const copyCreds = () => {
    const text = `${t('workers.login')}: ${username.trim().toLowerCase()}\n${t('workers.password')}: ${password}`;
    if (!username || !password) {
      toast.info(t('workers.toastCopyNeed'));
      return;
    }
    void navigator.clipboard.writeText(text);
    toast.success(t('workers.toastCopied'));
  };

  const runConfirmedAction = () => {
    if (!pending || !user) return;
    const w = pending.worker;

    if (pending.type === 'delete') {
      const result = deleteWorkerAccount(user, w.id);
      if (!result.ok) {
        toast.error(result.error ?? t('workers.toastDeleteFail'));
        return;
      }
      appendAudit({
        userName: user.fullName,
        userRole: 'director',
        action: 'Удаление',
        entity: 'Пользователь',
        details: `Удалён рабочий: ${w.fullName} (@${w.username})`,
        ip: '—',
      });
      toast.success(t('workers.toastDeleted'));
      setPending(null);
      return;
    }

    const nextStatus = pending.type === 'deactivate' ? 'inactive' : 'active';
    const result = setWorkerStatus(user, w.id, nextStatus);
    if (!result.ok) {
      toast.error(result.error ?? t('workers.toastStatusFail'));
      return;
    }
    appendAudit({
      userName: user.fullName,
      userRole: 'director',
      action: 'Изменение',
      entity: 'Пользователь',
      details:
        nextStatus === 'inactive'
          ? `Деактивирован: ${w.fullName} (@${w.username})`
          : `Активирован: ${w.fullName} (@${w.username})`,
      ip: '—',
    });
    toast.success(nextStatus === 'inactive' ? t('workers.toastOff') : t('workers.toastOn'));
    setPending(null);
  };

  const confirmTitle =
    pending?.type === 'delete'
      ? t('workers.confirmDeleteTitle')
      : pending?.type === 'deactivate'
        ? t('workers.confirmDeactivate')
        : pending?.type === 'activate'
          ? t('workers.confirmActivate')
          : '';

  const confirmBody =
    pending?.type === 'delete'
      ? `Учётная запись «${pending.worker.fullName}» (@${pending.worker.username}) будет удалена безвозвратно. Восстановить логин и пароль будет нельзя.`
      : pending?.type === 'deactivate'
        ? `Сотрудник «${pending.worker.fullName}» (@${pending.worker.username}) не сможет войти в систему, пока вы снова не активируете учётную запись.`
        : pending?.type === 'activate'
          ? `Сотрудник «${pending.worker.fullName}» (@${pending.worker.username}) снова сможет войти под своим логином.`
          : '';

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t("workers.pageTitle")}</h1>
        <p className="text-slate-600 mt-1">
          {t("workers.pageSubtitle")}
        </p>
      </div>

      {editWorker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <form
            onSubmit={handleEditSave}
            className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Редактирование учётки</h2>
            <p className="text-sm text-slate-600 mb-4">{editWorker.fullName}</p>
            <p className="text-xs text-slate-500 mb-4">Измените данные сотрудника, роль и права доступа.</p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('workers.login')}</label>
                <input
                  type="text"
                  required
                  pattern="[a-zA-Z0-9_.\\-]{2,32}"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('workers.optionalNewPassword')}</label>
                <input
                  type="text"
                  minLength={4}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="••••"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">{confirmTitle}</h2>
            <p className="text-sm text-slate-600 mb-6">{confirmBody}</p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={runConfirmedAction}
                className={
                  pending.type === 'delete'
                    ? 'px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700'
                    : 'px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800'
                }
              >
                {pending.type === 'delete' ? t('workers.confirmDelete') : t('workers.confirmOk')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">{t("workers.newWorker")}</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("workers.fullName")}</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                placeholder="Иван Иванов"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("workers.phone")}</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                placeholder="+998 90 123 45 67"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Роль</label>
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as 'worker' | 'assistant')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="worker">Рабочий</option>
                <option value="assistant">Ассистент директора</option>
              </select>
            </div>

            {staffRole === 'assistant' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">Права ассистента</p>
                <label className="flex items-center gap-3 text-sm text-slate-800">
                  <input type="checkbox" checked={permAnalytics} onChange={(e) => setPermAnalytics(e.target.checked)} />
                  Возможность аналитики
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-800">
                  <input type="checkbox" checked={permAddProducts} onChange={(e) => setPermAddProducts(e.target.checked)} />
                  Возможность добавлять товары
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-800">
                  <input type="checkbox" checked={permEditProducts} onChange={(e) => setPermEditProducts(e.target.checked)} />
                  Возможность изменять товары
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-800">
                  <input type="checkbox" checked={permIssueDebt} onChange={(e) => setPermIssueDebt(e.target.checked)} />
                  Выдавать товар в долг
                </label>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("workers.login")}</label>
              <input
                type="text"
                required
                pattern="[a-zA-Z0-9_.\\-]{2,32}"
                title="2–32 символа: латиница, цифры, точка, дефис, подчёркивание"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                placeholder="worker_01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("workers.password")}</label>
              <input
                type="text"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                placeholder="Задайте пароль для сотрудника"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                {t("workers.create")}
              </button>
              <button
                type="button"
                onClick={copyCreds}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <Copy className="w-4 h-4" />
                {t("workers.copyCreds")}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">{t("workers.allWorkers")}</h2>
          </div>
          {sortedWorkers.length === 0 ? (
            <p className="text-slate-600 text-sm">{t("workers.empty")}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sortedWorkers.map((w) => (
                <li key={w.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{w.fullName}</p>
                    <p className="text-sm text-slate-600">@{w.username}</p>
                    <p className="text-xs text-slate-500">{w.phone}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${w.role === 'assistant' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                        {w.role === 'assistant' ? 'Ассистент директора' : 'Рабочий'}
                      </span>
                      {w.role === 'assistant' && (
                        <>
                          {w.permissions?.analytics && <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Аналитика</span>}
                          {w.permissions?.addProducts && <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Добавлять товары</span>}
                          {w.permissions?.editProducts && <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Изменять товары</span>}
                          {w.permissions?.issueDebt && <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Выдача в долг</span>}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full h-fit ${
                        w.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {w.status === 'active' ? t('workers.active') : t('workers.inactive')}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEdit(w)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 text-slate-800 bg-slate-50 rounded-lg hover:bg-slate-100"
                    >
                      <KeyRound className="w-4 h-4" />
                      Изменить
                    </button>
                    {w.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => setPending({ type: 'deactivate', worker: w })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-amber-200 text-amber-900 bg-amber-50 rounded-lg hover:bg-amber-100"
                      >
                        <UserX className="w-4 h-4" />
                        {t("workers.deactivate")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPending({ type: 'activate', worker: w })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-emerald-200 text-emerald-900 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                      >
                        <UserCheck className="w-4 h-4" />
                        {t("workers.activate")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPending({ type: 'delete', worker: w })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-800 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t("common.delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

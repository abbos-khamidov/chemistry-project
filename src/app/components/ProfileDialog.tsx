import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { LogOut, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
};

export function ProfileDialog({ open, onOpenChange, onLogout }: Props) {
  const { user, workers, updateDirectorProfile } = useAuth();
  const { t } = useI18n();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setFullName(user.fullName);
    setPhone(user.phone);
    setUsername(user.username);
    setCurrentPassword('');
    setNewPassword('');
    setPasswordConfirm('');
  }, [open, user]);

  if (!user) return null;

  const isDirector = user.role === 'director';

  const handleSaveDirector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirector) return;
    setSaving(true);
    const result = updateDirectorProfile(user, {
      fullName,
      phone,
      newUsername: username,
      newPassword: newPassword || undefined,
      passwordConfirm: passwordConfirm || undefined,
      currentPassword: currentPassword || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error ?? t('profile.toastSaveFail'));
      return;
    }
    toast.success(t('profile.toastSaveOk'));
    setCurrentPassword('');
    setNewPassword('');
    setPasswordConfirm('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle>{t('profile.title')}</DialogTitle>
          <DialogDescription className="text-slate-600">
            {isDirector ? t('profile.directorHint') : t('profile.workerHint')}
          </DialogDescription>
        </DialogHeader>

        {isDirector ? (
          <form onSubmit={handleSaveDirector} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('workers.fullName')}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('workers.phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('workers.login')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                autoComplete="username"
              />
              <p className="text-xs text-slate-500 mt-1">{t('profile.credentialsHint')}</p>
            </div>
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <p className="text-sm font-medium text-slate-800">{t('profile.changePassword')}</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.currentPassword')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  autoComplete="current-password"
                  placeholder={t('profile.currentPasswordPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.confirmPassword')}</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-800">{t('profile.usersSection')}</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{t('profile.usersSectionHint')}</p>
              <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-40 overflow-y-auto mb-3">
                <li className="px-3 py-2 text-sm">
                  <span className="font-medium text-slate-900">{user.fullName}</span>
                  <span className="text-slate-500"> — @{user.username}</span>
                  <span className="ml-2 text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {t('profile.badgeDirector')}
                  </span>
                </li>
                {workers.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-slate-500">{t('profile.noWorkersYet')}</li>
                ) : (
                  workers.map((w) => (
                    <li key={w.id} className="px-3 py-2 text-sm flex flex-wrap items-center gap-2 justify-between">
                      <span>
                        <span className="font-medium text-slate-900">{w.fullName}</span>
                        <span className="text-slate-500"> — @{w.username}</span>
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          w.status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {w.status === 'active' ? t('workers.active') : t('workers.inactive')}
                      </span>
                    </li>
                  ))
                )}
              </ul>
              <Link
                to="/workers"
                onClick={() => onOpenChange(false)}
                className="inline-flex text-sm font-medium text-slate-800 underline underline-offset-2 hover:text-slate-600"
              >
                {t('profile.openWorkers')}
              </Link>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <button
                type="button"
                onClick={() => onLogout()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
                {t('layout.logout')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-4 space-y-2 text-sm">
              <p>
                <span className="text-slate-500">{t('workers.fullName')}: </span>
                <span className="font-medium text-slate-900">{user.fullName}</span>
              </p>
              <p>
                <span className="text-slate-500">{t('workers.phone')}: </span>
                <span className="text-slate-900">{user.phone}</span>
              </p>
              <p>
                <span className="text-slate-500">{t('workers.login')}: </span>
                <span className="font-mono text-slate-900">@{user.username}</span>
              </p>
              <p className="text-xs text-slate-600 pt-2 border-t border-slate-100">{t('profile.workerCredentialsNote')}</p>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => onLogout()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4" />
                {t('layout.logout')}
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

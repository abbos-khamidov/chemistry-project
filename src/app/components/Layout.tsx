import { useState, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  Package,
  BarChart3,
  Search,
  Menu,
  X,
  ChevronDown,
  FileSearch,
  Target,
  Wallet,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BrandLogo } from './BrandLogo';
import { NotificationsPopover } from './NotificationsPopover';
import { ProfileDialog } from './ProfileDialog';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const { t } = useI18n();

  const navigation = useMemo(() => {
    if (currentUser.role === 'director') {
      return [
        { nameKey: 'layout.navAnalytics', href: '/analytics', icon: BarChart3 },
        { nameKey: 'layout.navAudit', href: '/audit', icon: FileSearch },
        { nameKey: 'layout.navWorkerKpi', href: '/worker-kpi', icon: Target },
        { nameKey: 'layout.navProducts', href: '/products', icon: Package },
        { nameKey: 'layout.navDebts', href: '/debts', icon: Wallet },
        { nameKey: 'layout.navWorkers', href: '/workers', icon: Users },
      ];
    }
    return [
      { nameKey: 'layout.navProducts', href: '/products', icon: Package },
      { nameKey: 'layout.navDebts', href: '/debts', icon: Wallet },
    ];
  }, [currentUser.role]);


  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (href: string) => {
    if (href === '/products') return location.pathname.startsWith('/products');
    if (href === '/debts') return location.pathname.startsWith('/debts');
    return location.pathname === href;
  };

  const searchPlaceholder =
    currentUser.role === 'director' ? t('layout.searchDirector') : t('layout.searchWorker');

  const mobileCols =
    navigation.length >= 6
      ? 'grid-cols-6'
      : navigation.length >= 5
        ? 'grid-cols-5'
        : navigation.length >= 3
          ? 'grid-cols-3'
          : navigation.length >= 2
            ? 'grid-cols-2'
            : 'grid-cols-1';

  return (
    <div className="min-h-screen bg-slate-50/80">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200/80 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="min-h-16 flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-slate-200/80">
            <Link to="/" className="flex items-center gap-3 min-w-0 flex-1">
              <BrandLogo className="h-9 w-auto max-w-[112px] shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-800 leading-tight">{t('layout.title')}</p>
                <p className="text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{t('layout.brandTagline')}</p>
              </div>
            </Link>
            <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.nameKey}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    active ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{t(item.nameKey)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => setProfileDialogOpen(true)}
              className="w-full flex items-center gap-3 text-left rounded-lg hover:bg-slate-50 p-2 -m-2 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <span className="text-slate-700 font-semibold text-sm">
                  {currentUser.fullName.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-slate-800">{currentUser.fullName}</p>
                <p className="text-xs text-slate-500">{currentUser.role === 'director' ? t('layout.roleDirector') : t('layout.roleWorker')}</p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600">
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 max-w-lg mx-4 hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <div className="hidden md:block px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                {currentUser.role === 'director' ? t('layout.roleDirector') : t('layout.roleWorker')}
              </div>

              <NotificationsPopover />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDialogOpen(true)}
                  className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg"
                  aria-haspopup="dialog"
                  aria-expanded={profileDialogOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-slate-700 font-semibold text-xs">
                      {currentUser.fullName.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-600 hidden sm:block" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] pb-16 lg:pb-0">
          <Outlet />
        </main>

        <footer className="bg-white border-t border-slate-200/80 py-4">
          <div className="px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-slate-500">{t('layout.footer')}</p>
          </div>
        </footer>

        <ProfileDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
          onLogout={handleLogout}
        />
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 z-30">
        <div className={`grid ${mobileCols} gap-1 px-2 py-2`}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.nameKey}
                to={item.href}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg ${
                  active ? 'text-slate-800' : 'text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium text-center leading-tight">{t(item.nameKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

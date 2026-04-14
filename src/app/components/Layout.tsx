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
  Wallet,
  Users,
  UserCircle,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWarehouse } from '../context/WarehouseContext';
import { getPermissions } from '../lib/permissions';
import { useI18n } from '../i18n/I18nContext';
import { productName } from '../lib/productLocale';
import { compareClientSalesNewestFirst, compareDebtsNewestFirst } from '../lib/warehouseUtils';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BrandLogo } from './BrandLogo';
import { NotificationsPopover } from './NotificationsPopover';
import { ProfileDialog } from './ProfileDialog';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const { products, debts, clientSales } = useWarehouse();
  const { t, locale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const perms = getPermissions(currentUser);

  const navigation = useMemo(() => {
    if (currentUser.role === 'director') {
      return [
        { nameKey: 'layout.navAnalytics', href: '/analytics', icon: BarChart3 },
        { nameKey: 'layout.navAudit', href: '/audit', icon: FileSearch },
        { nameKey: 'layout.navProducts', href: '/products', icon: Package },
        { nameKey: 'layout.navClients', href: '/clients', icon: UserCircle },
        { nameKey: 'layout.navDebts', href: '/debts', icon: Wallet },
        { nameKey: 'layout.navWorkers', href: '/workers', icon: Users },
      ];
    }
    if (currentUser.role === 'assistant') {
      const nav = [
        { nameKey: 'layout.navProducts', href: '/products', icon: Package },
        { nameKey: 'layout.navClients', href: '/clients', icon: UserCircle },
      ];
      if (perms.analytics) {
        nav.unshift({ nameKey: 'layout.navAnalytics', href: '/analytics', icon: BarChart3 });
      }
      if (perms.viewDebts) {
        nav.push({ nameKey: 'layout.navDebts', href: '/debts', icon: Wallet });
      }
      if (perms.manageStaff) {
        nav.push({ nameKey: 'layout.navWorkers', href: '/workers', icon: Users });
      }
      return nav;
    }
    const nav = [
      { nameKey: 'layout.navProducts', href: '/products', icon: Package },
      { nameKey: 'layout.navClients', href: '/clients', icon: UserCircle },
    ];
    if (perms.viewDebts) {
      nav.push({ nameKey: 'layout.navDebts', href: '/debts', icon: Wallet });
    }
    return nav;
  }, [currentUser.role, perms.analytics, perms.manageStaff, perms.viewDebts]);


  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (href: string) => {
    if (href === '/products') return location.pathname.startsWith('/products');
    if (href === '/clients') return location.pathname.startsWith('/clients');
    if (href === '/debts') return location.pathname.startsWith('/debts');
    return location.pathname === href;
  };

  const searchPlaceholder =
    currentUser.role === 'director' ? t('layout.searchDirector') : t('layout.searchWorker');

  const globalSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as Array<{ key: string; title: string; subtitle: string; to: string }>;

    const out: Array<{ key: string; title: string; subtitle: string; to: string }> = [];

    for (const item of navigation) {
      const title = t(item.nameKey);
      const blob = `${title} ${item.href}`.toLowerCase();
      if (blob.includes(q)) {
        out.push({ key: `nav:${item.href}`, title, subtitle: t('layout.searchSection'), to: item.href });
      }
    }

    for (const pr of products) {
      const title = productName(pr, locale);
      const blob = [title, pr.name, String(pr.price), String(pr.quantity)].join(' ').toLowerCase();
      if (blob.includes(q)) {
        out.push({ key: `p:${pr.id}`, title, subtitle: t('layout.navProducts'), to: `/products/${pr.id}` });
      }
    }

    if (perms.viewDebts) {
      for (const d of [...debts].sort(compareDebtsNewestFirst)) {
        const blob = [d.fullName, d.phone, d.company ?? ''].join(' ').toLowerCase();
        if (blob.includes(q)) {
          out.push({ key: `d:${d.id}`, title: d.fullName, subtitle: t('layout.navDebts'), to: `/debts/${d.id}` });
        }
      }
    }

    for (const c of [...clientSales].sort(compareClientSalesNewestFirst)) {
      const blob = [c.fullName, c.phone, c.productName, c.company ?? ''].join(' ').toLowerCase();
      if (blob.includes(q)) {
        out.push({ key: `c:${c.id}`, title: c.fullName, subtitle: `${t('layout.navClients')} · ${c.productName}`, to: '/clients' });
      }
    }

    const seen = new Set<string>();
    const uniq: Array<{ key: string; title: string; subtitle: string; to: string }> = [];
    for (const row of out) {
      if (seen.has(row.key)) continue;
      seen.add(row.key);
      uniq.push(row);
      if (uniq.length >= 10) break;
    }
    return uniq;
  }, [searchQuery, navigation, products, debts, clientSales, locale, t, perms.viewDebts]);

  const mobileCols =
    navigation.length >= 7
      ? 'grid-cols-7'
      : navigation.length >= 6
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
            <Link to="/" className="flex items-center min-w-0 flex-1">
              <BrandLogo className="h-9 w-auto max-w-[112px] shrink-0" />
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
                <p className="text-xs text-slate-500">{currentUser.role === 'director' ? t('layout.roleDirector') : currentUser.role === 'assistant' ? 'Ассистент' : t('layout.roleWorker')}</p>
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
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-800 placeholder:text-slate-400"
                />
                {searchFocused && searchQuery.trim().length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-40">
                    {globalSuggestions.length > 0 ? (
                      <div className="max-h-72 overflow-y-auto">
                        {globalSuggestions.map((row) => (
                          <button
                            key={row.key}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              navigate(row.to);
                              setSearchQuery('');
                              setSearchFocused(false);
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                          >
                            <p className="text-sm font-medium text-slate-900 truncate">{row.title}</p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{row.subtitle}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-3 text-sm text-slate-500">{t('common.found')}: 0</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <LanguageSwitcher />
              <div className="hidden md:block px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                {currentUser.role === 'director' ? t('layout.roleDirector') : currentUser.role === 'assistant' ? 'Ассистент' : t('layout.roleWorker')}
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

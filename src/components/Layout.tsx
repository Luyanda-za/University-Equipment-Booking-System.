import { type ReactNode, useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import {
  GraduationCap, LogOut, LayoutDashboard, Package, CalendarDays,
  ClipboardList, Settings as SettingsIcon, ChevronDown, Menu, X,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    showToast('You have been signed out.', 'info');
    onNavigate('login');
  };

  const userNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'equipment', label: 'Browse Equipment', icon: Package },
    { id: 'my-bookings', label: 'My Bookings', icon: CalendarDays },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-equipment', label: 'Manage Equipment', icon: SettingsIcon },
    { id: 'admin-bookings', label: 'Manage Bookings', icon: ClipboardList },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;
  const allItems = [...navItems, { id: 'settings', label: 'Settings', icon: SettingsIcon }];
  const currentLabel = allItems.find((i) => i.id === currentPage)?.label ?? 'Menu';

  const handleNav = (page: string) => {
    onNavigate(page);
    setMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => handleNav(isAdmin ? 'admin-dashboard' : 'dashboard')} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-50 text-lg hidden sm:block">UniEquip</span>
            </button>

            {/* Desktop: Dropdown Menu */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  {currentLabel}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 origin-top-right">
                    <div className="px-3 py-2 mb-1 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        {isAdmin ? 'Admin Panel' : 'Menu'}
                      </p>
                    </div>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = currentPage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNav(item.id)}
                          className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg mx-1 transition-colors ${
                            active
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                          style={{ width: 'calc(100% - 0.5rem)' }}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      );
                    })}
                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                    <button
                      onClick={() => handleNav('settings')}
                      className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg mx-1 transition-colors ${
                        currentPage === 'settings'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                      style={{ width: 'calc(100% - 0.5rem)' }}
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Settings
                    </button>
                  </div>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{profile?.full_name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{profile?.role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="px-4 py-3 space-y-1">
              <div className="px-3 py-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{profile?.full_name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{profile?.role}</p>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${
                      active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              <button
                onClick={() => handleNav('settings')}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${
                  currentPage === 'settings' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

import { type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { GraduationCap, LogOut, LayoutDashboard, Package, CalendarDays, ClipboardList, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = profile?.role === 'admin';

  const handleSignOut = async () => {
    await signOut();
    showToast('You have been signed out.', 'info');
    onNavigate('login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'equipment', label: 'Equipment', icon: Package },
    { id: 'my-bookings', label: 'My Bookings', icon: CalendarDays },
  ];

  const adminItems = [
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'admin-equipment', label: 'Manage Equipment', icon: Settings },
    { id: 'admin-bookings', label: 'Manage Bookings', icon: ClipboardList },
  ];

  const handleNav = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => handleNav(isAdmin ? 'admin-dashboard' : 'dashboard')} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg hidden sm:block">UniEquip</span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  active={currentPage === item.id}
                  onClick={() => handleNav(item.id)}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
              {isAdmin && adminItems.map((item) => (
                <NavButton
                  key={item.id}
                  active={currentPage === item.id}
                  onClick={() => handleNav(item.id)}
                  icon={item.icon}
                  label={item.label}
                  admin
                />
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{profile?.full_name}</p>
                <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              <div className="px-3 py-2 mb-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-700">{profile?.full_name}</p>
                <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
              </div>
              {navItems.map((item) => (
                <MobileNavButton
                  key={item.id}
                  active={currentPage === item.id}
                  onClick={() => handleNav(item.id)}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
              {isAdmin && (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Admin</div>
                  {adminItems.map((item) => (
                    <MobileNavButton
                      key={item.id}
                      active={currentPage === item.id}
                      onClick={() => handleNav(item.id)}
                      icon={item.icon}
                      label={item.label}
                    />
                  ))}
                </>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
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

function NavButton({ active, onClick, icon: Icon, label, admin }: { active: boolean; onClick: () => void; icon: typeof LayoutDashboard; label: string; admin?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? admin
            ? 'bg-blue-50 text-blue-700'
            : 'bg-slate-100 text-slate-900'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof LayoutDashboard; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${
        active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

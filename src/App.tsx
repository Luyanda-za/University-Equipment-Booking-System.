import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { EquipmentList } from '@/pages/EquipmentList';
import { EquipmentDetails } from '@/pages/EquipmentDetails';
import { CreateBooking } from '@/pages/CreateBooking';
import { MyBookings } from '@/pages/MyBookings';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminEquipment } from '@/pages/AdminEquipment';
import { AdminBookings } from '@/pages/AdminBookings';
import { Settings } from '@/pages/Settings';
import { Loader2 } from 'lucide-react';

type Page =
  | 'login'
  | 'register'
  | 'dashboard'
  | 'equipment'
  | 'equipment-details'
  | 'create-booking'
  | 'my-bookings'
  | 'admin-dashboard'
  | 'admin-equipment'
  | 'admin-bookings'
  | 'settings';

const ADMIN_PAGES: Page[] = ['admin-dashboard', 'admin-equipment', 'admin-bookings'];

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  // Reset to a safe page when auth state changes
  useEffect(() => {
    if (!loading) {
      if (!session) {
        setPage('login');
      } else if (page === 'login' || page === 'register') {
        setPage(isAdmin ? 'admin-dashboard' : 'dashboard');
      }
    }
  }, [session, loading, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guard admin pages - non-admins can't access
  useEffect(() => {
    if (!loading && session && ADMIN_PAGES.includes(page) && !isAdmin) {
      setPage('dashboard');
    }
  }, [page, isAdmin, session, loading]);

  // Guard user pages - admins can't access user-only features
  const USER_ONLY_PAGES: Page[] = ['dashboard', 'equipment', 'equipment-details', 'create-booking', 'my-bookings'];
  useEffect(() => {
    if (!loading && session && isAdmin && USER_ONLY_PAGES.includes(page)) {
      setPage('admin-dashboard');
    }
  }, [page, isAdmin, session, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNavigate = (newPage: string) => {
    setPage(newPage as Page);
  };

  const handleSelectEquipment = (id: string) => {
    setSelectedEquipmentId(id);
    setPage('equipment-details');
  };

  const handleBook = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId);
    setPage('create-booking');
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Unauthenticated: show login or register
  if (!session) {
    if (page === 'register') {
      return <Register onNavigate={handleNavigate} />;
    }
    return <Login onNavigate={handleNavigate} />;
  }

  // Authenticated pages wrapped in Layout
  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} onSelectEquipment={handleSelectEquipment} />;
      case 'equipment':
        return <EquipmentList onSelectEquipment={handleSelectEquipment} />;
      case 'equipment-details':
        return selectedEquipmentId ? (
          <EquipmentDetails
            equipmentId={selectedEquipmentId}
            onBack={() => setPage('equipment')}
            onBook={handleBook}
          />
        ) : (
          <EquipmentList onSelectEquipment={handleSelectEquipment} />
        );
      case 'create-booking':
        return selectedEquipmentId ? (
          <CreateBooking
            equipmentId={selectedEquipmentId}
            onBack={() => setPage('equipment-details')}
            onSuccess={() => setPage('my-bookings')}
          />
        ) : (
          <EquipmentList onSelectEquipment={handleSelectEquipment} />
        );
      case 'my-bookings':
        return <MyBookings onNavigate={handleNavigate} />;
      case 'admin-dashboard':
        return isAdmin ? <AdminDashboard onNavigate={handleNavigate} /> : <Dashboard onNavigate={handleNavigate} onSelectEquipment={handleSelectEquipment} />;
      case 'admin-equipment':
        return isAdmin ? <AdminEquipment /> : <Dashboard onNavigate={handleNavigate} onSelectEquipment={handleSelectEquipment} />;
      case 'admin-bookings':
        return isAdmin ? <AdminBookings /> : <Dashboard onNavigate={handleNavigate} onSelectEquipment={handleSelectEquipment} />;
      case 'settings':
        return <Settings onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} onSelectEquipment={handleSelectEquipment} />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

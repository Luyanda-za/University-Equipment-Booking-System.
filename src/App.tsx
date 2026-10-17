// Import React hooks for managing navigation state and responding to authentication changes.
import { useState, useEffect } from 'react';

// Import authentication and notification providers used throughout the application.
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';

// Import the shared layout and all application pages.
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

// Import the loading spinner displayed while authentication is checked.
import { Loader2 } from 'lucide-react';

// Define all valid pages that users can navigate to in the application.
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

// Keep the administrator-only pages together for access-control checks.
const ADMIN_PAGES: Page[] = [
  'admin-dashboard',
  'admin-equipment',
  'admin-bookings',
];

function AppContent() {
  // Read the current session, user profile, and authentication loading state.
  const { session, profile, loading } = useAuth();

  // Track the active page and the equipment selected for viewing or booking.
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  // Determine whether the signed-in user has the administrator role.
  const isAdmin = profile?.role === 'admin';

  // Redirect users to the correct page when authentication status changes.
  useEffect(() => {
    if (!loading) {
      if (!session) {
        // Users without an active session must sign in.
        setPage('login');
      } else if (page === 'login' || page === 'register') {
        // After authentication, direct users to the dashboard for their role.
        setPage(isAdmin ? 'admin-dashboard' : 'dashboard');
      }
    }
  }, [session, loading, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent non-administrator users from accessing administrator pages.
  useEffect(() => {
    if (!loading && session && ADMIN_PAGES.includes(page) && !isAdmin) {
      setPage('dashboard');
    }
  }, [page, isAdmin, session, loading]);

  // Prevent administrators from accessing regular-user-only features.
  const USER_ONLY_PAGES: Page[] = [
    'dashboard',
    'equipment',
    'equipment-details',
    'create-booking',
    'my-bookings',
  ];

  useEffect(() => {
    if (!loading && session && isAdmin && USER_ONLY_PAGES.includes(page)) {
      setPage('admin-dashboard');
    }
  }, [page, isAdmin, session, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update the active page when a component requests navigation.
  const handleNavigate = (newPage: string) => {
    setPage(newPage as Page);
  };

  // Save the selected equipment ID and open its details page.
  const handleSelectEquipment = (id: string) => {
    setSelectedEquipmentId(id);
    setPage('equipment-details');
  };

  // Save the equipment ID and open the booking form for that item.
  const handleBook = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId);
    setPage('create-booking');
  };

  // Display a loading screen while the authentication state is being determined.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // If the user is not authenticated, display the login or registration page.
  if (!session) {
    if (page === 'register') {
      return <Register onNavigate={handleNavigate} />;
    }
    return <Login onNavigate={handleNavigate} />;
  }

  // Select the page component to render based on the current navigation state.
  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} onSelectEquipment={handleSelectEquipment} />;

      case 'equipment':
        return <EquipmentList onSelectEquipment={handleSelectEquipment} />;

      case 'equipment-details':
        // Require a selected equipment ID before showing its details.
        return selectedEquipmentId ? (
          <EquipmentDetails
            equipmentId={selectedEquipmentId}
            onBack={() => setPage('equipment')}
            onBook={handleBook}
          />
        ) : (
          // If no item is selected, return to the equipment list.
          <EquipmentList onSelectEquipment={handleSelectEquipment} />
        );

      case 'create-booking':
        // Open the booking form only when an equipment item has been selected.
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
        // Render the administrator dashboard only for an administrator.
        return isAdmin
          ? <AdminDashboard onNavigate={handleNavigate} />
          : <Dashboard onNavigate={handleNavigate} onSelectEquipment={handleSelectEquipment} />;

      case 'admin-equipment':
        // Restrict equipment administration to administrator accounts.
        return isAdmin
          ? <AdminEquipment />
          : <Dashboard onNavigate={handleNavigate} onSelectEquipment={handleSelectEquipment} />;

      case 'admin-bookings':
        // Restrict booking administration to administrator accounts.
        return isAdmin
          ? <AdminBookings />
          : <Dashboard onNavigate={handleNavigate} onSelectEquipment={handleSelectEquipment} />;

      case 'settings':
        // Open settings for the currently authenticated user.
        return <Settings onNavigate={handleNavigate} />;

      default:
        // Show the standard dashboard if the current page is not recognised.
        return <Dashboard onNavigate={handleNavigate} onSelectEquipment={handleSelectEquipment} />;
    }
  };

  // Wrap authenticated pages in the shared layout and navigation interface.
  return (
    <Layout currentPage={page} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

// Set up application-wide providers for notifications and authentication.
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

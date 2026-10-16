import { useState, useEffect } from 'react';
import { supabase, bustImageCache } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Booking, Equipment } from '@/types/database';
import { BookingStatusBadge } from '@/components/StatusBadge';
import { Package, CalendarDays, Clock, ArrowRight, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onSelectEquipment: (id: string) => void;
}

export function Dashboard({ onNavigate, onSelectEquipment }: DashboardProps) {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!profile) return;

    const [bookingsRes, eqRes] = await Promise.all([
      supabase
        .from('bookings')
        .select(
          `id, user_id, equipment_id, start_time, end_time, status, created_at,
           equipment:equipment_id ( id, name, category, location, status, description, image_url, created_at )`
        )
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('equipment').select('id', { count: 'exact', head: true }),
    ]);

    if (bookingsRes.data) setBookings(bookingsRes.data as unknown as Booking[]);
    if (eqRes.count !== null) setEquipmentCount(eqRes.count);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const upcoming = bookings.filter(
    (b) => (b.status === 'pending' || b.status === 'approved') && new Date(b.start_time) > new Date()
  );

  const now = new Date();
  const reminders = bookings.filter((b) => {
    if (b.status !== 'approved') return false;
    const end = new Date(b.end_time);
    const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 24;
  });

  const returnedBookings = bookings.filter((b) => b.status === 'returned').slice(0, 3);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your equipment bookings</p>
      </div>

      {/* Return Reminders */}
      {reminders.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Return Reminders</h2>
          </div>
          <div className="space-y-3">
            {reminders.map((booking) => {
              const hoursLeft = Math.ceil((new Date(booking.end_time).getTime() - now.getTime()) / (1000 * 60 * 60));
              return (
                <div key={booking.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {booking.equipment?.image_url ? (
                      <img src={bustImageCache(booking.equipment.image_url) ?? undefined} alt={booking.equipment.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm">{booking.equipment?.name ?? 'Unknown'}</h3>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Due back {formatDate(booking.end_time)} at {formatTime(booking.end_time)} — {hoursLeft} hour{hoursLeft !== 1 ? 's' : ''} left
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 whitespace-nowrap">
                    {hoursLeft}h left
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently Returned */}
      {returnedBookings.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Recently Returned</h2>
          </div>
          <div className="space-y-3">
            {returnedBookings.map((booking) => (
              <div key={booking.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {booking.equipment?.image_url ? (
                    <img src={bustImageCache(booking.equipment.image_url) ?? undefined} alt={booking.equipment.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">{booking.equipment?.name ?? 'Unknown'}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Returned after {formatDate(booking.start_time)} — {formatDate(booking.end_time)}
                  </p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Equipment" value={equipmentCount} icon={Package} color="blue" />
        <StatCard label="My Upcoming Bookings" value={upcoming.length} icon={CalendarDays} color="emerald" />
        <StatCard label="Total Bookings" value={bookings.length} icon={Clock} color="amber" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => onNavigate('equipment')}
          className="group bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-blue-300 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900">Browse Equipment</h3>
              <p className="text-sm text-slate-500 mt-0.5">View and book available equipment</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        <button
          onClick={() => onNavigate('my-bookings')}
          className="group bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-blue-300 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                <CalendarDays className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900">My Bookings</h3>
              <p className="text-sm text-slate-500 mt-0.5">View and manage your bookings</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
          {bookings.length > 0 && (
            <button
              onClick={() => onNavigate('my-bookings')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View all
            </button>
          )}
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">No bookings yet</p>
            <p className="text-sm text-slate-400">Browse equipment to make your first booking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((booking) => (
              <button
                key={booking.id}
                onClick={() => booking.equipment && onSelectEquipment(booking.equipment.id)}
                className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition-shadow flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {booking.equipment?.image_url ? (
                    <img src={bustImageCache(booking.equipment.image_url) ?? undefined} alt={booking.equipment.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">{booking.equipment?.name ?? 'Unknown'}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(booking.start_time)} — {formatDate(booking.end_time)}
                  </p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Package; color: 'blue' | 'emerald' | 'amber' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

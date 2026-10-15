import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { BookingStatusBadge } from '@/components/StatusBadge';
import { bustImageCache } from '@/lib/supabase';
import type { Booking } from '@/types/database';
import {
  Package, CalendarDays, CheckCircle, Clock, XCircle, Settings,
  ClipboardList, ArrowRight, Loader2, TrendingUp, Users, AlertCircle,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

interface Stats {
  totalEquipment: number;
  availableEquipment: number;
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  upcomingBookings: number;
  cancelledBookings: number;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { showToast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalEquipment: 0, availableEquipment: 0, totalBookings: 0,
    pendingBookings: 0, approvedBookings: 0, rejectedBookings: 0,
    upcomingBookings: 0, cancelledBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('admin-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    const now = new Date().toISOString();

    const [
      eqRes, eqAvailRes,
      totalRes, pendingRes, approvedRes, rejectedRes, cancelledRes,
      upcomingRes, recentRes,
    ] = await Promise.all([
      supabase.from('equipment').select('id', { count: 'exact', head: true }),
      supabase.from('equipment').select('id', { count: 'exact', head: true }).eq('status', 'available'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'approved').gt('start_time', now),
      supabase
        .from('bookings')
        .select(
          `id, user_id, equipment_id, start_time, end_time, status, rejection_reason, created_at,
           equipment:equipment_id ( id, name, description, category, location, status, image_url, created_at ),
           profile:user_id ( id, full_name, role, created_at )`
        )
        .order('created_at', { ascending: false })
        .limit(4),
    ]);

    if (eqRes.error || totalRes.error) {
      showToast('Failed to load dashboard data.', 'error');
    } else {
      setStats({
        totalEquipment: eqRes.count ?? 0,
        availableEquipment: eqAvailRes.count ?? 0,
        totalBookings: totalRes.count ?? 0,
        pendingBookings: pendingRes.count ?? 0,
        approvedBookings: approvedRes.count ?? 0,
        rejectedBookings: rejectedRes.count ?? 0,
        upcomingBookings: upcomingRes.count ?? 0,
        cancelledBookings: cancelledRes.count ?? 0,
      });
      setRecentBookings(recentRes.data as unknown as Booking[] ?? []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const approvalRate = stats.totalBookings > 0
    ? Math.round((stats.approvedBookings / stats.totalBookings) * 100)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Booking analytics and system overview</p>
      </div>

      {/* Booking Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Bookings" value={stats.totalBookings} icon={CalendarDays} color="blue" />
        <StatCard label="Upcoming" value={stats.upcomingBookings} icon={Clock} color="indigo" />
        <StatCard label="Pending" value={stats.pendingBookings} icon={AlertCircle} color="amber" />
        <StatCard label="Approved" value={stats.approvedBookings} icon={CheckCircle} color="emerald" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Rejected" value={stats.rejectedBookings} icon={XCircle} color="red" />
        <StatCard label="Cancelled" value={stats.cancelledBookings} icon={XCircle} color="slate" />
        <StatCard label="Approval Rate" value={`${approvalRate}%`} icon={TrendingUp} color="emerald" />
        <StatCard label="Total Equipment" value={stats.totalEquipment} icon={Package} color="blue" />
      </div>

      {/* Pending alert */}
      {stats.pendingBookings > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-900">
              {stats.pendingBookings} booking{stats.pendingBookings !== 1 ? 's' : ''} awaiting approval
            </p>
            <p className="text-sm text-amber-700">Review and approve or reject pending requests</p>
          </div>
          <button
            onClick={() => onNavigate('admin-bookings')}
            className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            Review Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => onNavigate('admin-equipment')}
          className="group bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-blue-300 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900">Manage Equipment</h3>
              <p className="text-sm text-slate-500 mt-0.5">Add, edit, or remove equipment</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        <button
          onClick={() => onNavigate('admin-bookings')}
          className="group bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-blue-300 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
                <ClipboardList className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900">Manage Bookings</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {stats.pendingBookings > 0 ? `${stats.pendingBookings} pending approval` : 'View all bookings'}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
          <button
            onClick={() => onNavigate('admin-bookings')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            View all
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {booking.equipment?.image_url ? (
                    <img src={bustImageCache(booking.equipment.image_url) ?? undefined} alt={booking.equipment.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">{booking.equipment?.name ?? 'Unknown'}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    {booking.profile?.full_name ?? 'Unknown'} · {formatDate(booking.start_time)} — {formatDate(booking.end_time)}
                  </p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type StatColor = 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'slate';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: typeof Package; color: StatColor }) {
  const colors: Record<StatColor, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    slate: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
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

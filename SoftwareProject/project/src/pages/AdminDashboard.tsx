import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import type { Equipment } from '@/types/database';
import { Package, CalendarDays, CheckCircle, Clock, Loader2, ArrowRight } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { showToast } = useToast();
  const [stats, setStats] = useState({ total: 0, available: 0, pending: 0, approved: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const [eqRes, eqAvailRes, pendingRes, approvedRes, recentRes] = await Promise.all([
      supabase.from('equipment').select('id', { count: 'exact', head: true }),
      supabase.from('equipment').select('id', { count: 'exact', head: true }).eq('status', 'available'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase
        .from('bookings')
        .select(
          `id, start_time, end_time, status, created_at,
           equipment:equipment_id ( name ),
           profile:user_id ( full_name )`
        )
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    if (eqRes.error || pendingRes.error) {
      showToast('Failed to load dashboard data.', 'error');
    } else {
      setStats({
        total: eqRes.count ?? 0,
        available: eqAvailRes.count ?? 0,
        pending: pendingRes.count ?? 0,
        approved: approvedRes.count ?? 0,
      });
      setRecentBookings(recentRes.data ?? []);
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of equipment and bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Equipment" value={stats.total} icon={Package} color="blue" />
        <StatCard label="Available" value={stats.available} icon={CheckCircle} color="emerald" />
        <StatCard label="Pending Bookings" value={stats.pending} icon={Clock} color="amber" />
        <StatCard label="Approved Bookings" value={stats.approved} icon={CalendarDays} color="blue" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => onNavigate('admin-equipment')}
          className="group bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-blue-300 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Package className="w-5 h-5 text-blue-600" />
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
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900">Manage Bookings</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {stats.pending > 0 ? `${stats.pending} pending approval` : 'View all bookings'}
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
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">{booking.equipment?.name ?? 'Unknown'}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {booking.profile?.full_name ?? 'Unknown'} · {formatDate(booking.start_time)} — {formatDate(booking.end_time)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                    booking.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : booking.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : booking.status === 'rejected'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {booking.status}
                </span>
              </div>
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

import { useState, useEffect } from 'react';
import { supabase, bustImageCache } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import type { Booking } from '@/types/database';
import { BookingStatusBadge } from '@/components/StatusBadge';
import { CalendarDays, Loader2, XCircle, Package, MapPin, Clock, MessageSquare } from 'lucide-react';

interface MyBookingsProps {
  onNavigate: (page: string) => void;
}

export function MyBookings({ onNavigate }: MyBookingsProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    if (!profile) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `id, user_id, equipment_id, start_time, end_time, status, rejection_reason, created_at,
         equipment:equipment_id (id, name, description, category, location, status, image_url, created_at )`
      )
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Failed to load bookings.', 'error');
    } else {
      setBookings(data as unknown as Booking[]);
    }
    setLoading(false);
  };

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .in('status', ['pending', 'approved']);

    setCancellingId(null);

    if (error) {
      showToast('Failed to cancel booking.', 'error');
    } else {
      showToast('Booking cancelled successfully.', 'success');
      loadBookings();
    }
  };

  const canCancel = (booking: Booking) => {
    if (booking.status !== 'pending' && booking.status !== 'approved') return false;
    return new Date(booking.start_time) > new Date();
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">View and manage your equipment bookings</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No bookings yet</p>
          <p className="text-sm text-slate-400 mb-4">Browse equipment to make your first booking</p>
          <button
            onClick={() => onNavigate('equipment')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            Browse Equipment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Equipment info */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {booking.equipment?.image_url ? (
                      <img src={bustImageCache(booking.equipment.image_url) ?? undefined} alt={booking.equipment.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900">{booking.equipment?.name ?? 'Unknown equipment'}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {booking.equipment?.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {formatDate(booking.start_time)} — {formatDate(booking.end_time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(booking.start_time)} — {formatTime(booking.end_time)}
                      </span>
                    </div>
                    {booking.status === 'rejected' && booking.rejection_reason && (
                      <div className="mt-2 flex items-start gap-1.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{booking.rejection_reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & action */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-2">
                  <BookingStatusBadge status={booking.status} />
                  {canCancel(booking) && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {cancellingId === booking.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

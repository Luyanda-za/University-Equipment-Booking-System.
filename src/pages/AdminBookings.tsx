import { useState, useEffect } from 'react';
import { supabase, bustImageCache } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { BookingStatusBadge } from '@/components/StatusBadge';
import type { Booking } from '@/types/database';
import { Loader2, Package, Check, X, Clock, MapPin, Filter, MessageSquare } from 'lucide-react';

export function AdminBookings() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionId, setActionId] = useState<string | null>(null);

  // Rejection modal state
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  useEffect(() => {
    loadBookings();

    const channel = supabase
      .channel('admin-bookings-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => {
        loadBookings();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, () => {
        loadBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadBookings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `id, user_id, equipment_id, start_time, end_time, status, rejection_reason, created_at,
         equipment:equipment_id ( id, name, description, category, location, status, image_url, created_at ),
         profile:user_id ( id, full_name, role, created_at )`
      )
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Failed to load bookings.', 'error');
    } else {
      setBookings(data as unknown as Booking[]);
    }
    setLoading(false);
  };

  const handleApprove = async (bookingId: string) => {
    setActionId(bookingId);

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', bookingId)
      .eq('status', 'pending');

    setActionId(null);

    if (error) {
      if (error.message.includes('already booked') || error.message.includes('overlaps')) {
        showToast('Cannot approve: this equipment is already booked for that time period by another approved booking.', 'error');
      } else {
        showToast('Failed to approve booking: ' + error.message, 'error');
      }
      return;
    }

    showToast('Booking approved successfully.', 'success');
    loadBookings();
  };

  const openRejectModal = (booking: Booking) => {
    setRejectTarget(booking);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectTarget) return;

    if (!rejectionReason.trim()) {
      showToast('Please provide a reason for rejecting this booking.', 'error');
      return;
    }

    setRejectSubmitting(true);

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'rejected', rejection_reason: rejectionReason.trim() })
      .eq('id', rejectTarget.id)
      .eq('status', 'pending');

    setRejectSubmitting(false);

    if (error) {
      showToast('Failed to reject booking: ' + error.message, 'error');
      return;
    }

    showToast('Booking rejected with reason sent to user.', 'info');
    setRejectTarget(null);
    loadBookings();
  };

  const filtered = statusFilter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === statusFilter);

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
        <h1 className="text-2xl font-bold text-slate-900">Manage Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">View, approve, or reject booking requests</p>
      </div>

      {/* Filter */}
      <div className="relative mb-4 sm:w-56">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
        >
          <option value="all">All Bookings</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No bookings found</p>
          <p className="text-sm text-slate-400">Try a different filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Equipment & user info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {booking.equipment?.image_url ? (
                      <img src={bustImageCache(booking.equipment.image_url) ?? undefined} alt={booking.equipment.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900">{booking.equipment?.name ?? 'Unknown'}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                      <span className="font-medium text-slate-600">{booking.profile?.full_name ?? 'Unknown user'}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {booking.equipment?.location}
                      </span>
                      <span>
                        {formatDate(booking.start_time)} — {formatDate(booking.end_time)}
                      </span>
                      <span className="text-xs">
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

                {/* Status & actions */}
                <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                  <BookingStatusBadge status={booking.status} />

                  {booking.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={actionId === booking.id}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        {actionId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(booking)}
                        disabled={actionId === booking.id}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 font-semibold px-3 py-1.5 rounded-lg text-sm transition-colors border border-red-200"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection modal with comment box */}
      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Booking" size="sm">
        <div>
          <p className="text-slate-600 mb-1">
            Reject booking for <span className="font-semibold text-slate-900">{rejectTarget?.equipment?.name}</span>
          </p>
          <p className="text-sm text-slate-500 mb-4">
            {rejectTarget && `${formatDate(rejectTarget.start_time)} — ${formatDate(rejectTarget.end_time)}`}
          </p>

          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Reason for rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. The equipment is already reserved for maintenance during this period. Please choose a different time."
            rows={4}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            autoFocus
          />
          <p className="text-xs text-slate-400 mt-1">This reason will be visible to the user who made the booking.</p>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setRejectTarget(null)}
              className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={rejectSubmitting || !rejectionReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {rejectSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {rejectSubmitting ? 'Rejecting...' : 'Reject Booking'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

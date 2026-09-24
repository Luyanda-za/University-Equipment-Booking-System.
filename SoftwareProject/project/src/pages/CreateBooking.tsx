import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import type { Equipment, Booking } from '@/types/database';
import { ArrowLeft, Calendar, Clock, Loader2, Package, MapPin } from 'lucide-react';

interface CreateBookingProps {
  equipmentId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function CreateBooking({ equipmentId, onBack, onSuccess }: CreateBookingProps) {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    loadData();
  }, [equipmentId]);

  const loadData = async () => {
    setLoading(true);

    const { data: eq } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', equipmentId)
      .maybeSingle();

    if (!eq) {
      showToast('Equipment not found.', 'error');
      onBack();
      return;
    }
    setEquipment(eq as Equipment);

    const { data: bks } = await supabase
      .from('bookings')
      .select('id, start_time, end_time, status')
      .eq('equipment_id', equipmentId)
      .in('status', ['approved', 'pending'])
      .order('start_time', { ascending: true });

    setBookings((bks ?? []) as Booking[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!equipment || !profile) return;

    if (!startDate || !startTime || !endDate || !endTime) {
      showToast('Please fill in all date and time fields.', 'error');
      return;
    }

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      showToast('Please enter valid dates and times.', 'error');
      return;
    }

    if (end <= start) {
      showToast('End date/time must be after the start date/time.', 'error');
      return;
    }

    if (start < new Date()) {
      showToast('Cannot book equipment in the past.', 'error');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('bookings').insert({
      equipment_id: equipmentId,
      user_id: profile.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: 'pending',
    });

    setSubmitting(false);

    if (error) {
      const msg = error.message;
      if (msg.includes('already booked') || msg.includes('overlaps')) {
        showToast('This equipment is already booked for the requested time. Please choose a different time.', 'error');
      } else {
        showToast('Failed to create booking: ' + msg, 'error');
      }
      return;
    }

    showToast('Booking request submitted! An administrator will review it shortly.', 'success');
    onSuccess();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!equipment) return null;

  const now = new Date();
  const upcomingBookings = bookings.filter((b) => new Date(b.end_time) > now);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to equipment details
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Create Booking</h1>
      <p className="text-sm text-slate-500 mb-6">Request to book equipment for a specific time period</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          {/* Equipment summary */}
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{equipment.name}</h2>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {equipment.location}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <Calendar className="w-4 h-4 inline mr-1.5 text-slate-400" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <Clock className="w-4 h-4 inline mr-1.5 text-slate-400" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <Calendar className="w-4 h-4 inline mr-1.5 text-slate-400" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <Clock className="w-4 h-4 inline mr-1.5 text-slate-400" />
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <p className="text-sm text-blue-700">
                Your booking request will be submitted as <span className="font-semibold">Pending</span>.
                An administrator will review and approve or reject it.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit Booking Request'}
            </button>
          </form>
        </div>

        {/* Existing bookings sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Existing Bookings
          </h3>

          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No upcoming bookings for this equipment.</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        booking.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(booking.start_time)} — {formatDate(booking.end_time)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatTime(booking.start_time)} to {formatTime(booking.end_time)}
                  </p>
                </div>
              ))}
            </div>
          )}
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

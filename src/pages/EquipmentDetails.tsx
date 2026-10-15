import { useState, useEffect } from 'react';
import { supabase, bustImageCache } from '@/lib/supabase';
import type { Equipment, Booking } from '@/types/database';
import { EquipmentStatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Package, MapPin, Calendar, Clock, Loader2, CheckCircle, ImageIcon } from 'lucide-react';

interface EquipmentDetailsProps {
  equipmentId: string;
  onBack: () => void;
  onBook: (equipmentId: string) => void;
}

export function EquipmentDetails({ equipmentId, onBack, onBook }: EquipmentDetailsProps) {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadEquipment();
  }, [equipmentId]);

  const loadEquipment = async () => {
    setLoading(true);

    const { data: eq, error: eqError } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', equipmentId)
      .maybeSingle();

    if (eqError || !eq) {
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
        Back to equipment
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          {equipment.image_url && (
            <div className="mb-5 rounded-xl overflow-hidden bg-slate-100">
              <img src={bustImageCache(equipment.image_url) ?? undefined} alt={equipment.name} className="w-full h-56 object-cover" />
            </div>
          )}

          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center overflow-hidden">
                {equipment.image_url ? (
                  <img src={bustImageCache(equipment.image_url) ?? undefined} alt={equipment.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-7 h-7 text-blue-600" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{equipment.name}</h1>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                  {equipment.category}
                </span>
              </div>
            </div>
            <EquipmentStatusBadge status={equipment.status} />
          </div>

          <div className="space-y-4 mt-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</h3>
              <p className="text-slate-700 leading-relaxed">{equipment.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-1">Location</h3>
                <p className="text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {equipment.location}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</h3>
                <p className="text-slate-700 flex items-center gap-1.5">
                  {equipment.status === 'available' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                  {equipment.status === 'available' ? 'Available for booking' : 'Currently unavailable'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            {equipment.status === 'available' ? (
              <button
                onClick={() => onBook(equipment.id)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Book This Equipment
              </button>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-500 text-center">
                This equipment is currently unavailable for booking.
              </div>
            )}
          </div>
        </div>

        {/* Availability sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Upcoming Bookings
          </h3>

          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 text-emerald-100 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No upcoming bookings</p>
              <p className="text-xs text-slate-400">This equipment is free to book</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase">
                      {booking.status === 'approved' ? 'Booked' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(booking.start_time)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatTime(booking.start_time)} — {formatTime(booking.end_time)}
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
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

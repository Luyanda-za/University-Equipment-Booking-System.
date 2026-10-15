import type { BookingStatus, EquipmentStatus } from '@/types/database';

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]} capitalize`}>
      {status}
    </span>
  );
}

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  const styles: Record<EquipmentStatus, string> = {
    available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    unavailable: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const dot = status === 'available' ? 'bg-emerald-500' : 'bg-gray-400';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]} capitalize`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

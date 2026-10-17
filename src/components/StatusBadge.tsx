// Import the status types to ensure only valid booking and equipment statuses are used.
import type { BookingStatus, EquipmentStatus } from '@/types/database';

// Displays a coloured badge representing the current booking status.
export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  // Map each booking status to its corresponding Tailwind CSS colours.
  const styles: Record<BookingStatus, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
    returned: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    // Apply the matching style and display the status as a rounded badge.
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]} capitalize`}>
      {status}
    </span>
  );
}

// Displays a coloured badge indicating whether equipment is available.
export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  // Choose the badge colours based on the equipment's current status.
  const styles: Record<EquipmentStatus, string> = {
    available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    unavailable: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  // Use a green dot for available equipment and a grey dot otherwise.
  const dot = status === 'available' ? 'bg-emerald-500' : 'bg-gray-400';

  return (
    // Display the equipment status with its matching colours and indicator dot.
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]} capitalize`}>
      {/* Small visual indicator for the equipment's availability. */}
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

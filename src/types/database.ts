export type UserRole = 'user' | 'admin';

export type EquipmentStatus = 'available' | 'unavailable';

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'returned';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  status: EquipmentStatus;
  image_url: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  equipment_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  rejection_reason: string | null;
  created_at: string;
  equipment?: Equipment;
  profile?: Profile;
}

export interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
}

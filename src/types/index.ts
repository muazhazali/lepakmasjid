// Core types matching PRD schema

export interface Mosque {
  id: string;
  name: string;
  name_bm?: string;
  address: string;
  state: string;
  lat: number;
  lng: number;
  description?: string;
  description_bm?: string;
  image?: string | File | string[]; // File field: string (filename) or File (for upload) or array if multiple
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  created: string;
  updated: string;
  // Optional fields for list view with amenities and activities
  amenities?: (Amenity & { details: MosqueAmenityDetails; verified: boolean })[];
  customAmenities?: MosqueAmenity[];
  activities?: Activity[];
}

export interface Amenity {
  id: string;
  key: string;
  label_bm: string;
  label_en: string;
  icon: string;
  order: number;
  created: string;
  updated: string;
}

export interface MosqueAmenityDetails {
  notes?: string;
  // For custom amenities:
  custom_name?: string;
  custom_name_en?: string;
  custom_icon?: string;
}

export interface MosqueAmenity {
  id: string;
  mosque_id: string;
  amenity_id?: string | null; // null for custom amenities
  details: MosqueAmenityDetails;
  verified: boolean;
  created: string;
  updated: string;
}

export interface ActivitySchedule {
  // For one_off:
  date?: string; // ISO date
  time?: string;
  
  // For recurring:
  recurrence?: 'daily' | 'weekly' | 'monthly';
  days_of_week?: number[]; // 0-6, Sunday=0
  start_date?: string; // ISO date
  end_date?: string; // ISO date (optional)
}

export interface Activity {
  id: string;
  mosque_id: string;
  title: string;
  title_bm?: string;
  description: string;
  description_bm?: string;
  type: 'one_off' | 'recurring' | 'fixed';
  schedule_json: ActivitySchedule;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'cancelled';
  created_by: string;
  created: string;
  updated: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  avatar?: string;
  verified: boolean;
  trust_score: number;
  role?: 'user' | 'admin';
  created: string;
  updated: string;
}

export interface Submission {
  id: string;
  type: 'new_mosque' | 'edit_mosque';
  mosque_id?: string;
  data: Record<string, unknown>; // Full mosque data
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: string;
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created: string;
  updated: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  created: string;
}

// Extended types for UI
export interface MosqueWithDetails extends Mosque {
  amenities: (Amenity & { details: MosqueAmenityDetails; verified: boolean })[];
  activities: Activity[];
  customAmenities: MosqueAmenity[];
}

// Filter and search types
export interface MosqueFilters {
  state?: string;
  amenities?: string[];
  search?: string;
  sortBy?: 'nearest' | 'most_amenities' | 'alphabetical';
  userLocation?: { lat: number; lng: number };
  distance?: number; // in km
  page?: number;
  perPage?: number;
}

// Pagination response type
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

// Malaysian states
export const MALAYSIAN_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'WP Kuala Lumpur',
  'WP Labuan',
  'WP Putrajaya',
] as const;

export type MalaysianState = typeof MALAYSIAN_STATES[number];


export type VolunteerType = 'online' | 'offline';

export type VolunteerStatus =
  | 'draft'
  | 'published'
  | 'closed'
  | 'completed'
  | 'cancelled';

export type VolunteerApplicationStatus =
  | 'applied'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type VolunteerAttendanceStatus = 'present' | 'absent' | 'partial';

export type VolunteerCertificateStatus = 'available' | 'pending' | 'not_available';

export type VolunteerFormStatus = 'draft' | 'published';

export interface VolunteerApplicationSummary {
  id: number;
  status: VolunteerApplicationStatus;
  applied_at: string;
  reviewed_at: string | null;
}

export interface VolunteerOpportunity {
  id: number;
  title: string;
  description: string;
  category: string | null;
  banner_url: string | null;
  volunteer_type: VolunteerType;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_url: string | null;
  capacity: number | null;
  requirements: string | null;
  status: VolunteerStatus;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  occupied: number;
  remaining: number | null;
  is_full: boolean;
  my_application?: VolunteerApplicationSummary | null;
  my_attendance?: {
    status: VolunteerAttendanceStatus;
    duration_minutes: number;
  } | null;
  certificate_status?: VolunteerCertificateStatus;
  certificate_number?: string | null;
  application_id?: number;
  application_status?: VolunteerApplicationStatus;
  applied_at?: string;
  reviewed_at?: string | null;
  attendance_status?: VolunteerAttendanceStatus | null;
  duration_minutes?: number | null;
  application_total?: number;
  approved_count?: number;
  completed_count?: number;
}

export interface VolunteerApplication {
  id: number;
  opportunity_id: number;
  user_id: number;
  status: VolunteerApplicationStatus;
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by?: number | null;
  participant_name: string;
  participant_email: string;
  participant_role: string;
}

export interface VolunteerAttendance {
  application_id: number;
  user_id: number;
  application_status: VolunteerApplicationStatus;
  participant_name: string;
  participant_email: string;
  participant_role: string;
  attendance_status: VolunteerAttendanceStatus | null;
  check_in: string | null;
  check_out: string | null;
  duration_minutes: number | null;
  source: 'admin' | 'system' | null;
  certificate_number: string | null;
  issued_at: string | null;
}

export interface VolunteerStats {
  total_opportunities: number;
  published: number;
  upcoming: number;
  completed_opportunities: number;
  total_applications: number;
  approved_volunteers: number;
  completed_applications: number;
}

export interface CreateVolunteerOpportunityData {
  title: string;
  description: string;
  category?: string;
  banner_url?: string;
  volunteer_type: VolunteerType;
  event_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_url?: string;
  capacity?: number | null;
  requirements?: string;
  status: VolunteerFormStatus | VolunteerStatus;
}

export interface VolunteerFormValues {
  title: string;
  description: string;
  category: string;
  banner_url: string;
  volunteer_type: VolunteerType;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  meeting_url: string;
  capacity: string;
  requirements: string;
  status: VolunteerStatus;
}

export type VolunteerFormErrors = Partial<Record<keyof VolunteerFormValues, string>>;

export interface VolunteerListFilters {
  search?: string;
  category?: string;
  volunteer_type?: VolunteerType | '';
  from_date?: string;
  status?: VolunteerStatus | '';
}

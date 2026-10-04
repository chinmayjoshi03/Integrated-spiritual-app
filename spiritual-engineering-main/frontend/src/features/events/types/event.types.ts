export type EventType = 'online' | 'offline';

export type EventStatus = 'draft' | 'published' | 'cancelled';

export type EventLifecycleStatus =
  | 'draft'
  | 'upcoming'
  | 'live'
  | 'completed'
  | 'cancelled';

export type AttendanceStatus = 'present' | 'absent';

export type CertificateStatus = 'available' | 'pending' | 'not_available';

export interface Event {
  id: number;
  title: string;
  description: string | null;
  banner_url: string | null;
  event_type: EventType;
  event_date: string;
  start_time: string;
  duration_minutes: number;
  location: string | null;
  meeting_url: string | null;
  capacity: number | null;
  fee: number;
  status: EventStatus;
  created_by: number | null;
  created_by_name?: string;
  registered_count?: number;
  is_registered?: boolean;
  registered_at?: string;
  attendance_status?: AttendanceStatus | null;
  certificate_status?: CertificateStatus | null;
  certificate_number?: string | null;
  certificate_issued_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EventRegistrationWithUser {
  id: number;
  event_id: number;
  user_id: number;
  registered_at: string;
  participant_name: string;
  participant_email: string;
}

export interface EventRegistrationsResponse {
  event_id: number;
  title: string;
  capacity: number | null;
  registered: number;
  remaining: number | null;
  is_full: boolean;
  participants: EventRegistrationWithUser[];
}

export interface EventAttendanceRow {
  user_id: number;
  participant_name: string;
  participant_email: string;
  registered_at: string;
  attendance_status: AttendanceStatus | null;
  marked_at: string | null;
  marked_by: number | null;
  source?: 'auto' | 'admin' | null;
  joined_at?: string | null;
  last_seen_at?: string | null;
  participation_seconds?: number;
  participation_minutes?: number;
}

export interface EventAttendanceResponse {
  event_id: number;
  registered: number;
  present: number;
  absent: number;
  unmarked: number;
  attendance_rate: number;
  participants: EventAttendanceRow[];
}

export interface EventCertificateRow {
  user_id: number;
  participant_name: string;
  participant_email: string;
  attendance_status: AttendanceStatus | null;
  certificate_id: number | null;
  certificate_number: string | null;
  issued_at: string | null;
  certificate_status: CertificateStatus;
}

export interface EventCertificatesResponse {
  event_id: number;
  eligible: number;
  issued: number;
  pending: number;
  participants: EventCertificateRow[];
}

export interface EventCertificate {
  id: number;
  event_id: number;
  user_id: number;
  certificate_number: string;
  issued_at: string;
  certificate_url: string | null;
  event_title?: string;
  event_date?: string;
}

export interface EventAnalytics {
  event_id: number;
  title: string;
  status: EventStatus;
  event_type: EventType;
  event_date: string;
  start_time: string;
  duration_minutes: number;
  capacity: number | null;
  registered: number;
  remaining: number | null;
  attendance_present: number;
  attendance_absent: number;
  attendance_rate: number;
  certificates_issued: number;
  certificates_eligible: number;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  user_id: number;
  registered_at: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  banner_url?: string;
  event_type: EventType;
  event_date: string;
  start_time: string;
  duration_minutes: number;
  location?: string;
  meeting_url?: string;
  capacity?: number;
  fee?: number;
  status?: EventStatus;
}

export type EventFormStatus = 'draft' | 'published';

export interface EventFormValues {
  title: string;
  description: string;
  banner_url: string;
  event_type: EventType;
  event_date: string;
  start_time: string;
  duration_minutes: string;
  location: string;
  meeting_url: string;
  capacity: string;
  fee: string;
  status: EventFormStatus;
}

export type EventFormErrors = Partial<Record<keyof EventFormValues, string>>;
export type NotificationSource = 'automatic' | 'manual';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  source: NotificationSource;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  page: number;
  limit: number;
  total: number;
}

export interface NotificationPreferences {
  event_notifications: boolean;
  volunteering_notifications: boolean;
  camp_notifications: boolean;
  course_notifications: boolean;
  meditation_notifications: boolean;
  community_notifications: boolean;
  reminder_notifications: boolean;
  updated_at?: string;
}

export interface NotificationRule {
  id: number;
  notification_type: string;
  entity_type: string;
  enabled: boolean;
  timing_minutes: number | null;
  audience: string;
  title_template: string | null;
  message_template: string | null;
  timing_label: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationOverview {
  total_notifications: number;
  automatic_notifications: number;
  manual_notifications: number;
  unread_notifications: number;
  total_rules: number;
  active_rules: number;
}

export interface AdminNotificationRecord extends AppNotification {
  user_id: number;
  user_name: string;
  user_role: string;
}

export interface AdminActivityResponse {
  notifications: AdminNotificationRecord[];
  page: number;
  limit: number;
  total: number;
}

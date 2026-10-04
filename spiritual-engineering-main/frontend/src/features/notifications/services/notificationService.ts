import axiosInstance from '@/services/axiosInstance';
import type {
  AdminActivityResponse,
  NotificationListResponse,
  NotificationOverview,
  NotificationPreferences,
  NotificationRule,
} from '../types/notification.types';

export const getNotifications = async (params?: {
  page?: number;
  limit?: number;
  unread?: boolean;
}): Promise<NotificationListResponse> => {
  const response = await axiosInstance.get('/notifications', { params });
  return response.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await axiosInstance.get('/notifications/unread-count');
  return Number(response.data?.unread_count || 0);
};

export const markNotificationRead = async (id: number): Promise<void> => {
  await axiosInstance.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await axiosInstance.patch('/notifications/read-all');
};

export const dismissNotification = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/notifications/${id}`);
};

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await axiosInstance.get('/notifications/preferences');
  return response.data;
};

export const updateNotificationPreferences = async (
  patch: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const response = await axiosInstance.patch('/notifications/preferences', patch);
  return response.data.preferences;
};

export const getAdminNotificationOverview = async (): Promise<NotificationOverview> => {
  const response = await axiosInstance.get('/notifications/admin/overview');
  return response.data;
};

export const getAdminNotificationRules = async (): Promise<NotificationRule[]> => {
  const response = await axiosInstance.get('/notifications/admin/rules');
  return Array.isArray(response.data) ? response.data : [];
};

export const createAdminNotificationRule = async (payload: {
  notification_type: string;
  entity_type: string;
  audience: string;
  title_template: string;
  message_template: string;
  timing_minutes?: number | null;
  enabled?: boolean;
}): Promise<NotificationRule> => {
  const response = await axiosInstance.post('/notifications/admin/rules', payload);
  return response.data.rule;
};

export const updateAdminNotificationRule = async (
  id: number,
  payload: Partial<{
    enabled: boolean;
    timing_minutes: number | null;
    audience: string;
    title_template: string;
    message_template: string;
  }>
): Promise<NotificationRule> => {
  const response = await axiosInstance.patch(`/notifications/admin/rules/${id}`, payload);
  return response.data.rule;
};

export const deleteAdminNotificationRule = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/notifications/admin/rules/${id}`);
};

export const sendAdminNotification = async (payload: {
  title: string;
  message: string;
  audience: string;
  entity_type?: string | null;
  entity_id?: number | null;
  user_id?: number | null;
}): Promise<{ delivered: number }> => {
  const response = await axiosInstance.post('/notifications/admin/send', payload);
  return response.data;
};

export const getAdminNotificationActivity = async (params?: {
  search?: string;
  type?: string;
  source?: string;
  page?: number;
  limit?: number;
}): Promise<AdminActivityResponse> => {
  const response = await axiosInstance.get('/notifications/admin', { params });
  return response.data;
};

import axiosInstance from '@/services/axiosInstance';
import type {
  SupportOverview,
  SupportPriority,
  SupportStatus,
  SupportTicket,
} from '../types/help.types';

export const createSupportTicket = async (payload: {
  category_id?: number | null;
  subject: string;
  description: string;
  priority?: SupportPriority;
  related_entity_type?: string | null;
  related_entity_id?: number | null;
}): Promise<SupportTicket> => {
  const response = await axiosInstance.post('/support/tickets', payload);
  return response.data.ticket;
};

export const getMySupportTickets = async (status?: string): Promise<SupportTicket[]> => {
  const response = await axiosInstance.get('/support/tickets', {
    params: status ? { status } : undefined,
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const getMySupportTicket = async (id: number): Promise<SupportTicket> => {
  const response = await axiosInstance.get(`/support/tickets/${id}`);
  return response.data;
};

export const replyMySupportTicket = async (id: number, message: string): Promise<SupportTicket> => {
  const response = await axiosInstance.post(`/support/tickets/${id}/messages`, { message });
  return response.data.ticket;
};

export const reopenMySupportTicket = async (id: number): Promise<SupportTicket> => {
  const response = await axiosInstance.patch(`/support/tickets/${id}/status`, { status: 'open' });
  return response.data.ticket;
};

export const getAdminSupportOverview = async (): Promise<SupportOverview> => {
  const response = await axiosInstance.get('/support/admin/overview');
  return response.data;
};

export const getAdminSupportTickets = async (params?: {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}): Promise<SupportTicket[]> => {
  const response = await axiosInstance.get('/support/admin/tickets', { params });
  return Array.isArray(response.data) ? response.data : [];
};

export const getAdminSupportTicket = async (id: number): Promise<SupportTicket> => {
  const response = await axiosInstance.get(`/support/admin/tickets/${id}`);
  return response.data;
};

export const replyAdminSupportTicket = async (
  id: number,
  message: string
): Promise<SupportTicket> => {
  const response = await axiosInstance.post(`/support/admin/tickets/${id}/messages`, { message });
  return response.data.ticket;
};

export const updateAdminSupportTicket = async (
  id: number,
  payload: { status?: SupportStatus; priority?: SupportPriority }
): Promise<SupportTicket> => {
  const response = await axiosInstance.patch(`/support/admin/tickets/${id}`, payload);
  return response.data.ticket;
};

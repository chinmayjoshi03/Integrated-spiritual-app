import axiosInstance from '../../../services/axiosInstance';
import type {
  AttendanceStatus,
  CreateEventData,
  Event,
  EventAnalytics,
  EventAttendanceResponse,
  EventCertificate,
  EventCertificatesResponse,
  EventRegistration,
  EventRegistrationsResponse,
} from '../types/event.types';

const asEventArray = (data: unknown): Event[] => {
  return Array.isArray(data) ? data : [];
};

export const getEvents = async (): Promise<Event[]> => {
  const response = await axiosInstance.get('/events');
  return response.data;
};

export const getAdminEvents = async (): Promise<Event[]> => {
  const response = await axiosInstance.get('/events/admin/all');
  return asEventArray(response.data);
};

export const getMyEvents = async (): Promise<Event[]> => {
  const response = await axiosInstance.get('/events/my-events');
  return asEventArray(response.data);
};

export const getEventById = async (id: number): Promise<Event> => {
  const response = await axiosInstance.get(`/events/${id}`);
  return response.data;
};

export const createEvent = async (
  eventData: CreateEventData
): Promise<Event> => {
  const response = await axiosInstance.post('/events', eventData);
  return response.data;
};

export const updateEvent = async (
  id: number,
  eventData: CreateEventData
): Promise<Event> => {
  const response = await axiosInstance.put(`/events/${id}`, eventData);
  return response.data.event ?? response.data;
};

export const cancelEvent = async (id: number): Promise<Event> => {
  const response = await axiosInstance.patch(`/events/${id}/cancel`);
  return response.data.event ?? response.data;
};

export const deleteEvent = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/events/${id}`);
};

export const registerForEvent = async (
  eventId: number
): Promise<{ message: string; registration: EventRegistration }> => {
  const response = await axiosInstance.post(`/events/${eventId}/register`);
  return response.data;
};

export const getEventRegistrations = async (
  eventId: number
): Promise<EventRegistrationsResponse> => {
  const response = await axiosInstance.get(`/events/${eventId}/registrations`);
  return response.data;
};

export const removeEventRegistration = async (
  eventId: number,
  userId: number
): Promise<void> => {
  await axiosInstance.delete(`/events/${eventId}/registrations/${userId}`);
};

export const getEventAttendance = async (
  eventId: number
): Promise<EventAttendanceResponse> => {
  const response = await axiosInstance.get(`/events/${eventId}/attendance`);
  return response.data;
};

export const updateEventAttendance = async (
  eventId: number,
  userId: number,
  status: AttendanceStatus
): Promise<void> => {
  await axiosInstance.put(`/events/${eventId}/attendance`, {
    user_id: userId,
    status,
  });
};

export const getEventCertificates = async (
  eventId: number
): Promise<EventCertificatesResponse> => {
  const response = await axiosInstance.get(`/events/${eventId}/certificates`);
  return response.data;
};

export const issueEventCertificate = async (
  eventId: number,
  userId: number
): Promise<EventCertificate> => {
  const response = await axiosInstance.post(`/events/${eventId}/certificates`, {
    user_id: userId,
  });
  return response.data.certificate ?? response.data;
};

export const issueEligibleEventCertificates = async (
  eventId: number
): Promise<{ issued_count: number; message: string }> => {
  const response = await axiosInstance.post(
    `/events/${eventId}/certificates/issue-eligible`
  );
  return response.data;
};

export const getMyEventCertificate = async (
  eventId: number
): Promise<EventCertificate> => {
  const response = await axiosInstance.get(`/events/${eventId}/certificates/me`);
  return response.data;
};

export const getEventAnalytics = async (
  eventId: number
): Promise<EventAnalytics> => {
  const response = await axiosInstance.get(`/events/${eventId}/analytics`);
  return response.data;
};

export const uploadEventBanner = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('banner', file);

  const response = await axiosInstance.post('/events/uploads/banner', formData);

  return response.data.banner_url;
};

export const joinEventSession = async (eventId: number) => {
  const response = await axiosInstance.post(`/events/${eventId}/session/join`);
  return response.data as {
    message: string;
    meeting_url: string;
    session: { id: number; joined_at: string };
  };
};

export const heartbeatEventSession = async (eventId: number) => {
  const response = await axiosInstance.post(`/events/${eventId}/session/heartbeat`);
  return response.data;
};

export const leaveEventSession = async (eventId: number) => {
  const response = await axiosInstance.post(`/events/${eventId}/session/leave`);
  return response.data;
};

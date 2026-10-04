import axiosInstance from '../../../services/axiosInstance';
import type {
  CreateVolunteerOpportunityData,
  VolunteerApplication,
  VolunteerAttendance,
  VolunteerAttendanceStatus,
  VolunteerListFilters,
  VolunteerOpportunity,
  VolunteerStats,
} from '../types/volunteering.types';

const asArray = <T>(data: unknown): T[] => (Array.isArray(data) ? data : []);

const withFilters = (filters?: VolunteerListFilters) => {
  const params: Record<string, string> = {};

  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.category) {
    params.category = filters.category;
  }
  if (filters?.volunteer_type) {
    params.volunteer_type = filters.volunteer_type;
  }
  if (filters?.from_date) {
    params.from_date = filters.from_date;
  }
  if (filters?.status) {
    params.status = filters.status;
  }

  return { params };
};

export const getVolunteerOpportunities = async (
  filters?: VolunteerListFilters
): Promise<VolunteerOpportunity[]> => {
  const response = await axiosInstance.get('/volunteering', withFilters(filters));
  return asArray<VolunteerOpportunity>(response.data);
};

export const getVolunteerOpportunityById = async (
  id: number
): Promise<VolunteerOpportunity> => {
  const response = await axiosInstance.get(`/volunteering/${id}`);
  return response.data;
};

export const applyToVolunteerOpportunity = async (id: number) => {
  const response = await axiosInstance.post(`/volunteering/${id}/apply`);
  return response.data as { message: string };
};

export const cancelMyVolunteerApplication = async (id: number) => {
  const response = await axiosInstance.delete(`/volunteering/${id}/application`);
  return response.data as { message: string };
};

export const getMyVolunteering = async (): Promise<VolunteerOpportunity[]> => {
  const response = await axiosInstance.get('/volunteering/my');
  return asArray<VolunteerOpportunity>(response.data);
};

export const getAdminVolunteerOpportunities = async (
  filters?: VolunteerListFilters
): Promise<VolunteerOpportunity[]> => {
  const response = await axiosInstance.get(
    '/volunteering/admin/all',
    withFilters(filters)
  );
  return asArray<VolunteerOpportunity>(response.data);
};

export const getAdminVolunteerStats = async (): Promise<VolunteerStats> => {
  const response = await axiosInstance.get('/volunteering/admin/stats');
  return response.data;
};

export const createVolunteerOpportunity = async (
  data: CreateVolunteerOpportunityData
): Promise<VolunteerOpportunity> => {
  const response = await axiosInstance.post('/volunteering', data);
  return response.data.opportunity ?? response.data;
};

export const updateVolunteerOpportunity = async (
  id: number,
  data: CreateVolunteerOpportunityData
): Promise<VolunteerOpportunity> => {
  const response = await axiosInstance.put(`/volunteering/${id}`, data);
  return response.data.opportunity ?? response.data;
};

export const publishVolunteerOpportunity = async (id: number) => {
  const response = await axiosInstance.patch(`/volunteering/${id}/publish`);
  return response.data;
};

export const unpublishVolunteerOpportunity = async (id: number) => {
  const response = await axiosInstance.patch(`/volunteering/${id}/unpublish`);
  return response.data;
};

export const closeVolunteerOpportunity = async (id: number) => {
  const response = await axiosInstance.patch(`/volunteering/${id}/close`);
  return response.data;
};

export const completeVolunteerOpportunity = async (id: number) => {
  const response = await axiosInstance.patch(`/volunteering/${id}/complete`);
  return response.data;
};

export const cancelVolunteerOpportunity = async (id: number) => {
  const response = await axiosInstance.patch(`/volunteering/${id}/cancel`);
  return response.data;
};

export const deleteVolunteerOpportunity = async (id: number) => {
  await axiosInstance.delete(`/volunteering/${id}`);
};

export const getVolunteerApplications = async (
  id: number
): Promise<VolunteerApplication[]> => {
  const response = await axiosInstance.get(`/volunteering/${id}/applications`);
  return asArray<VolunteerApplication>(response.data);
};

export const approveVolunteerApplication = async (applicationId: number) => {
  const response = await axiosInstance.patch(
    `/volunteering/applications/${applicationId}/approve`
  );
  return response.data;
};

export const rejectVolunteerApplication = async (applicationId: number) => {
  const response = await axiosInstance.patch(
    `/volunteering/applications/${applicationId}/reject`
  );
  return response.data;
};

export const cancelVolunteerApplication = async (applicationId: number) => {
  const response = await axiosInstance.patch(
    `/volunteering/applications/${applicationId}/cancel`
  );
  return response.data;
};

export const completeVolunteerApplication = async (applicationId: number) => {
  const response = await axiosInstance.patch(
    `/volunteering/applications/${applicationId}/complete`
  );
  return response.data;
};

export const getVolunteerAttendance = async (
  id: number
): Promise<VolunteerAttendance[]> => {
  const response = await axiosInstance.get(`/volunteering/${id}/attendance`);
  return asArray<VolunteerAttendance>(response.data);
};

export const updateVolunteerAttendance = async (
  opportunityId: number,
  payload: {
    user_id: number;
    status: VolunteerAttendanceStatus;
    check_in?: string | null;
    check_out?: string | null;
    duration_minutes?: number;
  }
) => {
  const response = await axiosInstance.put(
    `/volunteering/${opportunityId}/attendance`,
    payload
  );
  return response.data;
};

export const issueVolunteerCertificate = async (applicationId: number) => {
  const response = await axiosInstance.post(
    `/volunteering/applications/${applicationId}/certificate`
  );
  return response.data;
};

export const uploadVolunteerBanner = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('banner', file);

  const response = await axiosInstance.post(
    '/volunteering/uploads/banner',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  return response.data.banner_url;
};

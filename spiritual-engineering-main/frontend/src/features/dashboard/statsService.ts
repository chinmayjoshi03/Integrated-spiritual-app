import axiosInstance from '../../services/axiosInstance';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentActivity: { text: string; meta: string; created_at: string }[];
}

export interface MentorStats {
  totalStudents: number;
  activeCourses: number;
  totalCourses: number;
  recentActivity: { name: string; title: string; purchased_at: string }[];
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await axiosInstance.get('/stats/admin');
  return response.data;
};

export const getMentorStats = async (): Promise<MentorStats> => {
  const response = await axiosInstance.get('/stats/mentor');
  return response.data;
};
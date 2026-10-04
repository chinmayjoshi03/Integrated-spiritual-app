import axiosInstance from '../../services/axiosInstance';

export interface Course {
  id: number;
  title: string;
  description: string;
  price: string;
  thumbnail_url: string | null;
  mentor_id: number | null;
  mentor_name: string | null;
  status: 'draft' | 'published';
  created_at: string;
}

export interface Lesson {
  id: number;
  course_id?: number;
  title: string;
  content_type: 'video' | 'pdf';
  content_url?: string;
  position: number;
  duration_seconds: number | null;
}

export interface Mentor {
  id: number;
  name: string;
  email: string;
}

export const getCourses = async (status?: string): Promise<Course[]> => {
  const response = await axiosInstance.get('/courses', { params: status ? { status } : {} });
  return response.data.courses;
};

export const getCourseById = async (id: string): Promise<Course> => {
  const response = await axiosInstance.get(`/courses/${id}`);
  return response.data.course;
};

export const createLesson = async (courseId: string, formData: FormData) => {
  const response = await axiosInstance.post(`/courses/${courseId}/lessons`, formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
};

export const deleteLesson = async (courseId: string, lessonId: number) => {
  const response = await axiosInstance.delete(`/courses/${courseId}/lessons/${lessonId}`);
  return response.data;
};

export const getLessons = async (courseId: string): Promise<{ lessons: Lesson[]; locked: boolean }> => {
  const response = await axiosInstance.get(`/courses/${courseId}/lessons`);
  return { lessons: response.data.lessons, locked: response.data.locked };
};

export const getMentors = async (): Promise<Mentor[]> => {
  const response = await axiosInstance.get('/users/mentors');
  return response.data.mentors;
};

export const createCourse = async (formData: FormData) => {
  const response = await axiosInstance.post('/courses', formData, {
    headers: { 'Content-Type': undefined },
  });
  return response.data;
};

export const updateCourse = async (
  id: number,
  payload: Partial<{ title: string; description: string; price: number; mentorId: number; status: 'draft' | 'published'| 'cancelled' }>
) => {
  const response = await axiosInstance.patch(`/courses/${id}`, payload);
  return response.data;
};

export const enrollInCourse = async (courseId: number) => {
  const response = await axiosInstance.post(`/enrollments/${courseId}/enroll`);
  return response.data;
};

export const getEnrollmentStatus = async (courseId: number): Promise<boolean> => {
  const response = await axiosInstance.get(`/enrollments/${courseId}/enrollment-status`);
  return response.data.enrolled;
};

export const getMyEnrolledCourses = async (): Promise<Course[]> => {
  const response = await axiosInstance.get('/enrollments/my-courses');
  return response.data.courses;
};


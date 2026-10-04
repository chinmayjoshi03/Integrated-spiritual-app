import axiosInstance from '@/services/axiosInstance';
import type { HelpCategory, HelpFaq, HelpFaqListResponse } from '../types/help.types';

export const getHelpCategories = async (): Promise<HelpCategory[]> => {
  const response = await axiosInstance.get('/help/categories');
  return Array.isArray(response.data) ? response.data : [];
};

export const getHelpFaqs = async (params?: {
  search?: string;
  category?: string;
  limit?: number;
}): Promise<HelpFaqListResponse> => {
  const response = await axiosInstance.get('/help/faqs', { params });
  return {
    faqs: Array.isArray(response.data?.faqs) ? response.data.faqs : [],
    total: Number(response.data?.total || 0),
    page: response.data?.page,
  };
};

export const searchHelp = async (query: string): Promise<HelpFaq[]> => {
  const response = await axiosInstance.get('/help/search', { params: { q: query, limit: 5 } });
  return Array.isArray(response.data?.faqs) ? response.data.faqs : [];
};

export const getHelpFaq = async (id: number): Promise<HelpFaq> => {
  const response = await axiosInstance.get(`/help/faqs/${id}`);
  return response.data;
};

export const submitFaqFeedback = async (id: number, helpful: boolean): Promise<void> => {
  await axiosInstance.post(`/help/faqs/${id}/feedback`, { helpful });
};

export const getAdminFaqs = async (params?: {
  search?: string;
  category?: string;
  status?: string;
}): Promise<HelpFaq[]> => {
  const response = await axiosInstance.get('/help/admin/faqs', { params });
  return Array.isArray(response.data) ? response.data : [];
};

export const getAdminFaq = async (id: number): Promise<HelpFaq> => {
  const response = await axiosInstance.get(`/help/admin/faqs/${id}`);
  return response.data;
};

export const createAdminFaq = async (payload: {
  question: string;
  answer: string;
  category_id?: number | null;
  search_keywords?: string;
  display_order?: number;
  status?: 'draft' | 'published';
}): Promise<HelpFaq> => {
  const response = await axiosInstance.post('/help/admin/faqs', payload);
  return response.data.faq;
};

export const updateAdminFaq = async (
  id: number,
  payload: Partial<{
    question: string;
    answer: string;
    category_id: number | null;
    search_keywords: string;
    display_order: number;
    status: 'draft' | 'published';
  }>
): Promise<HelpFaq> => {
  const response = await axiosInstance.patch(`/help/admin/faqs/${id}`, payload);
  return response.data.faq;
};

export const deleteAdminFaq = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/help/admin/faqs/${id}`);
};

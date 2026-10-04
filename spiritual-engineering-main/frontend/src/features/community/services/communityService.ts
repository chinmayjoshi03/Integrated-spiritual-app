import axiosInstance from '@/services/axiosInstance';
import type {
  CommunityGroup,
  CommunityQuestionDetail,
  CommunityQuestionSummary,
  CommunityReply,
  CommunityStatus,
  CreateCommunityData,
  CreateQuestionData,
} from '../types/community.types';

export const getCommunityGroups = async (
  query = ''
): Promise<CommunityGroup[]> => {
  const response = await axiosInstance.get('/community/groups', {
    params: query ? { q: query } : undefined,
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const getCommunityGroupById = async (
  groupId: number
): Promise<CommunityGroup> => {
  const response = await axiosInstance.get(`/community/groups/${groupId}`);
  return response.data;
};

export const createCommunityGroup = async (data: CreateCommunityData) => {
  const response = await axiosInstance.post('/community/groups', data);
  return response.data as { message: string; group: CommunityGroup };
};

export const uploadCommunityBanner = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('banner', file);
  const response = await axiosInstance.post('/community/uploads/banner', formData);
  return response.data.banner_url as string;
};

export const joinCommunityGroup = async (groupId: number) => {
  const response = await axiosInstance.post(`/community/groups/${groupId}/join`);
  return response.data as { message: string };
};

export const leaveCommunityGroup = async (groupId: number) => {
  const response = await axiosInstance.delete(`/community/groups/${groupId}/leave`);
  return response.data as { message: string };
};

export const getGroupQuestions = async (
  groupId: number
): Promise<CommunityQuestionSummary[]> => {
  const response = await axiosInstance.get(`/community/groups/${groupId}/questions`);
  return Array.isArray(response.data) ? response.data : [];
};

export const createGroupQuestion = async (
  groupId: number,
  data: CreateQuestionData
) => {
  const response = await axiosInstance.post(
    `/community/groups/${groupId}/questions`,
    data
  );
  return response.data as { message: string; question: CommunityQuestionSummary };
};

export const getRecentQuestions = async (): Promise<CommunityQuestionSummary[]> => {
  const response = await axiosInstance.get('/community/questions');
  return Array.isArray(response.data) ? response.data : [];
};

export const getQuestionById = async (
  questionId: number
): Promise<CommunityQuestionDetail> => {
  const response = await axiosInstance.get(`/community/questions/${questionId}`);
  return response.data;
};

export const createQuestionReply = async (
  questionId: number,
  content: string,
  parentId?: number
) => {
  const response = await axiosInstance.post(
    `/community/questions/${questionId}/replies`,
    parentId ? { content, parent_id: parentId } : { content }
  );
  return response.data as { message: string; reply: CommunityReply };
};

export const adminGetCommunities = async (query = '', status = '') => {
  const response = await axiosInstance.get('/community/admin/groups', {
    params: {
      ...(query ? { q: query } : {}),
      ...(status ? { status } : {}),
    },
  });
  return Array.isArray(response.data) ? (response.data as CommunityGroup[]) : [];
};

export const adminGetCommunity = async (groupId: number) => {
  const response = await axiosInstance.get(`/community/admin/groups/${groupId}`);
  return response.data as CommunityGroup & { questions: CommunityQuestionSummary[] };
};

export const adminUpdateCommunityStatus = async (
  groupId: number,
  status: CommunityStatus
) => {
  const response = await axiosInstance.patch(`/community/admin/groups/${groupId}`, {
    status,
  });
  return response.data;
};

export const adminGetQuestion = async (questionId: number) => {
  const response = await axiosInstance.get(`/community/admin/questions/${questionId}`);
  return response.data as CommunityQuestionDetail;
};

export const adminRemoveQuestion = async (questionId: number) => {
  const response = await axiosInstance.patch(`/community/admin/questions/${questionId}`);
  return response.data;
};

export const adminRemoveReply = async (replyId: number) => {
  const response = await axiosInstance.patch(`/community/admin/replies/${replyId}`);
  return response.data;
};

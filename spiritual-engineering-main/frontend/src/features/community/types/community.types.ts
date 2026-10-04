export type CommunityAuthor = {
  id: number;
  name: string;
  role: 'user' | 'mentor' | 'admin';
};

export type CommunityStatus = 'active' | 'archived' | 'removed';

export interface CommunityGroup {
  id: number;
  name: string;
  description: string | null;
  category?: string | null;
  banner_url?: string | null;
  status?: CommunityStatus;
  is_active: boolean;
  created_at: string;
  member_count: number;
  question_count?: number;
  is_member: boolean;
}

export interface CommunityQuestionSummary {
  id: number;
  group_id: number;
  group_name?: string;
  title: string;
  content: string;
  created_at: string;
  reply_count: number;
  status?: 'active' | 'removed';
  author: CommunityAuthor;
}

export interface CommunityReply {
  id: number;
  question_id: number;
  parent_id?: number | null;
  content: string;
  created_at: string;
  status?: 'active' | 'removed';
  author: CommunityAuthor;
  replies?: CommunityReply[];
}

export interface CommunityQuestionDetail extends CommunityQuestionSummary {
  group_name: string;
  replies: CommunityReply[];
}

export interface CreateQuestionData {
  title: string;
  content: string;
}

export interface CreateCommunityData {
  name: string;
  description: string;
  category?: string;
  banner_url?: string;
}

export interface HelpCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

export interface HelpFaq {
  id: number;
  question: string;
  answer: string;
  search_keywords?: string | null;
  display_order?: number;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  status?: 'draft' | 'published';
  updated_at?: string;
}

export interface HelpFaqListResponse {
  faqs: HelpFaq[];
  total: number;
  page?: number;
}

export type SupportStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_for_user'
  | 'resolved'
  | 'closed';

export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SupportTicket {
  id: number;
  ticket_number: string;
  user_id: number;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  subject: string;
  description: string;
  status: SupportStatus;
  priority: SupportPriority;
  related_entity_type: string | null;
  related_entity_id: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: number;
  ticket_id: number;
  sender_user_id: number | null;
  sender_role: 'user' | 'mentor' | 'admin';
  sender_name: string | null;
  message: string;
  created_at: string;
}

export interface SupportOverview {
  open_count: number;
  in_progress_count: number;
  waiting_for_user_count: number;
  resolved_count: number;
  closed_count: number;
  high_urgent_count: number;
}

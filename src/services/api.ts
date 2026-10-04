import { Platform } from 'react-native';

// Use your machine's local IP when testing on a physical device via Expo Go.
// Change this IP if your network address changes (run: ipconfig getifaddr en0).
const LOCAL_IP = '10.238.18.190';
export const BASE_URL = Platform.select({
  android: `http://${LOCAL_IP}:5001`,
  ios: `http://${LOCAL_IP}:5001`,
  default: 'http://localhost:5001',
});

/**
 * Build the streaming URL for a lesson video.
 *
 * Dev: serves from backend/videos/<filename> via the local Express endpoint.
 *
 * When you move to Cloudflare Stream / Mux, replace this function body with:
 *   Cloudflare: `https://customer-<id>.cloudflarestream.com/${filename}/manifest/video.m3u8`
 *   Mux:        `https://stream.mux.com/${filename}.m3u8`
 *
 * The rest of the app needs no changes — it just uses the URL this returns.
 */
export function getVideoUrl(filename: string, token: string): string {
  return `${BASE_URL}/api/video/${encodeURIComponent(filename)}?token=${encodeURIComponent(token)}`;
}

/**
 * Build the URL to download or view a course resource / PDF.
 *
 * If filename is already a full URL (http:// or https://), returns it directly.
 * Otherwise, builds the dev endpoint URL pointing to backend/resources/<filename>.
 */
export function getResourceUrl(filename: string, token: string): string {
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `${BASE_URL}/api/resource/${encodeURIComponent(filename)}?token=${encodeURIComponent(token)}`;
}

/**
 * Build the URL to stream a meditation audio file.
 *
 * Dev: serves from backend/audio/<filename> via local Express byte-range endpoint.
 */
export function getAudioUrl(filename: string, token: string): string {
  if (!filename) return '';
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `${BASE_URL}/api/audio/${encodeURIComponent(filename)}?token=${encodeURIComponent(token)}`;
}



type ApiResponse<T> = {
  data?: T;
  error?: string;
};

// Fallback data for offline APK testing / demo mode without active backend
const MOCK_FALLBACKS: Record<string, any> = {
  '/api/auth/me': {
    user: { id: 1, name: 'Demo Seeker', email: 'demo@spiritual.app', created_at: new Date().toISOString() },
  },
  '/api/courses': {
    courses: [
      {
        id: 1,
        title: 'Foundations of Inner Peace',
        description: 'Explore the foundations of stillness, mindful living, and inner joy.',
        thumbnail_url: null,
        level: 'Beginner',
        total_lessons: 6,
        sort_order: 1,
        completed_lessons: 2,
        progress_pct: 33,
      },
      {
        id: 2,
        title: 'Vedic Philosophy & Karma',
        description: 'Deep dive into timeless laws of action, consequence, and spiritual duty.',
        thumbnail_url: null,
        level: 'Intermediate',
        total_lessons: 8,
        sort_order: 2,
        completed_lessons: 1,
        progress_pct: 12,
      },
      {
        id: 3,
        title: 'Chakra Awakening & Vital Energy',
        description: 'Subtle body alignment through breath, sound, and deep meditation.',
        thumbnail_url: null,
        level: 'Advanced',
        total_lessons: 10,
        sort_order: 3,
        completed_lessons: 0,
        progress_pct: 0,
      },
    ],
  },
  '/api/tasks/today': {
    tasks: [
      { id: 1, title: 'Morning Pranayama', description: '10 minutes of box breathing', points: 20, completed: true, category: 'breath' },
      { id: 2, title: 'Mindful Meditation', description: '15 minutes of silent awareness', points: 30, completed: false, category: 'meditation' },
      { id: 3, title: 'Gratitude Journaling', description: 'Note down 3 things you are thankful for', points: 15, completed: false, category: 'reflection' },
      { id: 4, title: 'Daily Sacred Reading', description: '1 chapter of timeless philosophy', points: 25, completed: false, category: 'study' },
    ],
    streak: 5,
    points: 210,
  },
  '/api/meditations': {
    meditations: [
      {
        id: 1,
        title: 'Deep Inner Calm',
        category: 'Calm',
        duration_minutes: 10,
        audio_filename: null,
        description: 'A serene guide to soothing the mind and nervous system.',
        is_free: true,
        completed: true,
        listened_sec: 600,
      },
      {
        id: 2,
        title: 'Morning Vitality & Focus',
        category: 'Energy',
        duration_minutes: 12,
        audio_filename: null,
        description: 'Ignite inner clarity and motivation for your day.',
        is_free: true,
        completed: false,
        listened_sec: 0,
      },
      {
        id: 3,
        title: 'Restful Deep Sleep',
        category: 'Sleep',
        duration_minutes: 20,
        audio_filename: null,
        description: 'Let go of tension and ease into tranquil sleep.',
        is_free: true,
        completed: false,
        listened_sec: 0,
      },
      {
        id: 4,
        title: 'Anxiety Release & Centering',
        category: 'Stress',
        duration_minutes: 15,
        audio_filename: null,
        description: 'Dissolve mental loops and return to your natural center.',
        is_free: true,
        completed: false,
        listened_sec: 0,
      },
    ],
    summary: { completed_count: 8, total_minutes: 125 },
  },
  '/api/community/posts': {
    posts: [
      {
        id: 1,
        user_id: 2,
        author_name: 'Ananya Sharma',
        title: 'How morning silence transformed my workday',
        content: 'I began sitting in stillness for 10 minutes before checking my phone. It completely removed the morning rush sensation.',
        category: 'Daily Practice',
        likes_count: 28,
        liked_by_user: true,
        comments_count: 6,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        user_id: 3,
        author_name: 'Rohan Verma',
        title: 'Reflections on Karma Yoga',
        content: '“You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.” A timeless guide to inner freedom.',
        category: 'Philosophy',
        likes_count: 45,
        liked_by_user: false,
        comments_count: 11,
        created_at: new Date().toISOString(),
      },
    ],
  },
  '/api/events': {
    events: [
      {
        id: 1,
        title: 'Global Weekend Guided Meditation',
        description: 'Join community members across the world for a synchronous 30-minute meditation and blessing.',
        event_date: 'This Sunday',
        time_str: '7:00 AM - 7:45 AM IST',
        location: 'Online Live Stream',
        is_online: true,
        attendees_count: 142,
        registered_by_user: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Pranayama & Breathwork Masterclass',
        description: 'Hands-on techniques for energizing the nadis and clearing emotional blocks.',
        event_date: 'Next Saturday',
        time_str: '6:30 PM - 8:00 PM IST',
        location: 'Online Workshop',
        is_online: true,
        attendees_count: 89,
        registered_by_user: false,
        created_at: new Date().toISOString(),
      },
    ],
  },
  '/api/volunteer/opportunities': {
    opportunities: [
      {
        id: 1,
        title: 'Community Food & Sustenance Seva',
        description: 'Help distribute warm, nutritious meals to families in need every weekend.',
        category: 'Annadaan',
        location: 'Local Community Kitchen',
        required_volunteers: 15,
        current_volunteers: 11,
        applied_by_user: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Youth Mentorship & Mindfulness Guide',
        description: 'Introduce high school students to mindfulness practices and emotional resilience tools.',
        category: 'Vidya Daan',
        location: 'Hybrid / Virtual',
        required_volunteers: 8,
        current_volunteers: 5,
        applied_by_user: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  '/api/shop/items': {
    items: [
      {
        id: 1,
        title: 'Handcrafted Sandalwood Mala (108 beads)',
        description: 'Authentic Mysore sandalwood beads with a natural soothing fragrance, ideal for japa and mindful counting.',
        price: '899',
        currency: 'INR',
        category: 'Meditation Tools',
        stock_quantity: 25,
        is_featured: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Brass Akhand Diya & Stand',
        description: 'Traditional heavy brass lamp for sacred altar lighting and evening contemplation.',
        price: '649',
        currency: 'INR',
        category: 'Puja & Rituals',
        stock_quantity: 40,
        is_featured: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        title: 'Organic Herbal Dhoop Cones (Pack of 40)',
        description: 'Hand-rolled charcoal-free incense formulated with cow ghee, camphor, and holy basil.',
        price: '299',
        currency: 'INR',
        category: 'Aromatics',
        stock_quantity: 80,
        is_featured: false,
        created_at: new Date().toISOString(),
      },
    ],
  },
};

function getMockFallback<T>(endpoint: string): T | null {
  const cleanEndpoint = endpoint.split('?')[0];
  if (MOCK_FALLBACKS[cleanEndpoint]) {
    return MOCK_FALLBACKS[cleanEndpoint] as T;
  }
  // Course detail fallback
  if (cleanEndpoint.startsWith('/api/courses/')) {
    const course = MOCK_FALLBACKS['/api/courses'].courses[0];
    return {
      course,
      lessons: [
        { id: 101, title: 'Introduction to Stillness', duration_sec: 420, sort_order: 1, is_free: true, completed: true, watched_sec: 420 },
        { id: 102, title: 'Breath as an Anchor', duration_sec: 600, sort_order: 2, is_free: true, completed: true, watched_sec: 600 },
        { id: 103, title: 'Observing the Thinking Mind', duration_sec: 780, sort_order: 3, is_free: false, completed: false, watched_sec: 0 },
      ],
      resources: [],
      assignments: [],
      quizzes: [],
    } as unknown as T;
  }
  // Meditation detail fallback
  if (cleanEndpoint.startsWith('/api/meditations/')) {
    return { meditation: MOCK_FALLBACKS['/api/meditations'].meditations[0] } as unknown as T;
  }
  // Toggle task fallback
  if (cleanEndpoint.startsWith('/api/tasks/') && cleanEndpoint.endsWith('/toggle')) {
    return { task: { id: 1, title: 'Daily Practice', completed: true } } as unknown as T;
  }
  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Something went wrong.' };
    }

    return { data };
  } catch (error) {
    // If backend is unreachable or timeout, gracefully return offline demo mock data
    const fallback = getMockFallback<T>(endpoint);
    if (fallback !== null) {
      return { data: fallback };
    }
    return { error: 'Network error. Please check your connection.' };
  }
}

// ---- Auth API ----

export type User = {
  id: number;
  name: string | null;
  email: string;
  created_at: string;
};

type AuthResponse = {
  message: string;
  token: string;
  user: User;
};

type ProfileResponse = {
  user: User;
};

export async function apiLogin(email: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiSignup(name: string, email: string, password: string) {
  return request<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function apiGetProfile(token: string) {
  return request<ProfileResponse>('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ── LMS Types ─────────────────────────────────────────────────────────────────

export type Course = {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  level: string;
  total_lessons: number;
  sort_order: number;
  completed_lessons: number;
  progress_pct: number;
};

export type Lesson = {
  id: number;
  title: string;
  description: string | null;
  video_filename: string | null;
  duration_sec: number;
  sort_order: number;
  is_free: boolean;
  completed: boolean;
  watched_sec: number;
};

export type Resource = {
  id: number;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string;
  sort_order: number;
};

export type Assignment = {
  id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  due_offset_days: number;
  sort_order: number;
  submitted_at: string | null;
  response_text: string | null;
};

export type QuizSummary = {
  id: number;
  title: string;
  description: string | null;
  sort_order: number;
  best_score: number | null;
  total_questions: number | null;
  attempt_count: number;
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  sort_order: number;
};

export type QuizAttempt = {
  id: number;
  score: number;
  total: number;
  answers: number[];
  attempted_at: string;
};

export type QuizFeedbackItem = {
  question_id: number;
  question: string;
  options: string[];
  selected_idx: number | null;
  correct_idx: number;
  is_correct: boolean;
  explanation: string | null;
};

export type CourseDetail = {
  course: Course;
  lessons: Lesson[];
  resources: Resource[];
  assignments: Assignment[];
  quizzes: QuizSummary[];
};

export type QuizDetail = {
  quiz: { id: number; title: string; description: string | null };
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
};

export type QuizResult = {
  score: number;
  total: number;
  pct: number;
  feedback: QuizFeedbackItem[];
};

// ── LMS API ───────────────────────────────────────────────────────────────────

function authHeader(token: string): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function apiGetCourses(token: string) {
  return request<{ courses: Course[] }>('/api/courses', authHeader(token));
}

export async function apiGetCourseDetail(token: string, courseId: number) {
  return request<CourseDetail>(`/api/courses/${courseId}`, authHeader(token));
}

export async function apiMarkLessonProgress(
  token: string,
  courseId: number,
  lessonId: number,
  payload: { watched_sec: number; completed: boolean }
) {
  return request<{ success: boolean }>(
    `/api/courses/${courseId}/lessons/${lessonId}/progress`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      ...authHeader(token),
    }
  );
}

export async function apiSubmitAssignment(
  token: string,
  courseId: number,
  assignmentId: number,
  response_text: string
) {
  return request<{ success: boolean; submitted_at: string }>(
    `/api/courses/${courseId}/assignments/${assignmentId}/submit`,
    {
      method: 'POST',
      body: JSON.stringify({ response_text }),
      ...authHeader(token),
    }
  );
}

export async function apiGetQuiz(token: string, courseId: number, quizId: number) {
  return request<QuizDetail>(
    `/api/courses/${courseId}/quizzes/${quizId}`,
    authHeader(token)
  );
}

export async function apiSubmitQuiz(
  token: string,
  courseId: number,
  quizId: number,
  answers: number[]
) {
  return request<QuizResult>(
    `/api/courses/${courseId}/quizzes/${quizId}/submit`,
    {
      method: 'POST',
      body: JSON.stringify({ answers }),
      ...authHeader(token),
    }
  );
}

// ── Daily Tasks API ───────────────────────────────────────────────────────────

export type DailyTask = {
  id: number;
  task_name: string;
  completed: boolean;
};

export async function apiGetTodayTasks(token: string) {
  return request<{ tasks: DailyTask[] }>('/api/tasks/today', authHeader(token));
}

export async function apiToggleTask(token: string, taskId: number) {
  return request<{ task: DailyTask }>(`/api/tasks/${taskId}/toggle`, {
    method: 'POST',
    ...authHeader(token),
  });
}

// ── Meditations API ───────────────────────────────────────────────────────────

export type Meditation = {
  id: number;
  title: string;
  description: string;
  category: 'Guided' | 'Sound' | 'Breathwork' | 'Ambient';
  audio_filename: string;
  duration_sec: number;
  guide_name: string;
  thumbnail_url?: string;
  is_featured: boolean;
  sort_order: number;
  completed: boolean;
  listened_sec: number;
  completed_at?: string;
};

export type MeditationSummary = {
  completed_count: number;
  total_minutes: number;
};

export async function apiGetMeditations(token: string, category?: string) {
  const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
  return request<{ meditations: Meditation[]; summary: MeditationSummary }>(
    `/api/meditations${query}`,
    authHeader(token)
  );
}

export async function apiGetMeditationDetail(token: string, id: number) {
  return request<{ meditation: Meditation }>(`/api/meditations/${id}`, authHeader(token));
}

export async function apiSaveMeditationProgress(
  token: string,
  id: number,
  listenedSec: number,
  completed: boolean = false
) {
  return request<{ message: string; progress: any }>(`/api/meditations/${id}/progress`, {
    method: 'POST',
    body: JSON.stringify({ listened_sec: listenedSec, completed }),
    ...authHeader(token),
  });
}

// ── Community API ────────────────────────────────────────────────────────────

export type PostComment = {
  id: number;
  post_id: number;
  user_id: number;
  author_name: string;
  content: string;
  created_at: string;
};

export type CommunityPost = {
  id: number;
  user_id: number;
  author_name: string;
  title: string;
  content: string;
  category: string;
  likes_count: number;
  liked_by_user: boolean;
  comments_count: number;
  created_at: string;
};

export async function apiGetPosts(token: string, category?: string) {
  const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
  return request<{ posts: CommunityPost[] }>(`/api/community/posts${query}`, authHeader(token));
}

export async function apiCreatePost(token: string, title: string, content: string, category: string = 'General') {
  return request<{ post: CommunityPost }>('/api/community/posts', {
    method: 'POST',
    body: JSON.stringify({ title, content, category }),
    ...authHeader(token),
  });
}

export async function apiDeletePost(token: string, postId: number) {
  return request<{ message: string; deleted_id: number }>(`/api/community/posts/${postId}`, {
    method: 'DELETE',
    ...authHeader(token),
  });
}

export async function apiGetPostDetail(token: string, postId: number) {
  return request<{ post: CommunityPost; comments: PostComment[] }>(`/api/community/posts/${postId}`, authHeader(token));
}

export async function apiToggleLikePost(token: string, postId: number) {
  return request<{ liked: boolean; likes_count: number }>(`/api/community/posts/${postId}/like`, {
    method: 'POST',
    ...authHeader(token),
  });
}

export async function apiAddComment(token: string, postId: number, content: string) {
  return request<{ comment: PostComment }>(`/api/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
    ...authHeader(token),
  });
}

// ── Events API ───────────────────────────────────────────────────────────────

export type EventItem = {
  id: number;
  title: string;
  description: string;
  event_date: string;
  time_str: string;
  location: string;
  is_online: boolean;
  meeting_link?: string;
  banner_url?: string;
  attendees_count: number;
  registered_by_user: boolean;
  created_at: string;
};

export async function apiGetEvents(token: string) {
  return request<{ events: EventItem[] }>('/api/events', authHeader(token));
}

export async function apiGetEventDetail(token: string, eventId: number) {
  return request<{ event: EventItem }>(`/api/events/${eventId}`, authHeader(token));
}

export async function apiToggleRegisterEvent(token: string, eventId: number) {
  return request<{ registered: boolean; attendees_count: number }>(`/api/events/${eventId}/register`, {
    method: 'POST',
    ...authHeader(token),
  });
}

// ── Volunteering (Seva) API ──────────────────────────────────────────────────

export type VolunteerOpportunity = {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  required_volunteers: number;
  current_volunteers: number;
  applied_by_user: boolean;
  application_status?: string;
  created_at: string;
};

export async function apiGetVolunteerOpportunities(token: string) {
  return request<{ opportunities: VolunteerOpportunity[] }>('/api/volunteer/opportunities', authHeader(token));
}

export async function apiApplyVolunteer(token: string, opportunityId: number, notes: string = '') {
  return request<{ message: string; application: any }>('/api/volunteer/apply', {
    method: 'POST',
    body: JSON.stringify({ opportunity_id: opportunityId, notes }),
    ...authHeader(token),
  });
}

// ── Divine Shop API ──────────────────────────────────────────────────────────

export type ShopItem = {
  id: number;
  title: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  image_url?: string;
  stock_quantity: number;
  is_featured: boolean;
  created_at: string;
};

export type ShopOrder = {
  id: number;
  item_id: number;
  item_title: string;
  item_category: string;
  image_url?: string;
  quantity: number;
  total_price: string;
  shipping_address: string;
  status: string;
  created_at: string;
};

export async function apiGetShopItems(token: string, category?: string) {
  const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
  return request<{ items: ShopItem[] }>(`/api/shop/items${query}`, authHeader(token));
}

export async function apiGetShopItemDetail(token: string, itemId: number) {
  return request<{ item: ShopItem }>(`/api/shop/items/${itemId}`, authHeader(token));
}

export async function apiPurchaseShopItem(
  token: string,
  item_id: number,
  quantity: number,
  shipping_address: string
) {
  return request<{ message: string; order: ShopOrder }>('/api/shop/purchase', {
    method: 'POST',
    body: JSON.stringify({ item_id, quantity, shipping_address }),
    ...authHeader(token),
  });
}

export async function apiGetShopOrders(token: string) {
  return request<{ orders: ShopOrder[] }>('/api/shop/orders', authHeader(token));
}

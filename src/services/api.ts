import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ─── Backend endpoint ──────────────────────────────────────────────────────────
// The app shares the same backend as the website (port 5001). Resolution order:
//   1. EXPO_PUBLIC_API_URL  — set this for APK builds (eas.json env or .env)
//   2. Expo Go / dev build  — the laptop serving the JS bundle (follows Wi-Fi IP changes)
//   3. DEPLOYED_API_URL     — the live backend
const API_PORT = 5001;
const DEPLOYED_API_URL = 'https://spiritual.techeinnovation.com';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (Platform.OS === 'web') return `http://localhost:${API_PORT}`;

  // hostUri looks like "10.238.18.190:8081" when the bundle comes from Metro.
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (__DEV__ && devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return `http://${devHost}:${API_PORT}`;
  }
  return DEPLOYED_API_URL;
}

export const BASE_URL = resolveBaseUrl();

/**
 * Resolve a media URL returned by the backend (lesson / meditation content).
 *
 * The backend already returns signed, ready-to-play URLs such as
 *   http://<BACKEND_URL>/api/courses/:id/lessons/:id/content?token=…
 * Two cases still need fixing up on a phone:
 *   • a relative path ("/api/…") when BACKEND_URL is not set on the server
 *   • a "localhost" origin, which a physical device cannot reach
 * In both cases we point the URL at this app's BASE_URL instead.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  const match = url.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)$/i);
  if (match) return `${BASE_URL}${match[3]}`;
  return url;
}

/** @deprecated kept for older screens — use resolveMediaUrl. */
export function getAudioUrl(url: string, _token?: string): string {
  return resolveMediaUrl(url);
}

type ApiResponse<T> = {
  data?: T;
  error?: string;
  /** HTTP status code (0 when the request never reached the server). */
  status?: number;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { error: data?.error || 'Something went wrong.', status: response.status };
    }

    return { data, status: response.status };
  } catch (error: any) {
    console.error('API request error for', endpoint, error?.message || error);
    if (error?.name === 'AbortError') {
      return { error: 'Request timed out. Please check your network and try again.', status: 0 };
    }
    return { error: 'Network error. Could not connect to the backend server.', status: 0 };
  }
}

// ---- Auth API ----

export type User = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  userCategory?: 'normal' | 'dikshan';
  user_category?: 'normal' | 'dikshan';
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  profileComplete?: boolean;
  profile_picture_url?: string | null;
  created_at?: string;
};

type AuthResponse = {
  message: string;
  token?: string;
  user?: User;
  /** Set for administrator accounts — those sign in on the website only. */
  requiresOtp?: boolean;
};

// Registration only returns email + message (OTP flow — no token yet)
type RegisterResponse = {
  message: string;
  email: string;
};

type OtpVerifyResponse = {
  message: string;
  /** Not returned by the current backend — the email is verified, then the user signs in. */
  token?: string;
  user?: User;
};

export async function apiLogin(email: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Register a new account. The backend sends an OTP to the email —
 * the user must verify it before they can log in.
 * Returns { message, email } — no token yet.
 */
export async function apiSignup(payload: {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  dateOfBirth: string;
}) {
  return request<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Sends a password-reset link to the email (the link opens the website reset page). */
export async function apiForgotPassword(email: string) {
  return request<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Verify the OTP sent to the user's email after registration.
 * Returns a token + user on success — same shape as login.
 */
export async function apiVerifyOtp(email: string, code: string) {
  return request<OtpVerifyResponse>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

/**
 * Resend OTP to the email address.
 */
export async function apiResendOtp(email: string) {
  return request<{ message: string }>('/api/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// ── LMS Types ─────────────────────────────────────────────────────────────────

export type Course = {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: string;
  price: number | string;   // backend sends as string e.g. "999.00"
  delivery_mode: string;
  mentor_name: string | null;
  created_at: string;
  // Progress fields — only present when fetched from enrollment-aware endpoints
  level?: string;
  total_lessons?: number;
  sort_order?: number;
  completed_lessons?: number;
  progress_pct?: number;
  // Enrollment status — merged from /api/enrollments
  enrolled?: boolean;
};

export type Lesson = {
  id: number;
  title: string;
  description: string | null;
  content_type: string | null;      // 'video' | 'pdf' | 'audio'
  /** Signed, ready-to-play URL returned by the backend (null when locked). */
  content_url: string | null;
  position: number;
  duration_seconds: number | null;
  duration_sec: number;
  sort_order: number;
  /** Free preview lesson — playable before enrolling (website: is_free_preview). */
  is_free: boolean;
  completed: boolean;
  watched_sec: number;
  /** Live courses: per-lesson Meet link and session time. */
  meet_link?: string | null;
  scheduled_at?: string | null;
};

export type CourseDetail = {
  course: Course;
  lessons: Lesson[];
  /** True when the user has no full access (only free-preview lessons are playable). */
  locked: boolean;
};

// ── LMS API ───────────────────────────────────────────────────────────────────

function authHeader(token: string): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ── Course enrollment ─────────────────────────────────────────────────────────

export async function apiEnrollCourse(token: string, courseId: number) {
  return request<{ enrollment: any; message?: string }>(
    `/api/enrollments/${courseId}/enroll`,
    { method: 'POST', ...authHeader(token) }
  );
}

export async function apiGetCourses(token: string) {
  // Fetch all courses + enrolled courses in parallel, then merge enrollment status
  const [allRes, enrolledRes] = await Promise.allSettled([
    request<{ courses: Course[] }>('/api/courses', authHeader(token)),
    request<{ courses: Course[] }>('/api/enrollments/my-courses', authHeader(token)),
  ]);

  if (allRes.status === 'rejected' || allRes.value.error) {
    return { error: (allRes.status === 'fulfilled' ? allRes.value.error : undefined) ?? 'Could not load courses.' };
  }

  const all: Course[] = allRes.value.data?.courses ?? [];
  const enrolledIds = new Set<number>(
    enrolledRes.status === 'fulfilled'
      ? (enrolledRes.value.data?.courses ?? []).map((c) => c.id)
      : []
  );

  const courses: Course[] = all.map((c) => ({
    ...c,
    enrolled: enrolledIds.has(c.id),
    // price comes as string from backend, normalise to number
    price: c.price as any,
  }));

  return { data: { courses } };
}

export async function apiGetCourseDetail(token: string, courseId: number) {
  const [courseRes, lessonsRes, progressRes] = await Promise.all([
    request<{ course: Course }>(`/api/courses/${courseId}`, authHeader(token)),
    request<{ lessons: any[]; locked: boolean }>(`/api/courses/${courseId}/lessons`, authHeader(token)),
    request<{ progress: { lesson_id: number; progress_seconds: number; completed: boolean }[] }>(
      `/api/courses/${courseId}/lessons/progress`,
      authHeader(token)
    ),
  ]);

  if (courseRes.error || !courseRes.data) {
    return { error: courseRes.error ?? 'Course not found.' };
  }

  const progressById = new Map(
    (progressRes.data?.progress ?? []).map((p) => [Number(p.lesson_id), p])
  );

  const rawLessons: any[] = lessonsRes.data?.lessons ?? [];
  const lessons: Lesson[] = rawLessons.map((l) => {
    const progress = progressById.get(Number(l.id));
    return {
      id: l.id,
      title: l.title,
      description: l.description ?? null,
      content_type: l.content_type ?? null,
      content_url: l.content_url ?? null,
      position: l.position ?? 0,
      duration_seconds: l.duration_seconds ?? null,
      duration_sec: l.duration_seconds ?? 0,
      sort_order: l.position ?? 0,
      is_free: Boolean(l.is_free_preview ?? l.is_free),
      completed: progress?.completed ?? false,
      watched_sec: progress?.progress_seconds ?? 0,
      meet_link: l.meet_link ?? null,
      scheduled_at: l.scheduled_at ?? null,
    };
  });

  return { data: { course: courseRes.data.course, lessons, locked: Boolean(lessonsRes.data?.locked) } as CourseDetail };
}

export async function apiGetMyEnrolledCourses(token: string) {
  const res = await request<{ courses: Course[] }>('/api/enrollments/my-courses', authHeader(token));
  if (res.error) return { error: res.error };
  return { data: res.data?.courses ?? [] };
}

export async function apiGetEnrollmentStatus(token: string, courseId: number) {
  return request<{ enrolled: boolean }>(`/api/enrollments/${courseId}/enrollment-status`, authHeader(token));
}

/** Save lesson progress — same contract as the website (PUT, camelCase body). */
export async function apiMarkLessonProgress(
  token: string,
  courseId: number,
  lessonId: number,
  payload: { watched_sec: number; completed: boolean }
) {
  return request<{ progress: any }>(
    `/api/courses/${courseId}/lessons/${lessonId}/progress`,
    {
      method: 'PUT',
      body: JSON.stringify({
        progressSeconds: Math.max(0, Math.floor(payload.watched_sec)),
        completed: payload.completed,
      }),
      ...authHeader(token),
    }
  );
}

export async function apiGetCourseBookmarkStatus(token: string, courseId: number) {
  return request<{ bookmarked: boolean }>(`/api/bookmarks/course/${courseId}`, authHeader(token));
}

export async function apiGetProductBookmarkStatus(token: string, productId: number) {
  return request<{ bookmarked: boolean }>(`/api/bookmarks/product/${productId}`, authHeader(token));
}

// ── Meditations API ───────────────────────────────────────────────────────────
// Backend columns: id, title, description, category_id, media_type, media_url,
// thumbnail_url, duration_seconds, created_by, created_at, course_id,
// delivery_mode + joined: category_name, course_title, locked, media_url (nulled if locked)
// Progress fields (from meditation_progress join): progress_seconds, completed

export type Meditation = {
  id: number;
  title: string;
  description: string;
  category: string;
  media_url: string | null;
  audio_filename: string;
  media_type: 'audio' | 'video';
  duration_sec: number;
  guide_name: string;
  thumbnail_url?: string | null;
  is_featured: boolean;
  sort_order: number;
  completed: boolean;
  listened_sec: number;
  completed_at?: string;
  locked?: boolean;
  course_id?: number | null;
  course_title?: string | null;
  course_price?: string | null;   // price of the course this meditation belongs to
};

function normaliseMeditation(m: any, progress?: any): Meditation {
  return {
    id: m.id,
    title: m.title ?? '',
    description: m.description ?? '',
    category: m.category_name ?? m.category ?? 'General',
    media_url: m.media_url ?? null,
    audio_filename: m.media_url ?? '',
    media_type: m.media_type === 'video' ? 'video' : 'audio',
    duration_sec: m.duration_seconds ?? m.duration_sec ?? 0,
    guide_name: m.creator_name ?? m.guide_name ?? 'The Karm Vajra',
    thumbnail_url: m.thumbnail_url ?? null,
    is_featured: m.is_featured ?? false,
    sort_order: m.sort_order ?? 0,
    completed: progress?.completed ?? m.completed ?? false,
    listened_sec: progress?.progress_seconds ?? m.listened_sec ?? 0,
    locked: m.locked ?? false,
    course_id: m.course_id ?? null,
    course_title: m.course_title ?? null,
    course_price: m.course_price ?? null,
  };
}

export type MeditationSummary = {
  completed_count: number;
  total_minutes: number;
};

export async function apiGetMeditations(token: string, category?: string) {
  const query = category && category !== 'All' ? `?categoryId=${encodeURIComponent(category)}` : '';
  const res = await request<any>(`/api/meditation${query}`, authHeader(token));
  if (res.error) return { error: res.error };
  const raw: any[] = Array.isArray(res.data) ? res.data : (res.data?.meditations ?? []);
  return { data: { meditations: raw.map((m) => normaliseMeditation(m)) } };
}

export async function apiGetMeditationDetail(token: string, id: number) {
  const res = await request<any>(`/api/meditation/${id}`, authHeader(token));
  if (res.error) return { error: res.error };
  const raw = res.data?.meditation ?? res.data;
  return { data: { meditation: normaliseMeditation(raw) } };
}

export async function apiSaveMeditationProgress(
  token: string,
  id: number,
  listenedSec: number,
  completed: boolean = false
) {
  return request<{ message: string; progress: any }>(`/api/meditation/${id}/progress`, {
    method: 'POST',
    body: JSON.stringify({ progress_seconds: listenedSec, completed }),
    ...authHeader(token),
  });
}

// ── Community API ────────────────────────────────────────────────────────────
// Same model as the website: communities (groups) → discussions (questions) →
// answers (replies) → comments (nested replies with parent_id).
// Users must join a community before they can ask in it.

export type CommunityAuthor = {
  id: number;
  name: string;
  role: 'user' | 'mentor' | 'admin';
};

export type CommunityGroup = {
  id: number;
  name: string;
  description: string | null;
  category?: string | null;
  banner_url?: string | null;
  status?: 'active' | 'archived' | 'removed';
  is_active?: boolean;
  created_at: string;
  member_count: number;
  question_count?: number;
  is_member: boolean;
};

export type CommunityQuestion = {
  id: number;
  group_id: number;
  group_name?: string;
  title: string;
  content: string;
  created_at: string;
  reply_count: number;
  author: CommunityAuthor;
};

export type CommunityReply = {
  id: number;
  question_id: number;
  parent_id?: number | null;
  content: string;
  created_at: string;
  author: CommunityAuthor;
  replies?: CommunityReply[];
};

export type CommunityQuestionDetail = CommunityQuestion & {
  group_name: string;
  replies: CommunityReply[];
};

const asArray = <T>(data: unknown): T[] => (Array.isArray(data) ? (data as T[]) : []);

export async function apiGetCommunityGroups(token: string, query = '') {
  const q = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
  const res = await request<CommunityGroup[]>(`/api/community/groups${q}`, authHeader(token));
  if (res.error) return { error: res.error };
  return { data: asArray<CommunityGroup>(res.data) };
}

export async function apiGetCommunityGroup(token: string, groupId: number) {
  return request<CommunityGroup>(`/api/community/groups/${groupId}`, authHeader(token));
}

export async function apiJoinCommunityGroup(token: string, groupId: number) {
  return request<{ message: string }>(`/api/community/groups/${groupId}/join`, {
    method: 'POST',
    ...authHeader(token),
  });
}

export async function apiLeaveCommunityGroup(token: string, groupId: number) {
  return request<{ message: string }>(`/api/community/groups/${groupId}/leave`, {
    method: 'DELETE',
    ...authHeader(token),
  });
}

export async function apiGetGroupQuestions(token: string, groupId: number) {
  const res = await request<CommunityQuestion[]>(`/api/community/groups/${groupId}/questions`, authHeader(token));
  if (res.error) return { error: res.error };
  return { data: asArray<CommunityQuestion>(res.data) };
}

export async function apiAskGroupQuestion(token: string, groupId: number, title: string, content: string) {
  return request<{ message: string; question: CommunityQuestion }>(
    `/api/community/groups/${groupId}/questions`,
    { method: 'POST', body: JSON.stringify({ title, content }), ...authHeader(token) }
  );
}

export async function apiGetRecentQuestions(token: string) {
  const res = await request<CommunityQuestion[]>('/api/community/questions', authHeader(token));
  if (res.error) return { error: res.error };
  return { data: asArray<CommunityQuestion>(res.data) };
}

export async function apiGetQuestion(token: string, questionId: number) {
  return request<CommunityQuestionDetail>(`/api/community/questions/${questionId}`, authHeader(token));
}

export async function apiReplyToQuestion(token: string, questionId: number, content: string, parentId?: number) {
  return request<{ message: string; reply: CommunityReply }>(
    `/api/community/questions/${questionId}/replies`,
    {
      method: 'POST',
      body: JSON.stringify(parentId ? { content, parent_id: parentId } : { content }),
      ...authHeader(token),
    }
  );
}

// ── Events API ───────────────────────────────────────────────────────────────
// Field names match the backend / website exactly.

export type EventItem = {
  id: number;
  title: string;
  description: string | null;
  banner_url: string | null;
  event_type: 'online' | 'offline';
  event_date: string;
  start_time: string;
  duration_minutes: number;
  location: string | null;
  meeting_url: string | null;
  capacity: number | null;
  fee: number;
  status: 'draft' | 'published' | 'cancelled';
  created_by_name?: string;
  registered_count?: number;
  is_registered?: boolean;
  registered_at?: string;
  attendance_status?: 'present' | 'absent' | null;
  certificate_status?: 'available' | 'pending' | 'not_available' | null;
  certificate_number?: string | null;
};

export type EventCertificate = {
  certificate_number: string;
  issued_at: string;
  participant_name: string;
  event_title: string;
  event_date: string;
};

export async function apiGetEvents(token: string) {
  const res = await request<EventItem[]>('/api/events', authHeader(token));
  if (res.error) return { error: res.error };
  return { data: asArray<EventItem>(res.data) };
}

export async function apiGetMyEvents(token: string) {
  const res = await request<EventItem[]>('/api/events/my-events', authHeader(token));
  if (res.error) return { error: res.error };
  return { data: asArray<EventItem>(res.data) };
}

export async function apiGetEventDetail(token: string, eventId: number) {
  return request<EventItem>(`/api/events/${eventId}`, authHeader(token));
}

export async function apiRegisterForEvent(token: string, eventId: number) {
  return request<{ message: string }>(`/api/events/${eventId}/register`, {
    method: 'POST',
    ...authHeader(token),
  });
}

export async function apiJoinEventSession(token: string, eventId: number) {
  return request<{ message: string; meeting_url: string }>(`/api/events/${eventId}/session/join`, {
    method: 'POST',
    ...authHeader(token),
  });
}

export async function apiHeartbeatEventSession(token: string, eventId: number) {
  return request<unknown>(`/api/events/${eventId}/session/heartbeat`, { method: 'POST', ...authHeader(token) });
}

export async function apiLeaveEventSession(token: string, eventId: number) {
  return request<unknown>(`/api/events/${eventId}/session/leave`, { method: 'POST', ...authHeader(token) });
}

export async function apiGetMyEventCertificate(token: string, eventId: number) {
  return request<EventCertificate>(`/api/events/${eventId}/certificates/me`, authHeader(token));
}

// ── Volunteering API ─────────────────────────────────────────────────────────

export type VolunteerApplicationStatus = 'applied' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export type VolunteerOpportunity = {
  id: number;
  title: string;
  description: string;
  category: string | null;
  banner_url: string | null;
  volunteer_type: 'online' | 'offline';
  event_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_url: string | null;
  capacity: number | null;
  requirements: string | null;
  status: 'draft' | 'published' | 'closed' | 'completed' | 'cancelled';
  occupied: number;
  remaining: number | null;
  is_full: boolean;
  my_application?: { id: number; status: VolunteerApplicationStatus; applied_at: string } | null;
  my_attendance?: { status: 'present' | 'absent' | 'partial'; duration_minutes: number } | null;
  certificate_status?: 'available' | 'pending' | 'not_available';
  certificate_number?: string | null;
  // Present on /volunteering/my rows
  application_id?: number;
  application_status?: VolunteerApplicationStatus;
  applied_at?: string;
  attendance_status?: 'present' | 'absent' | 'partial' | null;
  duration_minutes?: number | null;
};

export type VolunteerCertificate = {
  certificate_number: string;
  issued_at: string;
  opportunity_title: string;
  opportunity_date: string;
  participant_name: string;
};

export async function apiGetVolunteerOpportunities(
  token: string,
  filters?: { search?: string; category?: string; volunteer_type?: 'online' | 'offline' | '' }
) {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.volunteer_type) params.set('volunteer_type', filters.volunteer_type);
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await request<VolunteerOpportunity[]>(`/api/volunteering${query}`, authHeader(token));
  if (res.error) return { error: res.error };
  return { data: asArray<VolunteerOpportunity>(res.data) };
}

export async function apiGetVolunteerOpportunity(token: string, id: number) {
  return request<VolunteerOpportunity>(`/api/volunteering/${id}`, authHeader(token));
}

export async function apiApplyVolunteer(token: string, opportunityId: number) {
  return request<{ message: string }>(`/api/volunteering/${opportunityId}/apply`, {
    method: 'POST',
    ...authHeader(token),
  });
}

export async function apiCancelVolunteerApplication(token: string, opportunityId: number) {
  return request<{ message: string }>(`/api/volunteering/${opportunityId}/application`, {
    method: 'DELETE',
    ...authHeader(token),
  });
}

export async function apiGetMyVolunteering(token: string) {
  const res = await request<VolunteerOpportunity[]>('/api/volunteering/my', authHeader(token));
  if (res.error) return { error: res.error };
  return { data: asArray<VolunteerOpportunity>(res.data) };
}

export async function apiGetMyVolunteerCertificate(token: string, applicationId: number) {
  return request<VolunteerCertificate>(
    `/api/volunteering/applications/${applicationId}/certificate/me`,
    authHeader(token)
  );
}

// ── Divine Shop API ──────────────────────────────────────────────────────────
// Backend mounts: /api/products, /api/cart, /api/orders

export type ShopItem = {
  id: number;
  title: string;      // mapped from product.name
  name?: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  image_url?: string;
  /** All product photos (website gallery); first entry is the cover. */
  images: string[];
  stock_quantity: number; // mapped from product.stock
  stock?: number;
  is_featured: boolean;
  created_at: string;
};

export type ShopOrderItem = {
  product_id: number | null;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  price_at_purchase: number;
};

export type ShopOrder = {
  id: number;
  // Legacy flat fields (old checkout endpoint) — kept for backwards compat
  item_id: number;
  item_title: string;
  item_category: string;
  image_url?: string;
  quantity: number;
  total_price: string;
  shipping_address: string;
  status: string;
  created_at: string;
  // New rich fields (Razorpay payment flow)
  order_items?: ShopOrderItem[];
  total_amount?: number;
};

function normaliseProduct(p: any): ShopItem {
  return {
    id: p.id,
    title: p.name ?? p.title ?? '',
    name: p.name ?? p.title ?? '',
    description: p.description ?? '',
    price: String(p.price ?? 0),
    currency: p.currency ?? 'INR',
    category: p.category ?? 'General',
    image_url: resolveMediaUrl(p.image_url ?? (Array.isArray(p.images) ? p.images[0] : null)) ?? undefined,
    images: [...new Set([p.image_url, ...(Array.isArray(p.images) ? p.images : [])].filter(Boolean))]
      .map((u: string) => resolveMediaUrl(u))
      .filter((u): u is string => Boolean(u)),
    stock_quantity: p.stock ?? p.stock_quantity ?? 0,
    stock: p.stock ?? p.stock_quantity ?? 0,
    is_featured: p.is_featured ?? false,
    created_at: p.created_at ?? '',
  };
}

export async function apiGetShopItems(token: string, category?: string) {
  const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
  const res = await request<any>(`/api/products${query}`, authHeader(token));
  if (res.error) return { error: res.error };
  const raw: any[] = Array.isArray(res.data) ? res.data : (res.data?.products ?? res.data?.items ?? []);
  return { data: { items: raw.map(normaliseProduct) } };
}

export async function apiGetShopItemDetail(token: string, itemId: number) {
  const res = await request<any>(`/api/products/${itemId}`, authHeader(token));
  if (res.error) return { error: res.error };
  const raw = res.data?.product ?? res.data?.item ?? res.data;
  return { data: { item: normaliseProduct(raw) } };
}

export async function apiPurchaseShopItem(
  token: string,
  item_id: number,
  quantity: number,
  shipping_address: string
) {
  // Backend: POST /api/orders/checkout
  return request<{ message: string; order: any }>('/api/orders/checkout', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ product_id: item_id, quantity }],
      shipping_address,
    }),
    ...authHeader(token),
  });
}

export async function apiGetShopOrders(token: string) {
  // Backend: GET /api/orders/my-orders
  const res = await request<any>('/api/orders/my-orders', authHeader(token));
  if (res.error) return { error: res.error };
  const raw: any[] = Array.isArray(res.data) ? res.data : (res.data?.orders ?? []);
  // Normalise — handle both old flat schema and new order_items nested schema
  const orders: ShopOrder[] = raw.map((o) => {
    const items: ShopOrderItem[] = Array.isArray(o.order_items)
      ? o.order_items.map((i: any) => ({
          product_id: i.product_id ?? null,
          product_name: i.product_name ?? i.name ?? '',
          product_image_url: i.product_image_url ?? i.image_url ?? null,
          quantity: i.quantity ?? 1,
          price_at_purchase: Number(i.price_at_purchase ?? i.price ?? 0),
        }))
      : [];
    // For the flat legacy shape, synthesise a single-item order_items array
    const legacyItems: ShopOrderItem[] = items.length === 0 ? [{
      product_id: o.product_id ?? o.item_id ?? null,
      product_name: o.product_name ?? o.item_title ?? o.name ?? 'Order',
      product_image_url: o.image_url ?? null,
      quantity: o.quantity ?? 1,
      price_at_purchase: Number(o.total_price ?? o.total ?? 0) / (o.quantity ?? 1),
    }] : [];
    const resolvedItems = items.length > 0 ? items : legacyItems;
    const firstItem = resolvedItems[0];
    return {
      id: o.id,
      item_id: firstItem?.product_id ?? 0,
      item_title: firstItem?.product_name ?? 'Order',
      item_category: o.category ?? o.item_category ?? '',
      image_url: firstItem?.product_image_url ?? undefined,
      quantity: resolvedItems.reduce((s, i) => s + i.quantity, 0),
      total_price: String(o.total_amount ?? o.total_price ?? o.total ?? 0),
      shipping_address: o.shipping_address ?? '',
      status: o.status ?? 'paid',
      created_at: o.created_at ?? '',
      order_items: resolvedItems,
      total_amount: Number(o.total_amount ?? o.total_price ?? 0),
    };
  });
  return { data: { orders } };
}

// ── Profile API ───────────────────────────────────────────────────────────────

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  phone_number: string | null;
  date_of_birth: string | null;
  age: number | null;
  role: string;
  user_category?: 'normal' | 'dikshan';
  profileComplete?: boolean;
  created_at: string;
};

export async function apiGetProfile(token: string) {
  const res = await request<{ user: UserProfile }>('/api/users/me', authHeader(token));
  if (res.error || !res.data) return { error: res.error ?? 'Could not load your profile.' };
  return { data: res.data.user };
}

export async function apiUpdateProfile(
  token: string,
  payload: { name: string; phoneNumber: string; dateOfBirth: string }
) {
  const res = await request<{ user: UserProfile }>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
    ...authHeader(token),
  });
  if (res.error || !res.data) return { error: res.error ?? 'Could not save your profile.' };
  return { data: res.data.user };
}

export async function apiChangePassword(token: string, currentPassword: string, newPassword: string) {
  return request<{ message: string }>('/api/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
    ...authHeader(token),
  });
}

// ── Meditation stats (for dashboard/profile) ──────────────────────────────────

export type MeditationStats = {
  sessionsPlayed: number;
  sessionsCompleted: number;
  bookmarkCount: number;
  totalMinutes: number;
  lastPlayed: { id: number; title: string; completed: boolean } | null;
};

export async function apiGetMeditationStats(token: string) {
  // Backend: GET /api/meditation/stats/me
  const res = await request<any>('/api/meditation/stats/me', authHeader(token));
  if (res.error) return { error: res.error };
  const d = res.data ?? {};
  // Normalise whatever shape the backend returns
  const stats: MeditationStats = {
    sessionsPlayed: d.sessions_played ?? d.sessionsPlayed ?? 0,
    sessionsCompleted: d.sessions_completed ?? d.sessionsCompleted ?? 0,
    bookmarkCount: d.bookmark_count ?? d.bookmarkCount ?? 0,
    totalMinutes: d.total_minutes ?? d.totalMinutes ?? 0,
    lastPlayed: (d.lastPlayed ?? d.last_played)
      ? { id: (d.lastPlayed ?? d.last_played).id, title: (d.lastPlayed ?? d.last_played).title, completed: !!(d.lastPlayed ?? d.last_played).completed }
      : null,
  };
  return { data: stats };
}

// ── Bookmarks API ─────────────────────────────────────────────────────────────

export type BookmarkItem = {
  id: number;
  type: 'course' | 'meditation' | 'product';
  title: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  mentor_name?: string | null;
};

export async function apiGetBookmarks(token: string) {
  // Backend: GET /api/bookmarks → { bookmarks: [...] }
  const res = await request<any>('/api/bookmarks', authHeader(token));
  if (res.error) return { error: res.error };
  const raw: any[] = res.data?.bookmarks ?? [];
  const items: BookmarkItem[] = raw.map((b) => ({
    id: b.id ?? b.content_id,
    type: (b.type ?? b.content_type ?? 'product') as BookmarkItem['type'],
    title: b.title ?? b.course_title ?? b.product_name ?? '',
    description: b.description ?? b.course_description ?? b.product_description ?? null,
    price: b.price != null ? Number(b.price) : (b.course_price != null ? Number(b.course_price) : (b.product_price != null ? Number(b.product_price) : null)),
    image_url: b.image_url ?? b.course_thumbnail ?? b.product_image ?? null,
    mentor_name: b.mentor_name ?? null,
  }));
  return { data: { items } };
}

export async function apiToggleBookmark(token: string, type: string, id: number) {
  // Backend: POST /api/bookmarks/:type/:id
  return request<{ bookmarked: boolean }>(`/api/bookmarks/${type}/${id}`, {
    method: 'POST',
    ...authHeader(token),
  });
}

export async function apiGetMeditationBookmarkStatus(token: string, meditationId: number) {
  return request<{ bookmarked: boolean }>(`/api/meditation/${meditationId}/bookmark`, authHeader(token));
}

export async function apiToggleMeditationBookmark(token: string, meditationId: number) {
  return request<{ bookmarked: boolean }>(`/api/meditation/${meditationId}/bookmark`, {
    method: 'POST',
    ...authHeader(token),
  });
}

// ── Notifications API ─────────────────────────────────────────────────────────

export type AppNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  created_at: string;
};

export async function apiGetNotifications(token: string, options?: { unreadOnly?: boolean; page?: number }) {
  const params = new URLSearchParams();
  if (options?.unreadOnly) params.set('unread', 'true');
  if (options?.page) params.set('page', String(options.page));
  const query = params.toString() ? `?${params.toString()}` : '';
  // Backend returns { notifications, page, limit, total } — no unread_count on this endpoint
  const res = await request<any>(`/api/notifications${query}`, authHeader(token));
  if (res.error) return { error: res.error };
  return {
    data: {
      notifications: (res.data?.notifications ?? []) as AppNotification[],
      unread_count: 0, // fetched separately via apiGetUnreadCount
    },
  };
}

export async function apiGetUnreadCount(token: string): Promise<number> {
  const res = await request<{ unread_count: number }>('/api/notifications/unread-count', authHeader(token));
  return res.data?.unread_count ?? 0;
}

export async function apiMarkNotificationRead(token: string, notificationId: number) {
  // Backend: PATCH /api/notifications/:id/read
  return request<{ success: boolean }>(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    ...authHeader(token),
  });
}

export async function apiMarkAllNotificationsRead(token: string) {
  // Backend: PATCH /api/notifications/read-all
  return request<{ success: boolean }>('/api/notifications/read-all', {
    method: 'PATCH',
    ...authHeader(token),
  });
}

export async function apiDismissNotification(token: string, notificationId: number) {
  return request<{ success: boolean }>(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
    ...authHeader(token),
  });
}

// ── Donations API ─────────────────────────────────────────────────────────────

export type DonationStatus = 'pending' | 'confirmed' | 'cancelled';

export type DonationRecord = {
  id: number;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  status: DonationStatus;
  created_at: string;
  confirmed_at?: string | null;
  donor_name?: string | null;
  donor_email?: string | null;
  donor_phone?: string | null;
  purpose?: string | null;
  source?: 'online' | 'offline';
};

export type DonationReceipt = {
  id: number;
  amount: number;
  donorName: string;
  donorEmail: string;
  donorPhone?: string | null;
  purpose: string;
  date: string;
  receiptNumber: string;
};

export async function apiGetMyDonations(token: string) {
  const res = await request<{ donations: DonationRecord[] }>('/api/donations/my', authHeader(token));
  if (res.error) return { error: res.error };
  const donations = (res.data?.donations ?? []).map((d) => ({ ...d, amount: Number(d.amount) }));
  return { data: { donations } };
}

/** Create a Razorpay order for a donation (same contract as the website). */
export async function apiCreateDonationPaymentOrder(
  token: string,
  payload: { amount: number; purpose: string; address: string; message?: string }
) {
  return request<{ order: RazorpayOrder }>('/api/donations/order', {
    method: 'POST',
    body: JSON.stringify({
      amount: payload.amount,
      purpose: payload.purpose,
      address: payload.address,
      message: payload.message ?? '',
    }),
    ...authHeader(token),
  });
}

// ── Daily Sadhana API ─────────────────────────────────────────────────────────

export type DailyActivityType = 'text' | 'video' | 'audio' | 'pdf' | 'mcq' | 'meditation';

export type DailyActivityQuestion = { prompt: string; options: string[]; answer: number };

export type SadhanaEntry = {
  id: number;
  title: string;
  description: string | null;
  scheduled_for: string;
  completed: boolean;
  content_type?: DailyActivityType;
  /** Signed, ready-to-play URL for video / audio / PDF activities. */
  media_url?: string | null;
  content_data?: { questions?: DailyActivityQuestion[] } | null;
  meditation_id?: number | null;
  meditation_title?: string | null;
  meditation_media_type?: 'audio' | 'video' | null;
  meditation_media_url?: string | null;
};

/** One day in the activity calendar (GET /api/sadhana/calendar). */
export type DailyActivitySummary = {
  id: number;
  title: string;
  scheduled_for: string;
  content_type: DailyActivityType;
  completed?: boolean;
};

export type SadhanaStreak = {
  current: number;
  longest: number;
};

export type SadhanaLeaderboardEntry = {
  id: number;
  name: string;
  current: number;
  longest: number;
};

export async function apiGetTodaySadhana(token: string) {
  return request<{ sadhana: SadhanaEntry | null; streak: SadhanaStreak }>(
    '/api/sadhana/today',
    authHeader(token)
  );
}

export async function apiCompleteSadhana(token: string) {
  return request<{ completed: boolean; streak: SadhanaStreak }>(
    '/api/sadhana/today/complete',
    { method: 'POST', ...authHeader(token) }
  );
}

/** Published activities for a month ("YYYY-MM"), with this member's completion state. */
export async function apiGetSadhanaCalendar(token: string, month: string) {
  return request<{ month: string; activities: DailyActivitySummary[] }>(
    `/api/sadhana/calendar?month=${encodeURIComponent(month)}`,
    authHeader(token)
  );
}

/** Full activity for a date ("YYYY-MM-DD"), including signed media links. */
export async function apiGetSadhanaByDate(token: string, date: string) {
  return request<{ activity: SadhanaEntry }>(
    `/api/sadhana/date/${encodeURIComponent(date)}`,
    authHeader(token)
  );
}

/** Complete a specific activity — only allowed on its scheduled day. */
export async function apiCompleteSadhanaById(token: string, id: number) {
  return request<{ completed: boolean; streak: SadhanaStreak }>(
    `/api/sadhana/${encodeURIComponent(String(id))}/complete`,
    { method: 'POST', ...authHeader(token) }
  );
}

export async function apiGetSadhanaLeaderboard(token: string) {
  // Backend returns a plain array
  const res = await request<any>('/api/sadhana/leaderboard', authHeader(token));
  if (res.error) return { error: res.error };
  const raw: any[] = Array.isArray(res.data) ? res.data : [];
  const data: SadhanaLeaderboardEntry[] = raw.map((e) => ({
    id: e.id ?? e.user_id,
    name: e.name ?? '',
    current: e.current ?? 0,
    longest: e.longest ?? 0,
  }));
  return { data };
}

// ── Help / FAQ API ────────────────────────────────────────────────────────────

export type HelpCategory = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
};

export type HelpFaq = {
  id: number;
  question: string;
  answer: string;
  category_id?: number | null;
  category_slug: string;
};

export async function apiGetHelpCategories(token: string) {
  return request<HelpCategory[]>('/api/help/categories', authHeader(token));
}

export async function apiGetHelpFaqs(token: string, options?: { search?: string; category?: string }) {
  const params = new URLSearchParams();
  if (options?.search) params.set('search', options.search);
  if (options?.category) params.set('category', options.category);
  const query = params.toString() ? `?${params.toString()}` : '';
  return request<{ faqs: HelpFaq[] }>(`/api/help/faqs${query}`, authHeader(token));
}

export async function apiSubmitFaqFeedback(token: string, faqId: number, helpful: boolean) {
  return request<unknown>(`/api/help/faqs/${faqId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ helpful }),
    ...authHeader(token),
  });
}

// ── Support tickets API ───────────────────────────────────────────────────────

export type SupportStatus = 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';

export type SupportMessage = {
  id: number;
  ticket_id: number;
  sender_user_id: number | null;
  sender_name: string | null;
  sender_role?: 'admin' | 'user' | 'mentor' | null;
  message: string;
  created_at: string;
};

export type SupportTicket = {
  id: number;
  ticket_number: string;
  user_id: number;
  category_id: number | null;
  category_name: string | null;
  subject: string;
  description: string;
  status: SupportStatus;
  priority: SupportPriority;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  messages?: SupportMessage[];
};

export async function apiCreateSupportTicket(
  token: string,
  payload: { category_id?: number | null; subject: string; description: string; priority?: SupportPriority }
) {
  const res = await request<{ ticket: SupportTicket }>('/api/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
    ...authHeader(token),
  });
  if (res.error || !res.data) return { error: res.error ?? 'Could not create the ticket.' };
  return { data: res.data.ticket };
}

export async function apiGetMySupportTickets(token: string, status?: string) {
  const res = await request<SupportTicket[]>(
    `/api/support/tickets${status ? `?status=${encodeURIComponent(status)}` : ''}`,
    authHeader(token)
  );
  if (res.error) return { error: res.error };
  return { data: asArray<SupportTicket>(res.data) };
}

export async function apiGetMySupportTicket(token: string, ticketId: number) {
  return request<SupportTicket>(`/api/support/tickets/${ticketId}`, authHeader(token));
}

export async function apiReplySupportTicket(token: string, ticketId: number, message: string) {
  const res = await request<{ ticket: SupportTicket }>(`/api/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
    ...authHeader(token),
  });
  if (res.error || !res.data) return { error: res.error ?? 'Could not send your reply.' };
  return { data: res.data.ticket };
}

export async function apiReopenSupportTicket(token: string, ticketId: number) {
  const res = await request<{ ticket: SupportTicket }>(`/api/support/tickets/${ticketId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'open' }),
    ...authHeader(token),
  });
  if (res.error || !res.data) return { error: res.error ?? 'Could not reopen the ticket.' };
  return { data: res.data.ticket };
}

// ── Cart API ──────────────────────────────────────────────────────────────────

export type CartItem = {
  id: number;          // cart row id
  product_id: number;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock: number;
};

export async function apiGetCart(token: string) {
  // Backend: GET /api/cart
  const res = await request<any>('/api/cart', authHeader(token));
  if (res.error) return { error: res.error };
  const raw: any[] = Array.isArray(res.data) ? res.data : (res.data?.items ?? res.data?.cart ?? []);
  const items: CartItem[] = raw.map((i) => ({
    id: i.id,
    product_id: i.product_id ?? i.id,
    name: i.name ?? i.product_name ?? '',
    price: Number(i.price ?? 0),
    image_url: i.image_url ?? null,
    quantity: i.quantity ?? 1,
    stock: i.stock ?? i.stock_quantity ?? 99,
  }));
  return { data: { items } };
}

export async function apiAddToCart(token: string, productId: number, quantity: number = 1) {
  // Backend: POST /api/cart  { productId, quantity }  (backend expects camelCase)
  return request<{ message: string }>('/api/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
    ...authHeader(token),
  });
}

export async function apiUpdateCartItem(token: string, cartItemId: number, quantity: number) {
  // Backend: PATCH /api/cart/:itemId
  return request<{ message: string }>(`/api/cart/${cartItemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
    ...authHeader(token),
  });
}

export async function apiRemoveCartItem(token: string, cartItemId: number) {
  // Backend: DELETE /api/cart/:itemId
  return request<{ message: string }>(`/api/cart/${cartItemId}`, {
    method: 'DELETE',
    ...authHeader(token),
  });
}

// ── Payments API (Razorpay) ───────────────────────────────────────────────────
// The backend uses Razorpay test-mode keys.  The flow is:
//   1. Create a gateway order  →  receive { keyId, orderId, amount, currency }
//   2. Open a WebView / Razorpay SDK with those values and collect payment
//   3. After the user completes payment, Razorpay returns
//        razorpay_order_id, razorpay_payment_id, razorpay_signature
//   4. POST /api/payments/verify  →  backend verifies & fulfils the order

export type RazorpayOrder = {
  keyId: string;
  orderId: string;    // Razorpay gateway order id  (rzp_…)
  amount: number;     // amount in paise
  currency: string;
};

export type VerifiedPayment = {
  purpose: 'course' | 'shop' | 'donation';
  referenceId: number | null;
  receiptNumber: string | null;
  amount: number;
  paidAt: string;
  donor?: { name: string; email: string; phone?: string | null } | null;
  donationPurpose?: string | null;
};

/** Create a Razorpay order for a paid course enrollment. */
export async function apiCreateCoursePaymentOrder(token: string, courseId: number) {
  return request<{ order: RazorpayOrder }>(`/api/payments/courses/${courseId}/order`, {
    method: 'POST',
    ...authHeader(token),
  });
}

/** Create a Razorpay order for the entire cart (requires a shipping address). */
export async function apiCreateShopPaymentOrder(token: string, shippingAddress: string) {
  return request<{ order: RazorpayOrder }>('/api/payments/shop/order', {
    method: 'POST',
    body: JSON.stringify({ shippingAddress }),
    ...authHeader(token),
  });
}

/** Verify a completed Razorpay payment.  On success the backend fulfils the order. */
export async function apiVerifyPayment(
  token: string | null,
  payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
) {
  const opts: RequestInit = {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) {
    (opts.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return request<VerifiedPayment>('/api/payments/verify', opts);
}

// ── Site content / Announcements API ─────────────────────────────────────────

export type SiteAnnouncement = {
  enabled: boolean;
  title: string;
  message: string;
  imageUrl: string;
  actionLabel: string;
  actionUrl: string;
  updatedAt: string;
};

/**
 * Fetch the active site announcement (no auth required).
 * Returns null when no announcement is set or the backend is unavailable.
 */
export async function apiGetAnnouncement(): Promise<SiteAnnouncement | null> {
  const res = await request<{ announcement: SiteAnnouncement | null }>('/api/site-content/announcement');
  return res.data?.announcement ?? null;
}

// ── Notification preferences ─────────────────────────────────────────────────

export type NotificationPreferences = {
  event_notifications: boolean;
  volunteering_notifications: boolean;
  camp_notifications: boolean;
  course_notifications: boolean;
  meditation_notifications: boolean;
  community_notifications: boolean;
  reminder_notifications: boolean;
  daily_practice_reminder_enabled: boolean;
  daily_practice_reminder_time: string;
};

export async function apiGetNotificationPreferences(token: string) {
  const res = await request<any>('/api/notifications/preferences', authHeader(token));
  if (res.error) return { error: res.error };
  return { data: (res.data?.preferences ?? res.data) as NotificationPreferences };
}

export async function apiUpdateNotificationPreferences(token: string, patch: Partial<NotificationPreferences>) {
  const res = await request<any>('/api/notifications/preferences', {
    method: 'PATCH',
    body: JSON.stringify(patch),
    ...authHeader(token),
  });
  if (res.error) return { error: res.error };
  return { data: (res.data?.preferences ?? res.data) as NotificationPreferences };
}

// ── Meditation categories ────────────────────────────────────────────────────

export type MeditationCategory = { id: number; name: string };

export async function apiGetMeditationCategories(token: string) {
  const res = await request<{ categories: MeditationCategory[] }>('/api/meditation/categories', authHeader(token));
  if (res.error) return { error: res.error };
  return { data: res.data?.categories ?? [] };
}

// ── About page content ───────────────────────────────────────────────────────

export type AboutContent = {
  introTitle: string;
  introParagraphs: string[];
  introImage: string;
  introCaption: string;
  beliefQuote: string;
  beliefDescription: string;
  values: { title: string; description: string }[];
  focusTitle: string;
  focusDescription: string;
  focusAreas: { title: string; description: string }[];
  programsTitle: string;
  programsDescription: string;
  programs: { title: string; description: string }[];
  partnershipTitle: string;
  partnershipDescription: string;
  partnershipItems: string[];
  visionTitle: string;
  visionDescription: string;
};

export async function apiGetAboutContent(): Promise<Partial<AboutContent> | null> {
  const res = await request<any>('/api/site-content/about');
  if (res.error || !res.data) return null;
  return (res.data.about ?? res.data.content ?? res.data) as Partial<AboutContent>;
}

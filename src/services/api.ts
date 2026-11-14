import { Platform } from 'react-native';

// ─── Backend endpoint ──────────────────────────────────────────────────────────
// The app now shares the same backend as the website (spiritual-engineering-main).
// Update LOCAL_IP to your machine's LAN address when testing on a physical device
// via Expo Go (run: ipconfig getifaddr en0  on macOS).
// The website backend runs on PORT 5001 by default.
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

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Something went wrong.' };
    }

    return { data };
  } catch (error: any) {
    console.error('API request error for', endpoint, error?.message || error);
    if (error?.name === 'AbortError') {
      return { error: 'Request timed out. Please check your network and try again.' };
    }
    return { error: 'Network error. Could not connect to the backend server.' };
  }
}

// ---- Auth API ----

export type User = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  profileComplete?: boolean;
  profile_picture_url?: string | null;
};

type AuthResponse = {
  message: string;
  token: string;
  user: User;
};

// Registration only returns email + message (OTP flow — no token yet)
type RegisterResponse = {
  message: string;
  email: string;
};

type OtpVerifyResponse = {
  message: string;
  token: string;
  user: User;
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
export async function apiSignup(name: string, email: string, password: string) {
  return request<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
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
  // Backend columns
  content_type: string | null;      // 'video' | 'pdf'
  content_url: string | null;       // used by web; mobile maps to video_filename
  position: number;
  duration_seconds: number | null;
  // Computed / legacy aliases kept for the mobile screens
  video_filename: string | null;    // mapped from content_url for video lessons
  duration_sec: number;             // mapped from duration_seconds
  sort_order: number;               // mapped from position
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
  // Fetch course and lessons in parallel; resources/assignments/quizzes not yet
  // implemented in the backend so we return empty arrays for them.
  const [courseRes, lessonsRes] = await Promise.all([
    request<{ course: Course }>(`/api/courses/${courseId}`, authHeader(token)),
    request<{ lessons: any[]; locked: boolean }>(`/api/courses/${courseId}/lessons`, authHeader(token)),
  ]);

  if (courseRes.error || !courseRes.data) {
    return { error: courseRes.error ?? 'Course not found.' };
  }

  // Normalise lesson shape to what the mobile screens expect
  const rawLessons: any[] = lessonsRes.data?.lessons ?? [];
  const lessons: Lesson[] = rawLessons.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description ?? null,
    content_type: l.content_type ?? null,
    content_url: l.content_url ?? null,
    position: l.position ?? 0,
    duration_seconds: l.duration_seconds ?? null,
    // Legacy aliases
    video_filename: l.content_type === 'video' ? (l.content_url ?? null) : null,
    duration_sec: l.duration_seconds ?? 0,
    sort_order: l.position ?? 0,
    is_free: l.is_free ?? false,
    completed: l.completed ?? false,
    watched_sec: l.watched_sec ?? 0,
  }));

  const detail: CourseDetail = {
    course: courseRes.data.course,
    lessons,
    resources: [],
    assignments: [],
    quizzes: [],
  };

  return { data: detail };
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
    guide_name: m.creator_name ?? m.guide_name ?? 'Karma Vajra',
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
// The backend uses a groups → questions → replies model.
// The app maps: group = community forum, question = post, reply = comment.
// Default group id = 1 (the main public group).

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

function normaliseQuestion(q: any): CommunityPost {
  return {
    id: q.id,
    user_id: q.user_id ?? q.userId ?? 0,
    author_name: q.author_name ?? q.user_name ?? q.user?.name ?? 'Community member',
    title: q.title ?? '',
    content: q.content ?? q.question ?? '',
    category: q.category ?? q.group_name ?? 'General',
    likes_count: q.likes_count ?? q.vote_count ?? 0,
    liked_by_user: q.liked_by_user ?? q.voted_by_user ?? false,
    comments_count: q.reply_count ?? q.comments_count ?? 0,
    created_at: q.created_at ?? '',
  };
}

function normaliseReply(r: any, postId: number): PostComment {
  return {
    id: r.id,
    post_id: postId,
    user_id: r.user_id ?? 0,
    author_name: r.author_name ?? r.user_name ?? r.user?.name ?? 'Member',
    content: r.content ?? r.reply ?? '',
    created_at: r.created_at ?? '',
  };
}

// GET /api/community/questions — recent questions across all groups
export async function apiGetPosts(token: string, _category?: string) {
  const res = await request<any>('/api/community/questions', authHeader(token));
  if (res.error) return { error: res.error };
  const raw: any[] = Array.isArray(res.data) ? res.data : (res.data?.questions ?? []);
  return { data: { posts: raw.map(normaliseQuestion) } };
}

// POST /api/community/groups/:groupId/questions
// Fetches the first active group dynamically to avoid hardcoding an ID
export async function apiCreatePost(token: string, title: string, content: string, _category: string = 'General') {
  // Get groups and find first active one the user is a member of
  const groupsRes = await request<any>('/api/community/groups', authHeader(token));
  const groups: any[] = Array.isArray(groupsRes.data)
    ? groupsRes.data
    : (groupsRes.data?.groups ?? []);
  // Prefer active groups the user has joined; fall back to any active group
  const activeGroup =
    groups.find((g) => g.status === 'active' && g.is_member) ??
    groups.find((g) => g.status === 'active');

  if (!activeGroup) return { error: 'No active community group available.' };

  // Auto-join if not already a member (so new users can post immediately)
  if (!activeGroup.is_member) {
    await request<any>(`/api/community/groups/${activeGroup.id}/join`, {
      method: 'POST',
      ...authHeader(token),
    });
  }

  const res = await request<any>(`/api/community/groups/${activeGroup.id}/questions`, {
    method: 'POST',
    body: JSON.stringify({ title, content }),
    ...authHeader(token),
  });
  if (res.error) return { error: res.error };
  const q = res.data?.question ?? res.data;
  return { data: { post: normaliseQuestion(q) } };
}

// No delete on questions from backend — return a soft error
export async function apiDeletePost(_token: string, _postId: number) {
  return { error: 'Deleting posts is not available.' };
}

// GET /api/community/questions/:id
export async function apiGetPostDetail(token: string, postId: number) {
  const res = await request<any>(`/api/community/questions/${postId}`, authHeader(token));
  if (res.error) return { error: res.error };
  const raw = res.data?.question ?? res.data;
  const repliesRaw: any[] = res.data?.replies ?? [];
  return {
    data: {
      post: normaliseQuestion(raw),
      comments: repliesRaw.map((r) => normaliseReply(r, postId)),
    },
  };
}

// No server-side like on questions — optimistic only, no-op API call
export async function apiToggleLikePost(_token: string, _postId: number) {
  return { data: { liked: true, likes_count: 0 } };
}

// POST /api/community/questions/:id/replies
export async function apiAddComment(token: string, postId: number, content: string) {
  const res = await request<any>(`/api/community/questions/${postId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ content }),
    ...authHeader(token),
  });
  if (res.error) return { error: res.error };
  const r = res.data?.reply ?? res.data;
  return { data: { comment: normaliseReply(r, postId) } };
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
  // Additional fields from backend
  duration_minutes?: number;
  capacity?: number | null;
  fee?: number;
  status?: string;
};

// Normalise a raw backend event row to the EventItem shape the screens use
function normaliseEvent(e: any): EventItem {
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? '',
    event_date: e.event_date ?? '',
    time_str: e.start_time ?? e.time_str ?? '',
    location: e.location ?? '',
    is_online: e.event_type === 'online' || e.is_online === true,
    meeting_link: e.meeting_url ?? e.meeting_link ?? undefined,
    banner_url: e.banner_url ?? undefined,
    attendees_count: e.registered_count ?? e.attendees_count ?? 0,
    registered_by_user: e.registered_by_user ?? false,
    duration_minutes: e.duration_minutes ?? undefined,
    capacity: e.capacity ?? null,
    fee: e.fee ?? 0,
    status: e.status ?? undefined,
  };
}

export async function apiGetEvents(token: string) {
  // Backend returns a plain array, not { events: [] }
  const res = await request<any>('/api/events', authHeader(token));
  if (res.error) return { error: res.error };
  const raw = Array.isArray(res.data) ? res.data : (res.data?.events ?? []);
  return { data: { events: raw.map(normaliseEvent) } };
}

export async function apiGetEventDetail(token: string, eventId: number) {
  const res = await request<any>(`/api/events/${eventId}`, authHeader(token));
  if (res.error) return { error: res.error };
  const raw = res.data?.event ?? res.data;
  return { data: { event: normaliseEvent(raw) } };
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

function normaliseOpportunity(o: any): VolunteerOpportunity {
  return {
    id: o.id,
    title: o.title ?? '',
    description: o.description ?? '',
    category: o.category ?? '',
    location: o.location ?? '',
    required_volunteers: o.capacity ?? o.required_volunteers ?? 0,
    current_volunteers: o.occupied ?? o.current_volunteers ?? 0,
    applied_by_user: o.my_application != null || o.applied_by_user === true,
    application_status: o.my_application?.status ?? o.application_status ?? undefined,
    created_at: o.created_at ?? '',
  };
}

// Backend mounts at /api/volunteering (not /api/volunteer)
export async function apiGetVolunteerOpportunities(token: string) {
  const res = await request<any>('/api/volunteering', authHeader(token));
  if (res.error) return { error: res.error };
  const raw = Array.isArray(res.data) ? res.data : (res.data?.opportunities ?? []);
  return { data: { opportunities: raw.map(normaliseOpportunity) } };
}

export async function apiApplyVolunteer(token: string, opportunityId: number, notes: string = '') {
  // Backend expects POST /api/volunteering/:id/apply
  return request<{ message: string; application: any }>(`/api/volunteering/${opportunityId}/apply`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
    ...authHeader(token),
  });
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
    image_url: p.image_url ?? undefined,
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
  created_at: string;
};

export async function apiGetProfile(token: string) {
  return request<UserProfile>('/api/users/me', authHeader(token));
}

export async function apiUpdateProfile(
  token: string,
  payload: { name: string; phoneNumber: string; dateOfBirth: string }
) {
  return request<UserProfile>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
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
    lastPlayed: d.last_played
      ? { id: d.last_played.id, title: d.last_played.title, completed: !!d.last_played.completed }
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

export type DonationRecord = {
  id: number;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  status: string;
  created_at: string;
};

export async function apiGetMyDonations(token: string) {
  return request<{ donations: DonationRecord[] }>('/api/donations/my', authHeader(token));
}

// ── My Volunteering history ───────────────────────────────────────────────────

export type MyVolunteerApplication = {
  id: number;
  title: string;
  category: string;
  location: string;
  event_date: string | null;
  application_id: number;
  application_status: string; // 'pending' | 'approved' | 'rejected' | 'completed'
  applied_at: string;
  attendance_status: string | null;
  duration_minutes: number | null;
  certificate_status: string | null;
  certificate_number: string | null;
};

export async function apiGetMyVolunteering(token: string) {
  const res = await request<any[]>('/api/volunteering/my', authHeader(token));
  if (res.error) return { error: res.error };
  const rows: MyVolunteerApplication[] = (res.data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title ?? '',
    category: r.category ?? '',
    location: r.location ?? '',
    event_date: r.event_date ?? null,
    application_id: r.application_id,
    application_status: r.application_status ?? 'pending',
    applied_at: r.applied_at ?? '',
    attendance_status: r.attendance_status ?? null,
    duration_minutes: r.duration_minutes ?? null,
    certificate_status: r.certificate_status ?? null,
    certificate_number: r.certificate_number ?? null,
  }));
  return { data: { applications: rows } };
}

export async function apiCreateDonation(
  token: string,
  payload: { amount: number; message?: string; isAnonymous?: boolean }
) {
  return request<{ donation: DonationRecord; payment_url?: string }>('/api/donations', {
    method: 'POST',
    body: JSON.stringify({
      amount: payload.amount,
      message: payload.message ?? '',
      is_anonymous: payload.isAnonymous ?? false,
    }),
    ...authHeader(token),
  });
}

// ── Daily Sadhana API ─────────────────────────────────────────────────────────

export type SadhanaEntry = {
  id: number;
  title: string;
  description: string | null;
  scheduled_for: string;
  completed: boolean;
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
  // Backend: POST /api/cart  { product_id, quantity }
  return request<{ message: string }>('/api/cart', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
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

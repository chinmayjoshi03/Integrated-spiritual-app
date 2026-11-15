/**
 * Date/lifecycle helpers ported from the website:
 *   spiritual-website/src/features/events/utils/eventLifecycle.ts
 *   spiritual-website/src/features/volunteering/utils/volunteerLifecycle.ts
 *   spiritual-website/src/features/volunteering/utils/formatVolunteerDate.ts
 */
import type { EventItem, VolunteerOpportunity } from '@/services/api';

export type Lifecycle = 'draft' | 'upcoming' | 'live' | 'completed' | 'cancelled';

const pad = (value: number) => String(value).padStart(2, '0');

export const getDateParts = (date: string) => {
  const [year, month, day] = String(date || '').slice(0, 10).split('-').map(Number);
  return { year, month, day };
};

export const getTimeParts = (time: string) => {
  const text = String(time || '');
  const match = text.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/) || text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return { hours: 0, minutes: 0, seconds: 0 };
  return { hours: Number(match[1]) || 0, minutes: Number(match[2]) || 0, seconds: Number(match[3] || 0) || 0 };
};

const combine = (date: string, time: string) => {
  const { year, month, day } = getDateParts(date);
  const { hours, minutes, seconds } = getTimeParts(time);
  return new Date(year, month - 1, day, hours, minutes, seconds);
};

export const getEventStart = (event: Pick<EventItem, 'event_date' | 'start_time'>) => combine(event.event_date, event.start_time);

export const getEventEnd = (event: Pick<EventItem, 'event_date' | 'start_time' | 'duration_minutes'>) =>
  new Date(getEventStart(event).getTime() + (event.duration_minutes || 0) * 60 * 1000);

export function getEventLifecycle(event: EventItem, now = new Date()): Lifecycle {
  if (event.status === 'draft') return 'draft';
  if (event.status === 'cancelled') return 'cancelled';
  const start = getEventStart(event);
  const end = getEventEnd(event);
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'completed';
}

export function getVolunteerLifecycle(opportunity: VolunteerOpportunity, now = new Date()): Lifecycle {
  if (opportunity.status === 'draft') return 'draft';
  if (opportunity.status === 'cancelled') return 'cancelled';
  if (opportunity.status === 'completed') return 'completed';
  const start = combine(opportunity.event_date, opportunity.start_time);
  const end = combine(opportunity.event_date, opportunity.end_time);
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'completed';
}

export const lifecycleLabel = (status: Lifecycle) =>
  ({ draft: 'Draft', upcoming: 'Upcoming', live: 'Live now', completed: 'Completed', cancelled: 'Cancelled' })[status];

/** "12 March 2026" */
export function formatDate(date: string | null | undefined) {
  if (!date) return '—';
  const { year, month, day } = getDateParts(date);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "Thu, 12 Mar" */
export function formatShortDate(date: string) {
  const { year, month, day } = getDateParts(date);
  if (!year) return date;
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "6:30 pm" */
export function formatTime(time: string | null | undefined) {
  if (!time) return '';
  const { hours, minutes } = getTimeParts(time);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function formatDuration(minutes: number) {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function volunteerDurationMinutes(start: string, end: string) {
  const s = getTimeParts(start);
  const e = getTimeParts(end);
  return e.hours * 60 + e.minutes - (s.hours * 60 + s.minutes);
}

/** "2 days ago" style relative time for community posts. */
export function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 86400 * 7) {
    const days = Math.floor(diff / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** iCalendar file content for "Add to calendar" (same as the website's buildEventIcs). */
export function buildEventIcs(event: EventItem) {
  const stamp = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const location = event.event_type === 'online' ? event.meeting_url || 'Online event' : event.location || 'Offline event';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Karm Vajra//Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@thekarmvajra`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(getEventStart(event))}`,
    `DTEND:${stamp(getEventEnd(event))}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.description || event.title)}`,
    `LOCATION:${escape(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export const supportStatusLabel = (s: string) =>
  ({ open: 'Open', in_progress: 'In progress', waiting_for_user: 'Waiting for you', resolved: 'Resolved', closed: 'Closed' } as Record<string, string>)[s] ?? s;

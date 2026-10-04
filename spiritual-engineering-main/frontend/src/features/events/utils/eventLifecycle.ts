import type { Event, EventLifecycleStatus, EventStatus, EventType } from '../types/event.types';

const pad = (value: number) => String(value).padStart(2, '0');

export const getEventDateParts = (eventDate: string) => {
  const [year, month, day] = eventDate.slice(0, 10).split('-').map(Number);
  return { year, month, day };
};

export const getEventTimeParts = (startTime: string) => {
  const text = String(startTime || '');
  const isoMatch = text.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
  const wallMatch = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  const match = isoMatch || wallMatch;

  if (!match) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    hours: Number(match[1]) || 0,
    minutes: Number(match[2]) || 0,
    seconds: Number(match[3] || 0) || 0,
  };
};

export const getEventStartDate = (event: Pick<Event, 'event_date' | 'start_time'>) => {
  const { year, month, day } = getEventDateParts(event.event_date);
  const { hours, minutes, seconds } = getEventTimeParts(event.start_time);

  return new Date(year, month - 1, day, hours, minutes, seconds);
};

export const getEventEndDate = (
  event: Pick<Event, 'event_date' | 'start_time' | 'duration_minutes'>
) => {
  return new Date(
    getEventStartDate(event).getTime() + event.duration_minutes * 60 * 1000
  );
};

export const formatLocalDateTimeStamp = (date: Date) => {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
};

export const getEventLifecycleStatus = (
  event: Pick<Event, 'status' | 'event_date' | 'start_time' | 'duration_minutes'>,
  now = new Date()
): EventLifecycleStatus => {
  if (event.status === 'draft') {
    return 'draft';
  }

  if (event.status === 'cancelled') {
    return 'cancelled';
  }

  const start = getEventStartDate(event);
  const end = getEventEndDate(event);

  if (now < start) {
    return 'upcoming';
  }

  if (now >= start && now <= end) {
    return 'live';
  }

  return 'completed';
};

export const canEditEventCoreDetails = (
  event: Pick<Event, 'status' | 'event_date' | 'start_time' | 'duration_minutes'>,
  now = new Date()
) => {
  const lifecycle = getEventLifecycleStatus(event, now);
  return lifecycle === 'draft' || lifecycle === 'upcoming';
};

export const getEventLifecycleLabel = (status: EventLifecycleStatus) => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'upcoming':
      return 'Upcoming';
    case 'live':
      return 'Live Now';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export const getDbStatusLabel = (status: EventStatus) => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'published':
      return 'Published';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export const getEventTypeLabel = (eventType: EventType) => {
  return eventType === 'online' ? 'Online' : 'Offline';
};

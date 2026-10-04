import type { Event } from '../types/event.types';
import {
  formatLocalDateTimeStamp,
  getEventEndDate,
  getEventStartDate,
} from './eventLifecycle';

const escapeIcsText = (value: string) => {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
};

export const buildEventIcs = (event: Event) => {
  const start = getEventStartDate(event);
  const end = getEventEndDate(event);
  const location =
    event.event_type === 'online'
      ? event.meeting_url || 'Online event'
      : event.location || 'Offline event';

  const description = event.description || event.title;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Spiritual Platform//Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@spiritual-platform`,
    `DTSTAMP:${formatLocalDateTimeStamp(new Date())}`,
    `DTSTART:${formatLocalDateTimeStamp(start)}`,
    `DTEND:${formatLocalDateTimeStamp(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

export const downloadEventIcs = (event: Event) => {
  const ics = buildEventIcs(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeTitle = event.title.replace(/[^\w\-]+/g, '-').slice(0, 60);

  anchor.href = url;
  anchor.download = `${safeTitle || 'event'}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

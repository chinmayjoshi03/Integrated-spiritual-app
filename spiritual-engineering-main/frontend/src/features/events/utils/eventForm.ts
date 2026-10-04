import type {
  CreateEventData,
  Event,
  EventFormErrors,
  EventFormStatus,
  EventFormValues,
  EventStatus,
} from '../types/event.types';

export const defaultEventFormValues: EventFormValues = {
  title: '',
  description: '',
  banner_url: '',
  event_type: 'online',
  event_date: '',
  start_time: '',
  duration_minutes: '',
  location: '',
  meeting_url: '',
  capacity: '',
  fee: '',
  status: 'draft',
};

const isPositiveNumber = (value: number) => Number.isFinite(value) && value > 0;

export const eventToFormValues = (event: Event): EventFormValues => {
  const status: EventFormStatus =
    event.status === 'published' ? 'published' : 'draft';

  return {
    title: event.title,
    description: event.description ?? '',
    banner_url: event.banner_url ?? '',
    event_type: event.event_type,
    event_date: event.event_date.slice(0, 10),
    start_time: event.start_time.slice(0, 5),
    duration_minutes: String(event.duration_minutes),
    location: event.location ?? '',
    meeting_url: event.meeting_url ?? '',
    capacity: event.capacity === null ? '' : String(event.capacity),
    fee: String(event.fee),
    status,
  };
};

export const validateEventForm = (values: EventFormValues): EventFormErrors => {
  const errors: EventFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required.';
  }

  if (!values.event_type) {
    errors.event_type = 'Event type is required.';
  }

  if (!values.event_date) {
    errors.event_date = 'Event date is required.';
  }

  if (!values.start_time) {
    errors.start_time = 'Start time is required.';
  }

  if (!values.duration_minutes.trim()) {
    errors.duration_minutes = 'Duration is required.';
  } else {
    const duration = Number(values.duration_minutes);
    if (!isPositiveNumber(duration)) {
      errors.duration_minutes = 'Duration must be a positive number.';
    }
  }

  if (values.event_type === 'online' && !values.meeting_url.trim()) {
    errors.meeting_url = 'Meeting URL is required for online events.';
  }

  if (values.event_type === 'offline' && !values.location.trim()) {
    errors.location = 'Location is required for offline events.';
  }

  if (values.capacity.trim()) {
    const capacity = Number(values.capacity);
    if (!isPositiveNumber(capacity)) {
      errors.capacity = 'Capacity must be a positive number.';
    }
  }

  if (values.fee.trim()) {
    const fee = Number(values.fee);
    if (!Number.isFinite(fee) || fee < 0) {
      errors.fee = 'Fee cannot be negative.';
    }
  }

  return errors;
};

export const eventToUpdateData = (
  event: Event,
  status: EventStatus
): CreateEventData => {
  const payload: CreateEventData = {
    title: event.title,
    event_type: event.event_type,
    event_date: event.event_date.slice(0, 10),
    start_time: event.start_time.slice(0, 8),
    duration_minutes: Number(event.duration_minutes),
    status,
  };

  if (event.description) {
    payload.description = event.description;
  }

  if (event.banner_url) {
    payload.banner_url = event.banner_url;
  }

  if (event.event_type === 'online' && event.meeting_url) {
    payload.meeting_url = event.meeting_url;
  }

  if (event.event_type === 'offline' && event.location) {
    payload.location = event.location;
  }

  if (event.capacity !== null && event.capacity !== undefined) {
    payload.capacity = Number(event.capacity);
  }

  payload.fee = Number(event.fee);

  return payload;
};

export const eventFormToCreateData = (values: EventFormValues): CreateEventData => {
  const payload: CreateEventData = {
    title: values.title.trim(),
    description: values.description.trim(),
    event_type: values.event_type,
    event_date: values.event_date,
    start_time: values.start_time,
    duration_minutes: Number(values.duration_minutes),
    status: values.status,
    banner_url: values.banner_url.trim() || undefined,
  };

  if (values.event_type === 'online') {
    payload.meeting_url = values.meeting_url.trim();
  } else {
    payload.location = values.location.trim();
  }

  if (values.capacity.trim()) {
    payload.capacity = Number(values.capacity);
  }

  if (values.fee.trim()) {
    payload.fee = Number(values.fee);
  }

  return payload;
};

export const formatEventDate = (date: string): string => {
  const isoDay = date.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) {
    return date;
  }

  const parsed = new Date(`${isoDay}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatEventTime = (time: string): string => {
  if (/^\d{2}:\d{2}/.test(time)) {
    return time.slice(0, 5);
  }

  return time;
};

export const formatEventFee = (fee: number): string => {
  if (fee === 0) {
    return 'Free';
  }

  return `₹${fee}`;
};

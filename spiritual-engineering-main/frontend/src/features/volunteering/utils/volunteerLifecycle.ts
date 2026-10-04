import type { VolunteerOpportunity } from '../types/volunteering.types';
import {
  getEventDateParts,
  getEventTimeParts,
} from '@/features/events/utils/eventLifecycle';

export type VolunteerLifecycleStatus =
  | 'draft'
  | 'upcoming'
  | 'live'
  | 'completed'
  | 'cancelled';

export const getVolunteerLifecycleStatus = (
  opportunity: Pick<
    VolunteerOpportunity,
    'status' | 'event_date' | 'start_time' | 'end_time'
  >,
  now = new Date()
): VolunteerLifecycleStatus => {
  if (opportunity.status === 'draft') {
    return 'draft';
  }

  if (opportunity.status === 'cancelled') {
    return 'cancelled';
  }

  if (opportunity.status === 'completed') {
    return 'completed';
  }

  const { year, month, day } = getEventDateParts(opportunity.event_date);
  const startParts = getEventTimeParts(opportunity.start_time);
  const endParts = getEventTimeParts(opportunity.end_time);

  const start = new Date(
    year,
    month - 1,
    day,
    startParts.hours,
    startParts.minutes,
    startParts.seconds
  );
  const end = new Date(
    year,
    month - 1,
    day,
    endParts.hours,
    endParts.minutes,
    endParts.seconds
  );

  if (now < start) {
    return 'upcoming';
  }

  if (now <= end) {
    return 'live';
  }

  return 'completed';
};

export const canEditVolunteerCoreDetails = (
  opportunity: Pick<
    VolunteerOpportunity,
    'status' | 'event_date' | 'start_time' | 'end_time'
  >,
  now = new Date()
) => {
  const lifecycle = getVolunteerLifecycleStatus(opportunity, now);
  return lifecycle === 'draft' || lifecycle === 'upcoming';
};

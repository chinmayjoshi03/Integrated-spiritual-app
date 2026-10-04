import type {
  CreateVolunteerOpportunityData,
  VolunteerFormErrors,
  VolunteerFormValues,
  VolunteerOpportunity,
} from '../types/volunteering.types';

export const defaultVolunteerFormValues: VolunteerFormValues = {
  title: '',
  description: '',
  category: '',
  banner_url: '',
  volunteer_type: 'offline',
  event_date: '',
  start_time: '',
  end_time: '',
  location: '',
  meeting_url: '',
  capacity: '',
  requirements: '',
  status: 'draft',
};

export const opportunityToFormValues = (
  opportunity: VolunteerOpportunity
): VolunteerFormValues => {
  return {
    title: opportunity.title,
    description: opportunity.description ?? '',
    category: opportunity.category ?? '',
    banner_url: opportunity.banner_url ?? '',
    volunteer_type: opportunity.volunteer_type,
    event_date: opportunity.event_date.slice(0, 10),
    start_time: opportunity.start_time.slice(0, 5),
    end_time: opportunity.end_time.slice(0, 5),
    location: opportunity.location ?? '',
    meeting_url: opportunity.meeting_url ?? '',
    capacity: opportunity.capacity === null ? '' : String(opportunity.capacity),
    requirements: opportunity.requirements ?? '',
    status: opportunity.status,
  };
};

export const validateVolunteerForm = (
  values: VolunteerFormValues
): VolunteerFormErrors => {
  const errors: VolunteerFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required.';
  }

  if (!values.event_date) {
    errors.event_date = 'Date is required.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.event_date)) {
    errors.event_date = 'Date must stay in YYYY-MM-DD format.';
  }

  if (!values.start_time) {
    errors.start_time = 'Start time is required.';
  }

  if (!values.end_time) {
    errors.end_time = 'End time is required.';
  }

  if (
    values.start_time &&
    values.end_time &&
    values.start_time >= values.end_time
  ) {
    errors.end_time = 'End time must be after start time.';
  }

  if (values.volunteer_type === 'online' && !values.meeting_url.trim()) {
    errors.meeting_url = 'Meeting URL is required for online opportunities.';
  }

  if (values.volunteer_type === 'offline' && !values.location.trim()) {
    errors.location = 'Location is required for offline opportunities.';
  }

  if (values.capacity.trim()) {
    const capacity = Number(values.capacity);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      errors.capacity = 'Capacity must be a positive whole number.';
    }
  }

  return errors;
};

export const volunteerFormToCreateData = (
  values: VolunteerFormValues
): CreateVolunteerOpportunityData => {
  const capacity = values.capacity.trim()
    ? Number(values.capacity)
    : null;

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category.trim() || undefined,
    banner_url: values.banner_url.trim() || undefined,
    volunteer_type: values.volunteer_type,
    event_date: values.event_date.slice(0, 10),
    start_time: values.start_time,
    end_time: values.end_time,
    location: values.location.trim() || undefined,
    meeting_url: values.meeting_url.trim() || undefined,
    capacity,
    requirements: values.requirements.trim() || undefined,
    status: values.status,
  };
};

import { useState, type ChangeEvent, type FormEvent } from 'react';

import EventFormField from './EventFormField';
import { uploadEventBanner } from '../services/eventsService';
import type {
  CreateEventData,
  Event,
  EventFormErrors,
  EventFormStatus,
  EventFormValues,
  EventType,
} from '../types/event.types';
import {
  defaultEventFormValues,
  eventFormToCreateData,
  eventToFormValues,
  validateEventForm,
} from '../utils/eventForm';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import './EventForm.css';

interface EventFormProps {
  event?: Event;
  initialValues?: Partial<EventFormValues>;
  submitLabel?: string;
  isSubmitting: boolean;
  serverError?: string;
  onSubmit: (data: CreateEventData) => void | Promise<void>;
  onCancel?: () => void;
}

const EventForm = ({
  event,
  initialValues,
  submitLabel = 'Create Event',
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: EventFormProps) => {
  const [values, setValues] = useState<EventFormValues>({
    ...defaultEventFormValues,
    ...(event ? eventToFormValues(event) : {}),
    ...initialValues,
  });
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState('');

  const updateField = <K extends keyof EventFormValues>(
    field: K,
    value: EventFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleInputChange =
    (field: keyof EventFormValues) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateField(field, e.target.value);
    };

  const handleBannerChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file || isSubmitting) {
      return;
    }

    setBannerUploading(true);
    setBannerError('');

    try {
      const url = await uploadEventBanner(file);
      updateField('banner_url', url);
    } catch (err) {
      setBannerError(getApiErrorMessage(err, 'Unable to upload this image.'));
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateEventForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(eventFormToCreateData(values));
  };

  return (
    <form className="event-form" onSubmit={handleSubmit} noValidate>
      {serverError ? (
        <p className="event-form-server-error" role="alert">
          {serverError}
        </p>
      ) : null}

      <EventFormField id="title" label="Title" required error={errors.title}>
        <input
          id="title"
          className={
            errors.title
              ? 'event-form-input event-form-input-error'
              : 'event-form-input'
          }
          value={values.title}
          onChange={handleInputChange('title')}
          disabled={isSubmitting}
        />
      </EventFormField>

      <EventFormField
        id="description"
        label="Description"
        required
        error={errors.description}
      >
        <textarea
          id="description"
          className={
            errors.description
              ? 'event-form-textarea event-form-textarea-error'
              : 'event-form-textarea'
          }
          value={values.description}
          onChange={handleInputChange('description')}
          disabled={isSubmitting}
        />
      </EventFormField>

      <EventFormField
        id="event_type"
        label="Event type"
        required
        error={errors.event_type}
      >
        <div id="event_type" className="event-form-toggle" role="group">
          {(['online', 'offline'] as EventType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={
                values.event_type === type
                  ? 'event-form-toggle-btn event-form-toggle-btn-active'
                  : 'event-form-toggle-btn'
              }
              onClick={() => updateField('event_type', type)}
              disabled={isSubmitting}
            >
              {type === 'online' ? 'Online' : 'Offline'}
            </button>
          ))}
        </div>
      </EventFormField>

      <div className="event-form-grid">
        <EventFormField
          id="event_date"
          label="Event date"
          required
          error={errors.event_date}
        >
          <input
            id="event_date"
            type="date"
            className={
              errors.event_date
                ? 'event-form-input event-form-input-error'
                : 'event-form-input'
            }
            value={values.event_date}
            onChange={handleInputChange('event_date')}
            disabled={isSubmitting}
          />
        </EventFormField>

        <EventFormField
          id="start_time"
          label="Start time"
          required
          error={errors.start_time}
        >
          <input
            id="start_time"
            type="time"
            className={
              errors.start_time
                ? 'event-form-input event-form-input-error'
                : 'event-form-input'
            }
            value={values.start_time}
            onChange={handleInputChange('start_time')}
            disabled={isSubmitting}
          />
        </EventFormField>

        <div className="event-form-span-2">
          <EventFormField
            id="duration_minutes"
            label="Duration (minutes)"
            required
            error={errors.duration_minutes}
          >
            <input
              id="duration_minutes"
              type="number"
              min="1"
              className={
                errors.duration_minutes
                  ? 'event-form-input event-form-input-error'
                  : 'event-form-input'
              }
              value={values.duration_minutes}
              onChange={handleInputChange('duration_minutes')}
              disabled={isSubmitting}
            />
          </EventFormField>
        </div>
      </div>

      {values.event_type === 'online' ? (
        <EventFormField
          id="meeting_url"
          label="Meeting URL"
          required
          error={errors.meeting_url}
        >
          <input
            id="meeting_url"
            type="url"
            placeholder="https://"
            className={
              errors.meeting_url
                ? 'event-form-input event-form-input-error'
                : 'event-form-input'
            }
            value={values.meeting_url}
            onChange={handleInputChange('meeting_url')}
            disabled={isSubmitting}
          />
        </EventFormField>
      ) : (
        <EventFormField
          id="location"
          label="Location"
          required
          error={errors.location}
        >
          <input
            id="location"
            className={
              errors.location
                ? 'event-form-input event-form-input-error'
                : 'event-form-input'
            }
            value={values.location}
            onChange={handleInputChange('location')}
            disabled={isSubmitting}
          />
        </EventFormField>
      )}

      <EventFormField
        id="banner"
        label="Event banner"
        error={errors.banner_url}
        hint="Optional PNG, JPG, JPEG, or WebP image."
      >
        {values.banner_url ? (
          <div className="event-form-banner-preview">
            <img src={values.banner_url} alt="" />
            <button
              type="button"
              className="event-form-cancel"
              onClick={() => updateField('banner_url', '')}
              disabled={isSubmitting || bannerUploading}
            >
              Remove image
            </button>
          </div>
        ) : null}
        <input
          id="banner"
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          className="event-form-input"
          onChange={(e) => {
            void handleBannerChange(e);
          }}
          disabled={isSubmitting || bannerUploading}
        />
        {bannerUploading ? <p className="event-form-hint">Uploading image...</p> : null}
        {bannerError ? <p className="event-form-server-error">{bannerError}</p> : null}
      </EventFormField>

      <div className="event-form-grid">
        <EventFormField
          id="capacity"
          label="Capacity"
          error={errors.capacity}
          hint="Leave blank for unlimited."
        >
          <input
            id="capacity"
            type="number"
            min="1"
            className={
              errors.capacity
                ? 'event-form-input event-form-input-error'
                : 'event-form-input'
            }
            value={values.capacity}
            onChange={handleInputChange('capacity')}
            disabled={isSubmitting}
          />
        </EventFormField>

        <EventFormField id="fee" label="Fee" error={errors.fee} hint="Leave blank or 0 for free.">
          <input
            id="fee"
            type="number"
            min="0"
            step="0.01"
            className={
              errors.fee
                ? 'event-form-input event-form-input-error'
                : 'event-form-input'
            }
            value={values.fee}
            onChange={handleInputChange('fee')}
            disabled={isSubmitting}
          />
        </EventFormField>
      </div>

      <EventFormField id="status" label="Status" required error={errors.status}>
        <div id="status" className="event-form-toggle" role="group">
          {(['draft', 'published'] as EventFormStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              className={
                values.status === status
                  ? 'event-form-toggle-btn event-form-toggle-btn-active'
                  : 'event-form-toggle-btn'
              }
              onClick={() => updateField('status', status)}
              disabled={isSubmitting}
            >
              {status === 'draft' ? 'Draft' : 'Published'}
            </button>
          ))}
        </div>
      </EventFormField>

      <div className="event-form-actions">
        {onCancel ? (
          <button
            type="button"
            className="event-form-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        ) : null}

        <button type="submit" className="event-form-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default EventForm;

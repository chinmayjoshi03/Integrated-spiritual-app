import { useState, type ChangeEvent, type FormEvent } from 'react';

import VolunteerFormField from './VolunteerFormField';
import { uploadVolunteerBanner } from '../services/volunteeringService';
import type {
  CreateVolunteerOpportunityData,
  VolunteerFormErrors,
  VolunteerFormValues,
  VolunteerOpportunity,
  VolunteerType,
} from '../types/volunteering.types';
import {
  defaultVolunteerFormValues,
  opportunityToFormValues,
  validateVolunteerForm,
  volunteerFormToCreateData,
} from '../utils/volunteerForm';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import '@/features/events/components/EventForm.css';

interface VolunteerFormProps {
  opportunity?: VolunteerOpportunity;
  submitLabel?: string;
  isSubmitting: boolean;
  serverError?: string;
  onSubmit: (data: CreateVolunteerOpportunityData) => void | Promise<void>;
  onCancel?: () => void;
}

const VolunteerForm = ({
  opportunity,
  submitLabel = 'Create opportunity',
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: VolunteerFormProps) => {
  const [values, setValues] = useState<VolunteerFormValues>({
    ...defaultVolunteerFormValues,
    ...(opportunity ? opportunityToFormValues(opportunity) : {}),
  });
  const [errors, setErrors] = useState<VolunteerFormErrors>({});
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState('');

  const updateField = <K extends keyof VolunteerFormValues>(
    field: K,
    value: VolunteerFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleInputChange =
    (field: keyof VolunteerFormValues) =>
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
      const url = await uploadVolunteerBanner(file);
      updateField('banner_url', url);
    } catch (err) {
      setBannerError(getApiErrorMessage(err, 'Unable to upload this image.'));
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting || bannerUploading) {
      return;
    }

    const nextErrors = validateVolunteerForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(volunteerFormToCreateData(values));
  };

  return (
    <form className="event-form" onSubmit={handleSubmit} noValidate>
      {serverError ? (
        <p className="event-form-server-error" role="alert">
          {serverError}
        </p>
      ) : null}

      <VolunteerFormField id="title" label="Title" required error={errors.title}>
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
      </VolunteerFormField>

      <VolunteerFormField
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
      </VolunteerFormField>

      <div className="event-form-grid">
        <VolunteerFormField id="category" label="Category" error={errors.category}>
          <input
            id="category"
            className="event-form-input"
            value={values.category}
            onChange={handleInputChange('category')}
            disabled={isSubmitting}
            placeholder="Seva, kitchen, greeter..."
          />
        </VolunteerFormField>

        <VolunteerFormField
          id="volunteer_type"
          label="Online / Offline"
          required
          error={errors.volunteer_type}
        >
          <div id="volunteer_type" className="event-form-toggle" role="group">
            {(['offline', 'online'] as VolunteerType[]).map((type) => (
              <button
                key={type}
                type="button"
                className={
                  values.volunteer_type === type
                    ? 'event-form-toggle-btn event-form-toggle-btn-active'
                    : 'event-form-toggle-btn'
                }
                onClick={() => updateField('volunteer_type', type)}
                disabled={isSubmitting}
              >
                {type === 'online' ? 'Online' : 'Offline'}
              </button>
            ))}
          </div>
        </VolunteerFormField>
      </div>

      <VolunteerFormField
        id="banner"
        label="Banner"
        error={bannerError}
        hint="PNG, JPG, or WebP. Maximum 5 MB."
      >
        {values.banner_url ? (
          <div className="event-form-banner-preview">
            <img src={values.banner_url} alt="Opportunity banner preview" />
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
      </VolunteerFormField>

      <div className="event-form-grid">
        <VolunteerFormField
          id="event_date"
          label="Date"
          required
          error={errors.event_date}
        >
          <input
            id="event_date"
            type="date"
            className="event-form-input"
            value={values.event_date}
            onChange={handleInputChange('event_date')}
            disabled={isSubmitting}
          />
        </VolunteerFormField>

        <VolunteerFormField id="capacity" label="Capacity" error={errors.capacity}>
          <input
            id="capacity"
            type="number"
            min={1}
            className="event-form-input"
            value={values.capacity}
            onChange={handleInputChange('capacity')}
            disabled={isSubmitting}
            placeholder="Unlimited if empty"
          />
        </VolunteerFormField>

        <VolunteerFormField
          id="start_time"
          label="Start time"
          required
          error={errors.start_time}
        >
          <input
            id="start_time"
            type="time"
            className="event-form-input"
            value={values.start_time}
            onChange={handleInputChange('start_time')}
            disabled={isSubmitting}
          />
        </VolunteerFormField>

        <VolunteerFormField
          id="end_time"
          label="End time"
          required
          error={errors.end_time}
        >
          <input
            id="end_time"
            type="time"
            className="event-form-input"
            value={values.end_time}
            onChange={handleInputChange('end_time')}
            disabled={isSubmitting}
          />
        </VolunteerFormField>
      </div>

      {values.volunteer_type === 'offline' ? (
        <VolunteerFormField
          id="location"
          label="Location"
          required
          error={errors.location}
        >
          <input
            id="location"
            className="event-form-input"
            value={values.location}
            onChange={handleInputChange('location')}
            disabled={isSubmitting}
          />
        </VolunteerFormField>
      ) : (
        <VolunteerFormField
          id="meeting_url"
          label="Meeting URL"
          required
          error={errors.meeting_url}
        >
          <input
            id="meeting_url"
            className="event-form-input"
            value={values.meeting_url}
            onChange={handleInputChange('meeting_url')}
            disabled={isSubmitting}
          />
        </VolunteerFormField>
      )}

      <VolunteerFormField
        id="requirements"
        label="Requirements"
        error={errors.requirements}
      >
        <textarea
          id="requirements"
          className="event-form-textarea"
          value={values.requirements}
          onChange={handleInputChange('requirements')}
          disabled={isSubmitting}
        />
      </VolunteerFormField>

      {values.status === 'draft' || values.status === 'published' ? (
        <VolunteerFormField id="status" label="Status">
          <div id="status" className="event-form-toggle" role="group">
            {(['draft', 'published'] as const).map((status) => (
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
                {status === 'draft' ? 'Save as draft' : 'Publish'}
              </button>
            ))}
          </div>
        </VolunteerFormField>
      ) : null}

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
        <button
          type="submit"
          className="event-form-submit"
          disabled={isSubmitting || bannerUploading}
        >
          {bannerUploading ? 'Uploading banner...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default VolunteerForm;

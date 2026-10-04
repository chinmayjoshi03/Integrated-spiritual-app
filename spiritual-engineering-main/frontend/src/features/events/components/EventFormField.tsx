import type { ReactNode } from 'react';

interface EventFormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

const EventFormField = ({
  id,
  label,
  error,
  required = false,
  hint,
  children,
}: EventFormFieldProps) => {
  return (
    <div className="event-form-field">
      <label htmlFor={id} className="event-form-label">
        {label}
        {required ? <span className="event-form-required"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="event-form-hint">{hint}</p> : null}
      {error ? (
        <p className="event-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default EventFormField;

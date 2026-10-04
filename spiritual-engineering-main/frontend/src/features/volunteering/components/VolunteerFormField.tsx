import type { ReactNode } from 'react';

interface VolunteerFormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

const VolunteerFormField = ({
  id,
  label,
  error,
  required = false,
  hint,
  children,
}: VolunteerFormFieldProps) => {
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

export default VolunteerFormField;

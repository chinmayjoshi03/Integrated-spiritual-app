import { useState, type FormEvent } from 'react';

interface MentorReplyFormProps {
  isSubmitting: boolean;
  error: string;
  onSubmit: (content: string) => Promise<void>;
}

const MentorReplyForm = ({
  isSubmitting,
  error,
  onSubmit,
}: MentorReplyFormProps) => {
  const [content, setContent] = useState('');
  const [validation, setValidation] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!content.trim()) {
      setValidation('Please write a reply before sharing.');
      return;
    }

    setValidation('');
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch {
      return;
    }
  };

  return (
    <form className="community-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <h2 className="community-section-title">Share an answer</h2>
      <p className="community-section-copy">
        Anyone in this community can answer. Mentors are highlighted with a badge.
      </p>
      <label className="community-label" htmlFor="community-reply">
        Answer
      </label>
      <textarea
        id="community-reply"
        className="community-textarea"
        value={content}
        maxLength={5000}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting}
      />
      {validation ? <p className="community-error">{validation}</p> : null}
      {error ? <p className="community-error">{error}</p> : null}
      <button type="submit" className="community-primary-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Sharing...' : 'Share reply'}
      </button>
    </form>
  );
};

export default MentorReplyForm;

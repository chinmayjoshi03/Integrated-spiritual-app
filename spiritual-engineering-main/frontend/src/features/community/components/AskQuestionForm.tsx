import { useState, type FormEvent } from 'react';

interface AskQuestionFormProps {
  isSubmitting: boolean;
  error: string;
  onSubmit: (title: string, content: string) => Promise<void>;
}

const AskQuestionForm = ({
  isSubmitting,
  error,
  onSubmit,
}: AskQuestionFormProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [validation, setValidation] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!title.trim() || !content.trim()) {
      setValidation('Please share both a title and your question.');
      return;
    }

    setValidation('');
    try {
      await onSubmit(title.trim(), content.trim());
      setTitle('');
      setContent('');
    } catch {
      return;
    }
  };

  return (
    <form className="community-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <h2 className="community-section-title">Ask the circle</h2>
      <p className="community-section-copy">
        Offer a sincere question for the circle. Anyone in the community may answer.
      </p>
      <label className="community-label" htmlFor="question-title">
        Title
      </label>
      <input
        id="question-title"
        className="community-input"
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isSubmitting}
      />
      <label className="community-label" htmlFor="question-content">
        Question
      </label>
      <textarea
        id="question-content"
        className="community-textarea"
        value={content}
        maxLength={5000}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting}
      />
      {validation ? <p className="community-error">{validation}</p> : null}
      {error ? <p className="community-error">{error}</p> : null}
      <button type="submit" className="community-primary-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Sharing...' : 'Share question'}
      </button>
    </form>
  );
};

export default AskQuestionForm;

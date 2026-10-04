import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import NotificationAppShell from '@/features/notifications/components/NotificationAppShell';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import type { HelpCategory, SupportPriority } from '../types/help.types';
import { getHelpCategories } from '../services/helpService';
import { createSupportTicket } from '../services/supportService';
import './help.css';

const CreateSupportPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<SupportPriority>('normal');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void getHelpCategories()
      .then(setCategories)
      .catch((err) => setError(getApiErrorMessage(err, 'Unable to load categories.')));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const ticket = await createSupportTicket({
        subject,
        description,
        category_id: categoryId ? Number(categoryId) : null,
        priority,
      });
      navigate(`/my-support/${ticket.id}`, { state: { notice: 'Support request created.' } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to create this support request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NotificationAppShell>
      <Link to="/my-support" className="help-inline-btn">
        <ArrowLeft size={16} /> Back to My Support
      </Link>
      <DashboardHeader title="Create Support Request" subtitle="Share what you need help with." />
      {error ? <p className="help-error">{error}</p> : null}
      <form className="support-form" onSubmit={(event) => void handleSubmit(event)}>
        <label>
          Subject
          <input value={subject} onChange={(event) => setSubject(event.target.value)} required />
        </label>
        <label>
          Category
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as SupportPriority)}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label>
          Description
          <textarea
            rows={7}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="help-primary-btn" disabled={submitting}>
          {submitting ? 'Sending…' : 'Submit request'}
        </button>
      </form>
    </NotificationAppShell>
  );
};

export default CreateSupportPage;

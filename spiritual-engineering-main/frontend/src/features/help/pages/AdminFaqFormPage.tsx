import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import AdminEventsShell from '@/features/events/components/AdminEventsShell';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import type { HelpCategory } from '../types/help.types';
import {
  createAdminFaq,
  getAdminFaq,
  getHelpCategories,
  updateAdminFaq,
} from '../services/helpService';
import './help.css';

const AdminFaqFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [keywords, setKeywords] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getHelpCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    void getAdminFaq(Number(id))
      .then((faq) => {
        setQuestion(faq.question);
        setAnswer(faq.answer);
        setCategoryId(faq.category_id ? String(faq.category_id) : '');
        setKeywords(faq.search_keywords || '');
        setDisplayOrder(String(faq.display_order ?? 0));
        setStatus(faq.status === 'published' ? 'published' : 'draft');
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Unable to load this FAQ.')));
  }, [id, isEdit]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      question,
      answer,
      category_id: categoryId ? Number(categoryId) : null,
      search_keywords: keywords,
      display_order: Number(displayOrder) || 0,
      status,
    };
    try {
      if (isEdit && id) {
        await updateAdminFaq(Number(id), payload);
      } else {
        await createAdminFaq(payload);
      }
      navigate('/admin/helpdesk/faqs');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to save this FAQ.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminEventsShell>
      <Link to="/admin/helpdesk/faqs" className="help-inline-btn">
        <ArrowLeft size={16} /> Back to FAQs
      </Link>
      <DashboardHeader
        title={isEdit ? 'Edit FAQ' : 'Create FAQ'}
        subtitle="Published answers are used by the Help Assistant."
      />
      {error ? <p className="help-error">{error}</p> : null}
      <form className="admin-faq-form support-form" onSubmit={(event) => void handleSubmit(event)}>
        <label>
          Question
          <input value={question} onChange={(event) => setQuestion(event.target.value)} required />
        </label>
        <label>
          Answer
          <textarea rows={7} value={answer} onChange={(event) => setAnswer(event.target.value)} required />
        </label>
        <label>
          Category
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Uncategorised</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Search keywords
          <input value={keywords} onChange={(event) => setKeywords(event.target.value)} />
        </label>
        <label>
          Display order
          <input
            type="number"
            min={0}
            value={displayOrder}
            onChange={(event) => setDisplayOrder(event.target.value)}
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'draft' | 'published')}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <button type="submit" className="help-primary-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save FAQ'}
        </button>
      </form>
    </AdminEventsShell>
  );
};

export default AdminFaqFormPage;

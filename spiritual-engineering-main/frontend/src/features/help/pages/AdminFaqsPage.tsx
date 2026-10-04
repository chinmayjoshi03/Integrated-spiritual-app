import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import AdminEventsShell from '@/features/events/components/AdminEventsShell';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import type { HelpCategory, HelpFaq } from '../types/help.types';
import { deleteAdminFaq, getAdminFaqs, getHelpCategories, updateAdminFaq } from '../services/helpService';
import './help.css';

const AdminFaqsPage = () => {
  const [faqs, setFaqs] = useState<HelpFaq[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setFaqs(
        await getAdminFaqs({
          search: search || undefined,
          category: category || undefined,
          status: status || undefined,
        })
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load FAQs.'));
    }
  }, [search, category, status]);

  useEffect(() => {
    void getHelpCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const toggleStatus = async (faq: HelpFaq) => {
    try {
      const updated = await updateAdminFaq(faq.id, {
        status: faq.status === 'published' ? 'draft' : 'published',
      });
      setFaqs((current) => current.map((item) => (item.id === faq.id ? { ...item, ...updated } : item)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update this FAQ.'));
    }
  };

  const removeFaq = async (faq: HelpFaq) => {
    try {
      await deleteAdminFaq(faq.id);
      setFaqs((current) => current.filter((item) => item.id !== faq.id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to remove this FAQ.'));
    }
  };

  return (
    <AdminEventsShell>
      <DashboardHeader title="Help FAQs" subtitle="Publish answers the Help Assistant can use." />
      <div className="support-toolbar">
        <Link to="/admin/helpdesk" className="help-inline-btn">
          Back to Help Desk
        </Link>
        <Link to="/admin/helpdesk/faqs/create" className="help-primary-btn">
          <Plus size={16} /> Create FAQ
        </Link>
      </div>
      <div className="support-filters">
        <input
          type="search"
          placeholder="Search FAQs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      {error ? <p className="help-error">{error}</p> : null}
      {!error && faqs.length === 0 ? <p className="help-state">No FAQs match these filters.</p> : null}
      <div className="support-list">
        {faqs.map((faq) => (
          <article key={faq.id} className="support-card">
            <strong>{faq.question}</strong>
            <span className="support-meta">
              {faq.category_name || 'Uncategorised'} · {faq.status}
            </span>
            <div className="support-filters">
              <Link to={`/admin/helpdesk/faqs/${faq.id}/edit`} className="help-inline-btn">
                Edit
              </Link>
              <button type="button" className="help-inline-btn" onClick={() => void toggleStatus(faq)}>
                {faq.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button type="button" className="help-inline-btn" onClick={() => void removeFaq(faq)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </AdminEventsShell>
  );
};

export default AdminFaqsPage;

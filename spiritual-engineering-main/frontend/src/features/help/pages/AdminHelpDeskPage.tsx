import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AdminEventsShell from '@/features/events/components/AdminEventsShell';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import type { HelpCategory, SupportOverview, SupportTicket } from '../types/help.types';
import { getHelpCategories } from '../services/helpService';
import { getAdminSupportOverview, getAdminSupportTickets } from '../services/supportService';
import { formatRelativeTime, priorityLabel, statusLabel } from '../utils/helpFormat';
import './help.css';

const AdminHelpDeskPage = () => {
  const [overview, setOverview] = useState<SupportOverview | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    try {
      const [stats, rows] = await Promise.all([
        getAdminSupportOverview(),
        getAdminSupportTickets({
          status: status || undefined,
          priority: priority || undefined,
          category: category || undefined,
          search: search || undefined,
        }),
      ]);
      setOverview(stats);
      setTickets(rows);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load the help desk.'));
    } finally {
      setLoading(false);
    }
  }, [status, priority, category, search]);

  useEffect(() => {
    void getHelpCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <AdminEventsShell>
      <DashboardHeader title="Help Desk" subtitle="Support requests and knowledge base." />
      <div className="support-toolbar">
        <Link to="/admin/helpdesk/faqs" className="help-inline-btn">
          Manage FAQs
        </Link>
      </div>
      {overview ? (
        <div className="help-overview-grid">
          <article>
            <strong>{overview.open_count}</strong>
            <span>Open</span>
          </article>
          <article>
            <strong>{overview.in_progress_count}</strong>
            <span>In Progress</span>
          </article>
          <article>
            <strong>{overview.waiting_for_user_count}</strong>
            <span>Waiting for User</span>
          </article>
          <article>
            <strong>{overview.resolved_count}</strong>
            <span>Resolved</span>
          </article>
          <article>
            <strong>{overview.high_urgent_count}</strong>
            <span>High / Urgent</span>
          </article>
        </div>
      ) : null}
      <div className="support-filters">
        <input
          type="search"
          placeholder="Search ticket, subject, or name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_for_user">Waiting for User</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      {loading ? <p className="help-state">Loading support requests…</p> : null}
      {error ? <p className="help-error">{error}</p> : null}
      {!loading && !error && tickets.length === 0 ? (
        <p className="help-state">No support requests match these filters.</p>
      ) : null}
      <div className="support-list">
        {tickets.map((ticket) => (
          <Link key={ticket.id} to={`/admin/helpdesk/tickets/${ticket.id}`} className="support-card">
            <span className="support-meta">{ticket.ticket_number}</span>
            <strong>{ticket.subject}</strong>
            <span className="support-meta">
              {ticket.user_name} · {ticket.category_name || 'General'} · {priorityLabel(ticket.priority)} ·{' '}
              {statusLabel(ticket.status)}
            </span>
            <span className="support-meta">
              Updated {formatRelativeTime(ticket.updated_at)} · Created {formatRelativeTime(ticket.created_at)}
            </span>
          </Link>
        ))}
      </div>
    </AdminEventsShell>
  );
};

export default AdminHelpDeskPage;

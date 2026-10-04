import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Plus } from 'lucide-react';

import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import NotificationAppShell from '@/features/notifications/components/NotificationAppShell';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import type { SupportStatus, SupportTicket } from '../types/help.types';
import { getMySupportTickets } from '../services/supportService';
import { formatRelativeTime, statusLabel } from '../utils/helpFormat';
import './help.css';

const FILTERS: { id: '' | SupportStatus; label: string }[] = [
  { id: '', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'waiting_for_user', label: 'Waiting for User' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
];

const MySupportPage = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [status, setStatus] = useState<'' | SupportStatus>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTickets(await getMySupportTickets(status || undefined));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load your support requests.'));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <NotificationAppShell>
      <DashboardHeader title="My Support Requests" subtitle="Follow conversations with the support team." />
      <div className="support-toolbar">
        <div className="support-filters" role="tablist">
          {FILTERS.map((item) => (
            <button
              key={item.id || 'all'}
              type="button"
              className={status === item.id ? 'help-primary-btn' : 'help-inline-btn'}
              onClick={() => setStatus(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Link to="/my-support/new" className="help-primary-btn">
          <Plus size={16} /> Create Support Request
        </Link>
      </div>
      {loading ? <p className="help-state">Loading your requests…</p> : null}
      {error ? <p className="help-error">{error}</p> : null}
      {!loading && !error && tickets.length === 0 ? (
        <div className="help-support-banner">
          <div>
            <LifeBuoy size={22} />
            <h2>No support requests yet</h2>
            <p>If the Help Centre does not answer your question, send a request here.</p>
          </div>
          <Link to="/my-support/new" className="help-primary-btn">
            Create Support Request
          </Link>
        </div>
      ) : null}
      <div className="support-list">
        {tickets.map((ticket) => (
          <Link key={ticket.id} to={`/my-support/${ticket.id}`} className="support-card">
            <span className="support-meta">{ticket.ticket_number}</span>
            <strong>{ticket.subject}</strong>
            <span className="support-meta">
              {ticket.category_name || 'General'} · {statusLabel(ticket.status)}
            </span>
            <span className="support-meta">Updated {formatRelativeTime(ticket.updated_at)}</span>
          </Link>
        ))}
      </div>
    </NotificationAppShell>
  );
};

export default MySupportPage;

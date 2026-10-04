import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import NotificationAppShell from '@/features/notifications/components/NotificationAppShell';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import type { SupportTicket } from '../types/help.types';
import {
  getMySupportTicket,
  reopenMySupportTicket,
  replyMySupportTicket,
} from '../services/supportService';
import { formatRelativeTime, priorityLabel, relatedEntityLabel, statusLabel } from '../utils/helpFormat';
import './help.css';

const SupportTicketPage = () => {
  const { id } = useParams();
  const ticketId = Number(id);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      setError('This support request could not be found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setTicket(await getMySupportTicket(ticketId));
    } catch (err) {
      setTicket(null);
      setError(getApiErrorMessage(err, 'Unable to load this support request.'));
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticket) return;
    setSending(true);
    try {
      setTicket(await replyMySupportTicket(ticket.id, message));
      setMessage('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to send this reply.'));
    } finally {
      setSending(false);
    }
  };

  const handleReopen = async () => {
    if (!ticket) return;
    try {
      setTicket(await reopenMySupportTicket(ticket.id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to reopen this request.'));
    }
  };

  const canReply = ticket && !['resolved', 'closed'].includes(ticket.status);

  return (
    <NotificationAppShell>
      <Link to="/my-support" className="help-inline-btn">
        <ArrowLeft size={16} /> Back to My Support
      </Link>
      {loading ? <p className="help-state">Loading conversation…</p> : null}
      {error ? <p className="help-error">{error}</p> : null}
      {ticket ? (
        <>
          <DashboardHeader title={ticket.subject} subtitle={ticket.ticket_number} />
          <p className="support-thread-meta">
            {ticket.category_name || 'General'} · {statusLabel(ticket.status)} ·{' '}
            {priorityLabel(ticket.priority)} · Created {formatRelativeTime(ticket.created_at)}
            {ticket.related_entity_type
              ? ` · Related ${relatedEntityLabel(ticket.related_entity_type)} #${ticket.related_entity_id}`
              : ''}
          </p>
          <div className="support-thread">
            {(ticket.messages || []).map((item) => (
              <article
                key={item.id}
                className={`support-message${item.sender_role === 'admin' ? ' is-admin' : ''}`}
              >
                <strong>
                  {item.sender_role === 'admin' ? 'Support' : item.sender_name || 'You'}
                </strong>
                <p>{item.message}</p>
                <span className="support-meta">{formatRelativeTime(item.created_at)}</span>
              </article>
            ))}
          </div>
          {canReply ? (
            <form className="support-form" onSubmit={(event) => void handleReply(event)}>
              <label>
                Reply
                <textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} required />
              </label>
              <button type="submit" className="help-primary-btn" disabled={sending}>
                {sending ? 'Sending…' : 'Send reply'}
              </button>
            </form>
          ) : (
            <button type="button" className="help-inline-btn" onClick={() => void handleReopen()}>
              Reopen request
            </button>
          )}
        </>
      ) : null}
    </NotificationAppShell>
  );
};

export default SupportTicketPage;

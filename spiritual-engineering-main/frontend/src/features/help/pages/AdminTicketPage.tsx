import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import AdminEventsShell from '@/features/events/components/AdminEventsShell';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import type { SupportPriority, SupportStatus, SupportTicket } from '../types/help.types';
import {
  getAdminSupportTicket,
  replyAdminSupportTicket,
  updateAdminSupportTicket,
} from '../services/supportService';
import { formatRelativeTime, priorityLabel, relatedEntityLabel, statusLabel } from '../utils/helpFormat';
import './help.css';

const AdminTicketPage = () => {
  const { id } = useParams();
  const ticketId = Number(id);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setTicket(await getAdminSupportTicket(ticketId));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load this support request.'));
    }
  }, [ticketId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticket) return;
    setSending(true);
    setError('');
    try {
      setTicket(await replyAdminSupportTicket(ticket.id, message));
      setMessage('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to send this reply.'));
    } finally {
      setSending(false);
    }
  };

  const handleUpdate = async (payload: { status?: SupportStatus; priority?: SupportPriority }) => {
    if (!ticket) return;
    try {
      setTicket(await updateAdminSupportTicket(ticket.id, payload));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update this request.'));
    }
  };

  return (
    <AdminEventsShell>
      <Link to="/admin/helpdesk" className="help-inline-btn">
        <ArrowLeft size={16} /> Back to Help Desk
      </Link>
      {error ? <p className="help-error">{error}</p> : null}
      {!ticket && !error ? <p className="help-state">Loading conversation…</p> : null}
      {ticket ? (
        <>
          <DashboardHeader title={ticket.subject} subtitle={ticket.ticket_number} />
          <p className="support-thread-meta">
            {ticket.user_name} ({ticket.user_email}) · {ticket.category_name || 'General'} ·{' '}
            {statusLabel(ticket.status)} · {priorityLabel(ticket.priority)}
            {ticket.related_entity_type
              ? ` · ${relatedEntityLabel(ticket.related_entity_type)} #${ticket.related_entity_id}`
              : ''}
            {' · '}
            Updated {formatRelativeTime(ticket.updated_at)}
          </p>
          <div className="support-filters">
            <select
              value={ticket.status}
              onChange={(event) => void handleUpdate({ status: event.target.value as SupportStatus })}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_for_user">Waiting for User</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={ticket.priority}
              onChange={(event) => void handleUpdate({ priority: event.target.value as SupportPriority })}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="support-thread">
            {(ticket.messages || []).map((item) => (
              <article
                key={item.id}
                className={`support-message${item.sender_role === 'admin' ? ' is-admin' : ''}`}
              >
                <strong>
                  {item.sender_role === 'admin' ? 'Support' : item.sender_name || 'Participant'}
                </strong>
                <p>{item.message}</p>
                <span className="support-meta">{formatRelativeTime(item.created_at)}</span>
              </article>
            ))}
          </div>
          <form className="support-form" onSubmit={(event) => void handleReply(event)}>
            <label>
              Reply
              <textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} required />
            </label>
            <button type="submit" className="help-primary-btn" disabled={sending}>
              {sending ? 'Sending…' : 'Send reply'}
            </button>
          </form>
        </>
      ) : null}
    </AdminEventsShell>
  );
};

export default AdminTicketPage;

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';

import AdminConfirmDialog from '../components/AdminConfirmDialog';
import AdminEventList from '../components/AdminEventList';
import AdminEventsShell from '../components/AdminEventsShell';
import type { AdminEventAction } from '../components/AdminEventCard';
import {
  cancelEvent,
  deleteEvent,
  getAdminEvents,
  updateEvent,
} from '../services/eventsService';
import type { Event, EventStatus } from '../types/event.types';
import { eventToUpdateData } from '../utils/eventForm';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import './AdminEventsPage.css';

type StatusFilter = 'all' | EventStatus;

interface AdminEventsLocationState {
  notice?: string;
}

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'cancelled', label: 'Cancelled' },
];

const AdminEventsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [busyEventId, setBusyEventId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<AdminEventAction | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<
    { type: 'cancel' | 'delete'; event: Event } | null
  >(null);

  const loadEvents = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      const data = await getAdminEvents();
      setEvents(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load events.'));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const state = location.state as AdminEventsLocationState | null;
    if (state?.notice) {
      setNotice(state.notice);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const filteredEvents = useMemo(() => {
    if (statusFilter === 'all') {
      return events;
    }

    return events.filter((event) => event.status === statusFilter);
  }, [events, statusFilter]);

  const runEventAction = async (
    event: Event,
    action: AdminEventAction,
    successMessage: string,
    request: () => Promise<unknown>
  ) => {
    if (busyEventId !== null) {
      return;
    }

    setBusyEventId(event.id);
    setBusyAction(action);
    setActionError('');
    setNotice('');

    try {
      await request();
      setNotice(successMessage);
      await loadEvents(true);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to update this event.'));
    } finally {
      setBusyEventId(null);
      setBusyAction(null);
    }
  };

  const handlePublish = (event: Event) => {
    void runEventAction(event, 'publish', 'Event published successfully.', () =>
      updateEvent(event.id, eventToUpdateData(event, 'published'))
    );
  };

  const handleUnpublish = (event: Event) => {
    void runEventAction(event, 'unpublish', 'Event unpublished successfully.', () =>
      updateEvent(event.id, eventToUpdateData(event, 'draft'))
    );
  };

  const handleConfirm = async () => {
    if (!pendingConfirm) {
      return;
    }

    const { type, event } = pendingConfirm;

    if (type === 'cancel') {
      await runEventAction(event, 'cancel', 'Event cancelled successfully.', () =>
        cancelEvent(event.id)
      );
    } else {
      await runEventAction(event, 'delete', 'Event deleted permanently.', () =>
        deleteEvent(event.id)
      );
    }

    setPendingConfirm(null);
  };

  const emptyFilterLabel =
    statusFilter === 'all'
      ? 'No events yet'
      : `No ${statusFilter} events`;

  return (
    <AdminEventsShell>
      <div className="admin-events-toolbar">
        <div>
          <p className="admin-events-kicker">Admin</p>
          <h1 className="admin-events-title">Events Management</h1>
          <p className="admin-events-description">
            Create and oversee spiritual gatherings, workshops, and sessions.
            Mentors cannot create or manage events.
          </p>
        </div>

        <Link to="/admin/events/create" className="admin-events-create-btn">
          <Plus size={18} />
          Create Event
        </Link>
      </div>

      {notice ? (
        <div className="admin-events-notice" role="status">
          <p>{notice}</p>
          <button
            type="button"
            className="admin-events-notice-dismiss"
            onClick={() => setNotice('')}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="admin-events-notice admin-events-notice-error" role="alert">
          <p>{actionError}</p>
          <button
            type="button"
            className="admin-events-notice-dismiss"
            onClick={() => setActionError('')}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="admin-events-filters" role="tablist" aria-label="Filter events by status">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={statusFilter === filter.id}
              className={
                statusFilter === filter.id
                  ? 'admin-events-filter admin-events-filter-active'
                  : 'admin-events-filter'
              }
              onClick={() => setStatusFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="admin-events-state">
          <p className="admin-events-state-text">Loading events...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="admin-events-state">
          <h2 className="admin-events-state-title">Unable to load events</h2>
          <p className="admin-events-error-text">{error}</p>
          <button type="button" className="admin-events-retry" onClick={() => void loadEvents()}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && events.length === 0 ? (
        <div className="admin-events-empty">
          <Calendar className="admin-events-empty-icon" size={48} />
          <h2 className="admin-events-empty-title">No events yet</h2>
          <p className="admin-events-empty-text">
            Create your first event to publish retreats, workshops, and live sessions.
          </p>
          <Link to="/admin/events/create" className="admin-events-create-btn">
            <Plus size={18} />
            Create Event
          </Link>
        </div>
      ) : null}

      {!loading && !error && events.length > 0 && filteredEvents.length === 0 ? (
        <div className="admin-events-empty">
          <Calendar className="admin-events-empty-icon" size={48} />
          <h2 className="admin-events-empty-title">{emptyFilterLabel}</h2>
          <p className="admin-events-empty-text">
            Try a different status filter to see other events.
          </p>
        </div>
      ) : null}

      {!loading && !error && filteredEvents.length > 0 ? (
        <AdminEventList
          events={filteredEvents}
          busyEventId={busyEventId}
          busyAction={busyAction}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onCancel={(event) => setPendingConfirm({ type: 'cancel', event })}
          onDelete={(event) => setPendingConfirm({ type: 'delete', event })}
        />
      ) : null}

      {pendingConfirm ? (
        <AdminConfirmDialog
          title={pendingConfirm.type === 'delete' ? 'Delete event' : 'Cancel event'}
          message={
            pendingConfirm.type === 'delete'
              ? `Are you sure you want to delete "${pendingConfirm.event.title}"? This deletion is permanent and cannot be undone.`
              : `Are you sure you want to cancel "${pendingConfirm.event.title}"?`
          }
          confirmLabel={pendingConfirm.type === 'delete' ? 'Delete permanently' : 'Cancel event'}
          danger={pendingConfirm.type === 'delete'}
          isBusy={busyEventId === pendingConfirm.event.id}
          onCancel={() => {
            if (busyEventId === null) {
              setPendingConfirm(null);
            }
          }}
          onConfirm={() => {
            void handleConfirm();
          }}
        />
      ) : null}
    </AdminEventsShell>
  );
};

export default AdminEventsPage;

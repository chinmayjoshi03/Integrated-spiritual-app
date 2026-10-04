import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, IndianRupee, Users, Video } from 'lucide-react';

import EventStatusBadge from './EventStatusBadge';
import type { Event } from '../types/event.types';
import {
  formatEventDate,
  formatEventFee,
  formatEventTime,
} from '../utils/eventForm';
import { canEditEventCoreDetails } from '../utils/eventLifecycle';
import './AdminEventCard.css';

export type AdminEventAction = 'publish' | 'unpublish' | 'cancel' | 'delete';

interface AdminEventCardProps {
  event: Event;
  busyAction: AdminEventAction | null;
  onPublish: (event: Event) => void;
  onUnpublish: (event: Event) => void;
  onCancel: (event: Event) => void;
  onDelete: (event: Event) => void;
}

const AdminEventCard = ({
  event,
  busyAction,
  onPublish,
  onUnpublish,
  onCancel,
  onDelete,
}: AdminEventCardProps) => {
  const isOnline = event.event_type === 'online';
  const registeredCount = event.registered_count ?? 0;
  const isBusy = busyAction !== null;
  const canEdit = canEditEventCoreDetails(event);

  return (
    <article
      className={
        event.status === 'cancelled'
          ? 'admin-event-card admin-event-card-cancelled'
          : 'admin-event-card'
      }
    >
      {event.banner_url ? (
        <img
          src={event.banner_url}
          alt=""
          className="admin-event-card-banner"
        />
      ) : (
        <div className="admin-event-card-banner-fallback" aria-hidden="true">
          <Calendar size={40} />
        </div>
      )}

      <div className="admin-event-card-body">
        <div className="admin-event-card-top">
          <span className="admin-event-card-type">
            {isOnline ? <Video size={16} /> : <MapPin size={16} />}
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <EventStatusBadge status={event.status} />
        </div>

        <h2 className="admin-event-card-title">{event.title}</h2>

        <div className="admin-event-card-meta">
          <div className="admin-event-card-meta-row">
            <Calendar size={16} />
            <span>{formatEventDate(event.event_date)}</span>
          </div>

          <div className="admin-event-card-meta-row">
            <Clock size={16} />
            <span>
              {formatEventTime(event.start_time)} · {event.duration_minutes} min
            </span>
          </div>

          <div className="admin-event-card-meta-row">
            <Users size={16} />
            <span>
              {event.capacity === null
                ? `${registeredCount} registered`
                : `${registeredCount} / ${event.capacity} registered`}
            </span>
          </div>

          <div className="admin-event-card-meta-row">
            <IndianRupee size={16} />
            <span>{formatEventFee(event.fee)}</span>
          </div>
        </div>

        <div className="admin-event-card-actions">
          <Link
            to={`/admin/events/${event.id}`}
            className="admin-event-card-btn admin-event-card-btn-primary"
          >
            Manage
          </Link>

          {canEdit ? (
            <Link
              to={`/admin/events/${event.id}/edit`}
              className="admin-event-card-btn"
              aria-disabled={isBusy}
              onClick={(e) => {
                if (isBusy) {
                  e.preventDefault();
                }
              }}
            >
              Edit
            </Link>
          ) : null}

          {event.status === 'draft' ? (
            <button
              type="button"
              className="admin-event-card-btn admin-event-card-btn-primary"
              onClick={() => onPublish(event)}
              disabled={isBusy}
            >
              {busyAction === 'publish' ? 'Publishing...' : 'Publish'}
            </button>
          ) : null}

          {event.status === 'published' ? (
            <button
              type="button"
              className="admin-event-card-btn"
              onClick={() => onUnpublish(event)}
              disabled={isBusy}
            >
              {busyAction === 'unpublish' ? 'Unpublishing...' : 'Unpublish'}
            </button>
          ) : null}

          {event.status !== 'cancelled' ? (
            <button
              type="button"
              className="admin-event-card-btn"
              onClick={() => onCancel(event)}
              disabled={isBusy}
            >
              {busyAction === 'cancel' ? 'Cancelling...' : 'Cancel'}
            </button>
          ) : null}

          <button
            type="button"
            className="admin-event-card-btn admin-event-card-btn-danger"
            onClick={() => onDelete(event)}
            disabled={isBusy}
          >
            {busyAction === 'delete' ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default AdminEventCard;

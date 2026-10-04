import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
} from 'lucide-react';

import type { Event } from '../types/event.types';
import { EventLifecycleBadge } from './EventStatusBadge';
import { getEventLifecycleStatus } from '../utils/eventLifecycle';

import './EventCard.css';

interface EventCardProps {
  event: Event;
  onView?: (event: Event) => void;
  showStatus?: boolean;
  showActions?: boolean;
  showParticipation?: boolean;
}

const formatEventDate = (dateString: string) => {
  const datePart = dateString.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) {
    return dateString;
  }

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatEventTime = (timeString: string) => {
  const [hours, minutes] = timeString
    .slice(0, 5)
    .split(':')
    .map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeString;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const EventCard = ({
  event,
  onView,
  showStatus = false,
  showActions = false,
  showParticipation = false,
}: EventCardProps) => {
  if (!event) {
    return null;
  }

  const isOnline = event.event_type === 'online';
  const lifecycle = getEventLifecycleStatus(event);

  return (
    <article className="event-card">
      {event.banner_url ? (
        <img
          src={event.banner_url}
          alt={event.title}
          className="event-card-banner"
        />
      ) : (
        <div className="event-card-banner event-card-banner-placeholder">
          <Calendar size={52} />
        </div>
      )}

      <div className="event-card-content">
        <div className="event-card-top-row">
          <div className="event-card-type">
            {isOnline ? (
              <>
                <Video size={16} />
                <span>Online</span>
              </>
            ) : (
              <>
                <MapPin size={16} />
                <span>Offline</span>
              </>
            )}
          </div>

          {showStatus ? (
            <EventLifecycleBadge status={lifecycle} />
          ) : null}
        </div>

        <h2 className="event-card-title">
          {event.title}
        </h2>

        {event.description && (
          <p className="event-card-description">
            {event.description}
          </p>
        )}

        <div className="event-card-details">
          <div className="event-card-detail">
            <Calendar size={17} />
            <span>
              {formatEventDate(event.event_date)}
            </span>
          </div>

          <div className="event-card-detail">
            <Clock size={17} />
            <span>
              {formatEventTime(event.start_time)} ·{' '}
              {event.duration_minutes} minutes
            </span>
          </div>

          {event.capacity !== null && (
            <div className="event-card-detail">
              <Users size={17} />
              <span>
                {event.registered_count ?? 0} / {event.capacity} registered
              </span>
            </div>
          )}

          {event.location && (
            <div className="event-card-detail">
              <MapPin size={17} />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {showParticipation ? (
          <div className="event-card-participation">
            <p>
              Attendance:{' '}
              {event.attendance_status === 'present'
                ? 'Present'
                : event.attendance_status === 'absent'
                  ? 'Absent'
                  : 'Not recorded yet'}
            </p>
            <p>
              Certificate:{' '}
              {event.certificate_status === 'available'
                ? 'Available'
                : event.certificate_status === 'pending'
                  ? 'Pending'
                  : 'Not available'}
            </p>
          </div>
        ) : null}

        {showActions ? (
          <div className="event-card-actions">
            <button
              type="button"
              onClick={() => onView?.(event)}
              className="event-card-secondary-button"
            >
              View
            </button>

            <button
              type="button"
              className="event-card-primary-button"
            >
              Manage
            </button>
          </div>
        ) : (
          <Link
            to={`/events/${event.id}`}
            className="event-card-primary-button event-card-view-button"
          >
            View Event
          </Link>
        )}
      </div>
    </article>
  );
};

export default EventCard;
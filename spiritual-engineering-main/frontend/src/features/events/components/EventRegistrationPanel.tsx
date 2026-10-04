import { Link } from 'react-router-dom';

import AddToCalendarButton from './AddToCalendarButton';
import CertificateView from './CertificateView';
import type { Event } from '../types/event.types';
import { getEventLifecycleStatus, getEventStartDate } from '../utils/eventLifecycle';
import './EventRegistrationPanel.css';

interface EventRegistrationPanelProps {
  event: Event;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  successMessage: string;
  errorMessage: string;
  sessionBusy?: boolean;
  inSession?: boolean;
  onRegister: () => void;
  onJoinSession?: () => void;
  onLeaveSession?: () => void;
}

const attendanceLabel = (event: Event) => {
  if (event.attendance_status === 'present') {
    return 'Present';
  }

  if (event.attendance_status === 'absent') {
    return 'Absent';
  }

  return 'Not recorded yet';
};

const certificateLabel = (event: Event) => {
  if (event.certificate_status === 'available') {
    return 'Available';
  }

  if (event.certificate_status === 'pending') {
    return 'Pending';
  }

  return 'Not available';
};

const EventRegistrationPanel = ({
  event,
  isAuthenticated,
  isSubmitting,
  successMessage,
  errorMessage,
  sessionBusy = false,
  inSession = false,
  onRegister,
  onJoinSession,
  onLeaveSession,
}: EventRegistrationPanelProps) => {
  const lifecycle = getEventLifecycleStatus(event);
  const isRegistered = Boolean(event.is_registered);
  const isFull =
    event.capacity !== null &&
    (event.registered_count ?? 0) >= event.capacity;
  const canRegister =
    lifecycle === 'upcoming' && !isRegistered && !isFull && isAuthenticated;
  const showCalendar =
    isRegistered && (lifecycle === 'upcoming' || lifecycle === 'live');
  const joinOpensAt = getEventStartDate(event).getTime() - 10 * 60 * 1000;
  const canJoinSession =
    isRegistered &&
    event.event_type === 'online' &&
    (lifecycle === 'live' || (lifecycle === 'upcoming' && Date.now() >= joinOpensAt));

  return (
    <aside className="event-registration-panel">
      <h2 className="event-registration-title">
        {lifecycle === 'completed' ? 'Your event' : 'Registration'}
      </h2>

      {successMessage ? (
        <p className="event-registration-success" role="status">
          {successMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="event-registration-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {lifecycle === 'draft' ? (
        <p className="event-registration-copy">
          This event is not available for registration.
        </p>
      ) : null}

      {lifecycle === 'cancelled' ? (
        <p className="event-registration-copy">
          This event has been cancelled. New registrations are closed.
        </p>
      ) : null}

      {lifecycle === 'upcoming' && isRegistered ? (
        <p className="event-registration-copy">✓ Registered</p>
      ) : null}

      {lifecycle === 'upcoming' && !isRegistered && isFull ? (
        <p className="event-registration-copy">This event is full.</p>
      ) : null}

      {lifecycle === 'upcoming' && !isRegistered && !isFull && !isAuthenticated ? (
        <>
          <p className="event-registration-copy">
            Log in to reserve your place. Mentors and members can both register
            as participants.
          </p>
          <Link
            to="/login"
            state={{ from: `/events/${event.id}` }}
            className="event-registration-button"
          >
            Log in to register
          </Link>
        </>
      ) : null}

      {canRegister ? (
        <button
          type="button"
          className="event-registration-button"
          onClick={onRegister}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      ) : null}

      {showCalendar ? <AddToCalendarButton event={event} /> : null}

      {canJoinSession && !inSession ? (
        <button
          type="button"
          className="event-registration-button"
          onClick={onJoinSession}
          disabled={sessionBusy}
        >
          {sessionBusy ? 'Joining...' : 'Join Session'}
        </button>
      ) : null}

      {canJoinSession && inSession ? (
        <button
          type="button"
          className="event-registration-button event-registration-button-secondary"
          onClick={onLeaveSession}
          disabled={sessionBusy}
        >
          {sessionBusy ? 'Leaving...' : 'Leave Session'}
        </button>
      ) : null}

      {lifecycle === 'live' && !isRegistered ? (
        <p className="event-registration-copy">
          Registration is closed while this event is live. Join access is
          available to registered participants.
        </p>
      ) : null}

      {lifecycle === 'live' && isRegistered && event.event_type === 'offline' ? (
        <p className="event-registration-copy">
          This event is happening now at the listed location.
        </p>
      ) : null}

      {lifecycle === 'completed' && isRegistered ? (
        <div className="event-registration-summary">
          <p>
            Attendance: <strong>{attendanceLabel(event)}</strong>
          </p>
          <p>
            Certificate: <strong>{certificateLabel(event)}</strong>
          </p>
          {event.certificate_status === 'available' ? (
            <CertificateView eventId={event.id} />
          ) : null}
        </div>
      ) : null}

      {lifecycle === 'completed' && !isRegistered ? (
        <p className="event-registration-copy">
          This event has ended. Attendance and certificates are available to
          registered participants.
        </p>
      ) : null}
    </aside>
  );
};

export default EventRegistrationPanel;

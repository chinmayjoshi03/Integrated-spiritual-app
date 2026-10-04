import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
} from 'lucide-react';

import EventRegistrationPanel from '../components/EventRegistrationPanel';
import { EventLifecycleBadge } from '../components/EventStatusBadge';
import { getEventById, joinEventSession, heartbeatEventSession, leaveEventSession, registerForEvent } from '../services/eventsService';
import type { Event } from '../types/event.types';
import {
  formatEventDate,
  formatEventFee,
  formatEventTime,
} from '../utils/eventForm';
import { getEventLifecycleStatus } from '../utils/eventLifecycle';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/axiosInstance';
import './EventDetailsPage.css';

const EventDetailsPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [sessionBusy, setSessionBusy] = useState(false);
  const [inSession, setInSession] = useState(false);

  const eventId = Number(id);

  const loadEvent = useCallback(async () => {
    if (!Number.isInteger(eventId) || eventId <= 0) {
      setLoadError('This event could not be found.');
      setLoading(false);
      return;
    }

    setLoadError('');

    try {
      const data = await getEventById(eventId);
      setEvent(data);
    } catch (err) {
      setEvent(null);
      setLoadError(getApiErrorMessage(err, 'Unable to load this event.'));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    void loadEvent();
  }, [loadEvent, isAuthenticated]);

  const handleRegister = async () => {
    if (!event || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setRegisterError('');
    setSuccessMessage('');

    try {
      const result = await registerForEvent(event.id);
      setSuccessMessage(result.message || 'Successfully registered for the event.');
      await loadEvent();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const message = getApiErrorMessage(err, 'Unable to register for this event.');

        if (message.toLowerCase().includes('already registered')) {
          setSuccessMessage('You are already registered for this event.');
          await loadEvent();
          return;
        }

        setRegisterError(message);
        return;
      }

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setRegisterError('Please log in to register for this event.');
      } else {
        setRegisterError(
          getApiErrorMessage(err, 'Unable to register for this event.')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSession = async () => {
    if (!event || sessionBusy) {
      return;
    }

    setSessionBusy(true);
    setRegisterError('');

    try {
      const result = await joinEventSession(event.id);
      setInSession(true);
      if (result.meeting_url) {
        window.open(result.meeting_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setRegisterError(getApiErrorMessage(err, 'Unable to join this session.'));
    } finally {
      setSessionBusy(false);
    }
  };

  const handleLeaveSession = async () => {
    if (!event || sessionBusy) {
      return;
    }

    setSessionBusy(true);
    setRegisterError('');

    try {
      await leaveEventSession(event.id);
      setInSession(false);
      await loadEvent();
    } catch (err) {
      setRegisterError(getApiErrorMessage(err, 'Unable to leave this session.'));
    } finally {
      setSessionBusy(false);
    }
  };

  useEffect(() => {
    if (!inSession || !event) {
      return;
    }

    const timer = window.setInterval(() => {
      void heartbeatEventSession(event.id).catch(() => undefined);
    }, 15000);

    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        void heartbeatEventSession(event.id).catch(() => undefined);
      }
    };

    const onUnload = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      void fetch(`${API_BASE_URL}/events/${event.id}/session/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
        keepalive: true,
      });
    };

    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onUnload);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onUnload);
    };
  }, [inSession, event]);

  const isOnline = event?.event_type === 'online';
  const lifecycle = event ? getEventLifecycleStatus(event) : null;

  return (
    <div className="event-details-page">
      <div className="event-details-container">
        <Link to="/events" className="event-details-back">
          <ArrowLeft size={16} />
          Back to events
        </Link>

        {loading ? (
          <div className="event-details-state">
            <p>Loading event...</p>
          </div>
        ) : null}

        {!loading && loadError ? (
          <div className="event-details-state">
            <p className="event-details-error">{loadError}</p>
          </div>
        ) : null}

        {!loading && event && lifecycle ? (
          <div className="event-details-layout">
            <article className="event-details-main">
              {event.banner_url ? (
                <img
                  src={event.banner_url}
                  alt=""
                  className="event-details-banner"
                />
              ) : (
                <div className="event-details-banner event-details-banner-placeholder">
                  <Calendar size={56} />
                </div>
              )}

              <p className="event-details-kicker">Spiritual Event</p>
              <h1 className="event-details-title">{event.title}</h1>

              <div className="event-details-meta">
                <span className="event-details-type">
                  {isOnline ? <Video size={16} /> : <MapPin size={16} />}
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <EventLifecycleBadge status={lifecycle} />
              </div>

              {event.description ? (
                <p className="event-details-description">{event.description}</p>
              ) : null}

              <ul className="event-details-list">
                <li>
                  <Calendar size={17} />
                  <span>{formatEventDate(event.event_date)}</span>
                </li>
                <li>
                  <Clock size={17} />
                  <span>
                    {formatEventTime(event.start_time)} · {event.duration_minutes}{' '}
                    minutes
                  </span>
                </li>
                {!isOnline && event.location ? (
                  <li>
                    <MapPin size={17} />
                    <span>{event.location}</span>
                  </li>
                ) : null}
                <li>
                  <Users size={17} />
                  <span>
                    {event.capacity === null
                      ? `${event.registered_count ?? 0} registered`
                      : `${event.registered_count ?? 0} / ${event.capacity} registered`}
                  </span>
                </li>
                <li>
                  <span className="event-details-fee">
                    {formatEventFee(Number(event.fee))}
                  </span>
                </li>
              </ul>

              {isOnline ? (
                <div className="event-details-meeting">
                  <h2>Meeting information</h2>
                  {event.is_registered ? (
                    <p>
                      Registered participants can enter through Join Session.
                      The meeting address stays private and is opened only after
                      your participation is recorded.
                    </p>
                  ) : (
                    <p>
                      The live session is available to registered participants
                      through Join Session.
                    </p>
                  )}
                </div>
              ) : null}
            </article>

            <EventRegistrationPanel
              event={event}
              isAuthenticated={isAuthenticated}
              isSubmitting={isSubmitting}
              successMessage={successMessage}
              errorMessage={registerError}
              sessionBusy={sessionBusy}
              inSession={inSession}
              onRegister={() => {
                void handleRegister();
              }}
              onJoinSession={() => {
                void handleJoinSession();
              }}
              onLeaveSession={() => {
                void handleLeaveSession();
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EventDetailsPage;

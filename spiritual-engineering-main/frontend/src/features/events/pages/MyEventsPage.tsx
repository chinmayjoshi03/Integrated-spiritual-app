import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

import EventCard from '../components/EventCard';
import ParticipantEventsShell from '../components/ParticipantEventsShell';
import { getMyEvents } from '../services/eventsService';
import type { Event } from '../types/event.types';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import './EventsPage.css';
import './MyEventsPage.css';

const MyEventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMyEvents();
      setEvents(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load your events.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return (
    <ParticipantEventsShell>
      <div className="events-page-header">
        <p className="events-page-kicker">My participation</p>
        <h1 className="events-page-title">My Events</h1>
        <p className="events-page-description">
          Events you have registered for as a participant.
        </p>
      </div>

      {loading ? (
        <div className="events-page-state">
          <p>Loading your events...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="events-page-state">
          <p className="events-page-error">{error}</p>
          <button type="button" className="my-events-retry" onClick={() => void loadEvents()}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && events.length === 0 ? (
        <div className="events-page-empty">
          <Calendar className="events-page-empty-icon" size={48} />
          <h2 className="events-page-empty-title">No registered events yet</h2>
          <p className="events-page-empty-text">
            Browse upcoming gatherings and register to see them here.
          </p>
          <Link to="/events" className="my-events-browse-link">
            Browse events
          </Link>
        </div>
      ) : null}

      {!loading && !error && events.length > 0 ? (
        <div className="events-page-grid">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              showStatus
              showParticipation
            />
          ))}
        </div>
      ) : null}
    </ParticipantEventsShell>
  );
};

export default MyEventsPage;

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

import EventCard from '../components/EventCard';
import { getEvents } from '../services/eventsService';
import type { Event } from '../types/event.types';

import './EventsPage.css';

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch {
        setError('Unable to load events.');
      } finally {
        setLoading(false);
      }
    };

    void loadEvents();
  }, []);

  if (loading) {
    return (
      <div className="events-page">
        <div className="events-page-container">
          <div className="events-page-state">
            <p>Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-page">
        <div className="events-page-container">
          <div className="events-page-state">
            <p className="events-page-error">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="events-page-container">
        <div className="events-page-header">
          <p className="events-page-kicker">Spiritual Events</p>

          <h1 className="events-page-title">
            Upcoming Events
          </h1>

          <p className="events-page-description">
            Explore upcoming spiritual sessions, retreats, workshops and
            gatherings.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="events-page-empty">
            <Calendar
              className="events-page-empty-icon"
              size={48}
            />

            <h2 className="events-page-empty-title">
              No upcoming events
            </h2>

            <p className="events-page-empty-text">
              New events will appear here once they are published.
            </p>
          </div>
        ) : (
          <div className="events-page-grid">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default EventsPage;
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import AdminEventsShell from '../components/AdminEventsShell';
import EventForm from '../components/EventForm';
import { getEventById, updateEvent } from '../services/eventsService';
import type { CreateEventData, Event } from '../types/event.types';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { canEditEventCoreDetails } from '../utils/eventLifecycle';
import './AdminCreateEventPage.css';

const AdminEditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const eventId = Number(id);

  useEffect(() => {
    const loadEvent = async () => {
      if (!Number.isInteger(eventId) || eventId <= 0) {
        setLoadError('This event could not be found.');
        setLoading(false);
        return;
      }

      try {
        const data = await getEventById(eventId);
        setEvent(data);
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Unable to load this event.'));
      } finally {
        setLoading(false);
      }
    };

    void loadEvent();
  }, [eventId]);

  const handleSubmit = async (data: CreateEventData) => {
    if (!event) {
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      await updateEvent(event.id, data);
      navigate('/admin/events', {
        state: { notice: 'Event updated successfully.' },
      });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to update event. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminEventsShell>
      <Link to="/admin/events" className="admin-create-event-back">
        <ArrowLeft size={16} />
        Back to events
      </Link>

      <p className="admin-create-event-kicker">Admin</p>
      <h1 className="admin-create-event-title">Edit Event</h1>
      <p className="admin-create-event-description">
        Update event details. Dates are saved as YYYY-MM-DD.
      </p>

      {loading ? (
        <p className="admin-create-event-status">Loading event...</p>
      ) : null}

      {!loading && loadError ? (
        <p className="admin-create-event-error">{loadError}</p>
      ) : null}

      {!loading && event && !canEditEventCoreDetails(event) ? (
        <p className="admin-create-event-error">
          Core event details cannot be edited after the event has started.
        </p>
      ) : null}

      {!loading && event && canEditEventCoreDetails(event) ? (
        <EventForm
          event={event}
          submitLabel="Save changes"
          isSubmitting={isSubmitting}
          serverError={serverError}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/events')}
        />
      ) : null}
    </AdminEventsShell>
  );
};

export default AdminEditEventPage;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import AdminEventsShell from '../components/AdminEventsShell';
import EventForm from '../components/EventForm';
import { createEvent } from '../services/eventsService';
import type { CreateEventData } from '../types/event.types';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import './AdminCreateEventPage.css';

const AdminCreateEventPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (data: CreateEventData) => {
    setIsSubmitting(true);
    setServerError('');

    try {
      await createEvent(data);
      navigate('/admin/events');
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to create event. Please try again.'));
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
      <h1 className="admin-create-event-title">Create Event</h1>
      <p className="admin-create-event-description">
        Add a new gathering for the community. Save as a draft or publish it immediately.
      </p>

      <EventForm
        submitLabel="Create Event"
        isSubmitting={isSubmitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/events')}
      />
    </AdminEventsShell>
  );
};

export default AdminCreateEventPage;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import AdminEventsShell from '@/features/events/components/AdminEventsShell';
import VolunteerForm from '../components/VolunteerForm';
import { createVolunteerOpportunity } from '../services/volunteeringService';
import type { CreateVolunteerOpportunityData } from '../types/volunteering.types';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import '@/features/events/pages/AdminCreateEventPage.css';

const AdminCreateVolunteerPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (data: CreateVolunteerOpportunityData) => {
    setIsSubmitting(true);
    setServerError('');

    try {
      await createVolunteerOpportunity(data);
      navigate('/admin/volunteering', {
        state: { notice: 'Opportunity created.' },
      });
    } catch (err) {
      setServerError(
        getApiErrorMessage(err, 'Unable to create this opportunity.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminEventsShell>
      <Link to="/admin/volunteering" className="admin-create-event-back">
        <ArrowLeft size={16} />
        Back to volunteering
      </Link>

      <p className="admin-create-event-kicker">Admin</p>
      <h1 className="admin-create-event-title">Create volunteering opportunity</h1>
      <p className="admin-create-event-description">
        Volunteers apply first. You approve participants, mark attendance, and
        complete the activity before certificates become eligible.
      </p>

      <VolunteerForm
        submitLabel="Create opportunity"
        isSubmitting={isSubmitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/volunteering')}
      />
    </AdminEventsShell>
  );
};

export default AdminCreateVolunteerPage;

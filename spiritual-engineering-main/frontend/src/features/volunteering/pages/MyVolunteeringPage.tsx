import { useCallback, useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';

import VolunteerOpportunityCard from '../components/VolunteerOpportunityCard';
import ParticipantEventsShell from '@/features/events/components/ParticipantEventsShell';
import { getMyVolunteering } from '../services/volunteeringService';
import type {
  VolunteerApplicationStatus,
  VolunteerOpportunity,
} from '../types/volunteering.types';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import '@/features/events/pages/EventsPage.css';
import '@/features/events/pages/MyEventsPage.css';
import '@/features/events/pages/AdminEventsPage.css';

const FILTERS: { id: 'all' | VolunteerApplicationStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'applied', label: 'Applied' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'completed', label: 'Completed' },
];

const MyVolunteeringPage = () => {
  const [items, setItems] = useState<VolunteerOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMyVolunteering();
      setItems(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load your volunteering.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return items;
    }

    return items.filter((item) => item.application_status === filter);
  }, [items, filter]);

  return (
    <ParticipantEventsShell>
      <div className="events-page-header">
        <p className="events-page-kicker">My participation</p>
        <h1 className="events-page-title">My Volunteering</h1>
        <p className="events-page-description">
          Track applications, approvals, attendance, and completion. Applying is not
          the same as completing a volunteering activity.
        </p>
      </div>

      <div className="admin-events-filters">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              filter === item.id
                ? 'admin-events-filter admin-events-filter-active'
                : 'admin-events-filter'
            }
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="events-page-state">
          <p>Loading your volunteering...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="events-page-state">
          <p className="events-page-error">{error}</p>
          <button type="button" className="my-events-retry" onClick={() => void loadItems()}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <div className="events-page-empty">
          <HeartHandshake className="events-page-empty-icon" size={48} />
          <h2 className="events-page-empty-title">No volunteering yet</h2>
          <p className="events-page-empty-text">
            Browse published opportunities and apply to see them here.
          </p>
          <Link to="/volunteering" className="my-events-browse-link">
            Browse volunteering
          </Link>
        </div>
      ) : null}

      {!loading && !error && filtered.length > 0 ? (
        <div className="events-page-grid">
          {filtered.map((opportunity) => (
            <VolunteerOpportunityCard
              key={opportunity.application_id ?? opportunity.id}
              opportunity={opportunity}
              showApplication
            />
          ))}
        </div>
      ) : null}
    </ParticipantEventsShell>
  );
};

export default MyVolunteeringPage;

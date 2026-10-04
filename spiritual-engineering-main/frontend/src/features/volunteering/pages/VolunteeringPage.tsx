import { useEffect, useState } from 'react';
import { HeartHandshake } from 'lucide-react';

import VolunteerOpportunityCard from '../components/VolunteerOpportunityCard';
import { getVolunteerOpportunities } from '../services/volunteeringService';
import type { VolunteerOpportunity, VolunteerType } from '../types/volunteering.types';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import '@/features/events/pages/EventsPage.css';
import './volunteering.css';

const VolunteeringPage = () => {
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [volunteerType, setVolunteerType] = useState<VolunteerType | ''>('');
  const [fromDate, setFromDate] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getVolunteerOpportunities({
          search,
          category,
          volunteer_type: volunteerType,
          from_date: fromDate,
        });
        setOpportunities(data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load volunteering opportunities.'));
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(() => {
      void load();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [search, category, volunteerType, fromDate]);

  return (
    <div className="events-page">
      <div className="events-page-container">
        <div className="events-page-header">
          <p className="events-page-kicker">Seva</p>
          <h1 className="events-page-title">Volunteering</h1>
          <p className="events-page-description">
            Apply for published volunteering opportunities. Applications are reviewed
            by the admin team before you participate.
          </p>
        </div>

        <div className="volunteer-filters">
          <input
            type="search"
            placeholder="Search opportunities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search volunteering opportunities"
          />
          <input
            type="search"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          />
          <select
            value={volunteerType}
            onChange={(e) => setVolunteerType(e.target.value as VolunteerType | '')}
            aria-label="Filter by type"
          >
            <option value="">Online and offline</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="Filter from date"
          />
        </div>

        {loading ? (
          <div className="events-page-state">
            <p>Loading volunteering opportunities...</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="events-page-state">
            <p className="events-page-error">{error}</p>
          </div>
        ) : null}

        {!loading && !error && opportunities.length === 0 ? (
          <div className="events-page-empty">
            <HeartHandshake className="events-page-empty-icon" size={48} />
            <h2 className="events-page-empty-title">No published opportunities</h2>
            <p className="events-page-empty-text">
              New volunteering opportunities will appear here once they are published.
            </p>
          </div>
        ) : null}

        {!loading && !error && opportunities.length > 0 ? (
          <div className="events-page-grid">
            {opportunities.map((opportunity) => (
              <VolunteerOpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VolunteeringPage;

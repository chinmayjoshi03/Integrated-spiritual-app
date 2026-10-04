import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HeartHandshake, Plus } from 'lucide-react';

import AdminEventsShell from '@/features/events/components/AdminEventsShell';
import VolunteerOpportunityCard from '../components/VolunteerOpportunityCard';
import {
  getAdminVolunteerOpportunities,
  getAdminVolunteerStats,
} from '../services/volunteeringService';
import type {
  VolunteerOpportunity,
  VolunteerStats,
  VolunteerStatus,
  VolunteerType,
} from '../types/volunteering.types';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import '@/features/events/pages/AdminEventsPage.css';
import '@/features/events/pages/EventsPage.css';
import './volunteering.css';

const STATUS_FILTERS: { id: '' | VolunteerStatus; label: string }[] = [
  { id: '', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'closed', label: 'Closed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const AdminVolunteeringPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<VolunteerOpportunity[]>([]);
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | VolunteerStatus>('');
  const [category, setCategory] = useState('');
  const [volunteerType, setVolunteerType] = useState<VolunteerType | ''>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [list, statsData] = await Promise.all([
        getAdminVolunteerOpportunities({
          search,
          status,
          category,
          volunteer_type: volunteerType,
        }),
        getAdminVolunteerStats(),
      ]);
      setItems(list);
      setStats(statsData);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load volunteering management.'));
    } finally {
      setLoading(false);
    }
  }, [search, status, category, volunteerType]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    const state = location.state as { notice?: string } | null;
    if (state?.notice) {
      setNotice(state.notice);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  return (
    <AdminEventsShell>
      <div className="admin-events-toolbar">
        <div>
          <p className="admin-events-kicker">Admin</p>
          <h1 className="admin-events-title">Volunteer Management</h1>
          <p className="admin-events-description">
            Create opportunities, review applications, mark attendance, and complete
            volunteers. Mentors cannot manage volunteering.
          </p>
        </div>
        <Link to="/admin/volunteering/create" className="admin-events-create-btn">
          <Plus size={18} />
          Create opportunity
        </Link>
      </div>

      {notice ? (
        <div className="admin-events-notice" role="status">
          <p>{notice}</p>
          <button
            type="button"
            className="admin-events-notice-dismiss"
            onClick={() => setNotice('')}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {stats ? (
        <div className="volunteer-stats">
          <article>
            <p>Total opportunities</p>
            <strong>{stats.total_opportunities}</strong>
          </article>
          <article>
            <p>Published</p>
            <strong>{stats.published}</strong>
          </article>
          <article>
            <p>Upcoming</p>
            <strong>{stats.upcoming}</strong>
          </article>
          <article>
            <p>Applications</p>
            <strong>{stats.total_applications}</strong>
          </article>
          <article>
            <p>Approved volunteers</p>
            <strong>{stats.approved_volunteers}</strong>
          </article>
          <article>
            <p>Completed opportunities</p>
            <strong>{stats.completed_opportunities}</strong>
          </article>
        </div>
      ) : null}

      <div className="volunteer-filters">
        <input
          type="search"
          placeholder="Search opportunities"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <select
          value={volunteerType}
          onChange={(e) => setVolunteerType(e.target.value as VolunteerType | '')}
        >
          <option value="">Online and offline</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <span />
      </div>

      <div className="admin-events-filters">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.id || 'all'}
            type="button"
            className={
              status === item.id
                ? 'admin-events-filter admin-events-filter-active'
                : 'admin-events-filter'
            }
            onClick={() => setStatus(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-events-state">
          <p>Loading opportunities...</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="admin-events-state">
          <p className="admin-events-error-text">{error}</p>
          <button type="button" className="admin-events-retry" onClick={() => void loadData()}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="admin-events-empty">
          <HeartHandshake className="admin-events-empty-icon" size={48} />
          <h2 className="admin-events-empty-title">No opportunities yet</h2>
          <p className="admin-events-empty-text">
            Create a volunteering opportunity to start receiving applications.
          </p>
          <Link to="/admin/volunteering/create" className="admin-events-create-btn">
            Create opportunity
          </Link>
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="events-page-grid">
          {items.map((opportunity) => (
            <VolunteerOpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              to={`/admin/volunteering/${opportunity.id}`}
            />
          ))}
        </div>
      ) : null}
    </AdminEventsShell>
  );
};

export default AdminVolunteeringPage;

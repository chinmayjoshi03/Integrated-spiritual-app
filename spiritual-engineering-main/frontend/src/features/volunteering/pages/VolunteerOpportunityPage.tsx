import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  Clock,
  HeartHandshake,
  MapPin,
  Users,
  Video,
} from 'lucide-react';

import VolunteerStatusBadge from '../components/VolunteerStatusBadge';
import {
  applyToVolunteerOpportunity,
  cancelMyVolunteerApplication,
  getVolunteerOpportunityById,
} from '../services/volunteeringService';
import type { VolunteerOpportunity } from '../types/volunteering.types';
import {
  formatVolunteerDate,
  formatVolunteerDuration,
  formatVolunteerTime,
} from '../utils/formatVolunteerDate';
import { getApiErrorMessage } from '@/features/events/utils/getApiErrorMessage';
import { useAuth } from '@/hooks/useAuth';
import '@/features/events/pages/EventDetailsPage.css';
import './volunteering.css';

const VolunteerOpportunityPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [opportunity, setOpportunity] = useState<VolunteerOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const opportunityId = Number(id);

  const loadOpportunity = useCallback(async () => {
    if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
      setLoadError('This opportunity could not be found.');
      setLoading(false);
      return;
    }

    setLoadError('');

    try {
      const data = await getVolunteerOpportunityById(opportunityId);
      setOpportunity(data);
    } catch (err) {
      setOpportunity(null);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setLoadError('This opportunity could not be found.');
      } else {
        setLoadError(
          getApiErrorMessage(err, 'Unable to load this volunteering opportunity.')
        );
      }
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    setLoading(true);
    void loadOpportunity();
  }, [loadOpportunity, isAuthenticated]);

  const runAction = async (work: () => Promise<{ message?: string }>) => {
    if (!opportunity || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setActionError('');
    setMessage('');

    try {
      const result = await work();
      setMessage(result.message || 'Updated.');
      await loadOpportunity();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setActionError('Please log in to apply.');
      } else {
        setActionError(
          getApiErrorMessage(err, 'Unable to update this application.')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const applicationStatus = opportunity?.my_application?.status;
  const canApply =
    isAuthenticated &&
    opportunity?.status === 'published' &&
    !opportunity.is_full &&
    !applicationStatus;
  const canCancel =
    applicationStatus === 'applied' || applicationStatus === 'approved';
  const canSeeMeeting = Boolean(opportunity?.meeting_url);
  const capacityLabel =
    opportunity?.capacity === null
      ? `${opportunity?.occupied ?? 0} applied`
      : `${opportunity?.occupied ?? 0} / ${opportunity?.capacity}`;

  return (
    <div className="event-details-page">
      <div className="event-details-container">
        <Link to="/volunteering" className="event-details-back">
          <ArrowLeft size={16} />
          Back to volunteering
        </Link>

        {loading ? (
          <div className="event-details-state">
            <p>Loading opportunity...</p>
          </div>
        ) : null}

        {!loading && loadError ? (
          <div className="event-details-state">
            <p className="event-details-error">{loadError}</p>
          </div>
        ) : null}

        {!loading && !loadError && opportunity ? (
          <div className="event-details-layout">
            <article className="event-details-main">
              {opportunity.banner_url ? (
                <img
                  src={opportunity.banner_url}
                  alt={opportunity.title}
                  className="event-details-banner"
                />
              ) : (
                <div className="event-details-banner event-details-banner-placeholder">
                  <HeartHandshake size={48} />
                </div>
              )}

              <p className="event-details-kicker">
                {opportunity.category || 'Volunteering'}
              </p>
              <h1 className="event-details-title">{opportunity.title}</h1>

              <div className="event-details-meta">
                <span className="event-details-type">
                  {opportunity.volunteer_type === 'online' ? (
                    <Video size={16} />
                  ) : (
                    <MapPin size={16} />
                  )}
                  {opportunity.volunteer_type === 'online' ? 'Online' : 'Offline'}
                </span>
                <VolunteerStatusBadge status={opportunity.status} />
              </div>

              <p className="event-details-description">{opportunity.description}</p>

              <ul className="event-details-list">
                <li>
                  <Calendar size={16} />
                  {formatVolunteerDate(opportunity.event_date)}
                </li>
                <li>
                  <Clock size={16} />
                  {formatVolunteerTime(opportunity.start_time)} –{' '}
                  {formatVolunteerTime(opportunity.end_time)}
                  {formatVolunteerDuration(
                    opportunity.start_time,
                    opportunity.end_time
                  )
                    ? ` · ${formatVolunteerDuration(opportunity.start_time, opportunity.end_time)}`
                    : ''}
                </li>
                {opportunity.volunteer_type === 'offline' && opportunity.location ? (
                  <li>
                    <MapPin size={16} />
                    {opportunity.location}
                  </li>
                ) : null}
                <li>
                  <Users size={16} />
                  {opportunity.is_full ? 'No places remaining' : capacityLabel}
                </li>
              </ul>

              {opportunity.requirements ? (
                <div className="event-details-meeting">
                  <h2>Requirements</h2>
                  <p>{opportunity.requirements}</p>
                </div>
              ) : null}

              {canSeeMeeting ? (
                <div className="event-details-meeting">
                  <h2>Meeting information</h2>
                  <p>
                    <a href={opportunity.meeting_url ?? undefined}>
                      {opportunity.meeting_url}
                    </a>
                  </p>
                </div>
              ) : opportunity.volunteer_type === 'online' ? (
                <div className="event-details-meeting">
                  <h2>Meeting information</h2>
                  <p>
                    The meeting link is shared after your application is approved.
                  </p>
                </div>
              ) : null}
            </article>

            <aside className="volunteer-apply-panel">
              <h2>Application</h2>
              {!isAuthenticated ? (
                <>
                  <p>Please log in to apply as a volunteer.</p>
                  <div className="volunteer-apply-actions">
                    <Link
                      to="/login"
                      state={{ from: `/volunteering/${opportunity.id}` }}
                      className="volunteer-apply-primary"
                    >
                      Log in to apply
                    </Link>
                  </div>
                </>
              ) : null}

              {isAuthenticated && opportunity.status !== 'published' ? (
                <p>This opportunity is not accepting applications.</p>
              ) : null}

              {isAuthenticated && opportunity.is_full && !applicationStatus ? (
                <p>This opportunity is full.</p>
              ) : null}

              {applicationStatus ? (
                <p>
                  Status: <strong>{applicationStatus}</strong>
                </p>
              ) : null}

              {opportunity.my_attendance ? (
                <p>Attendance: {opportunity.my_attendance.status}</p>
              ) : null}

              {opportunity.certificate_status &&
              opportunity.certificate_status !== 'not_available' ? (
                <p>Certificate: {opportunity.certificate_status}</p>
              ) : null}

              {message ? <p className="volunteer-apply-success">{message}</p> : null}
              {actionError ? (
                <p className="volunteer-apply-error">{actionError}</p>
              ) : null}

              <div className="volunteer-apply-actions">
                {canApply ? (
                  <button
                    type="button"
                    className="volunteer-apply-primary"
                    disabled={isSubmitting}
                    onClick={() =>
                      void runAction(() => applyToVolunteerOpportunity(opportunity.id))
                    }
                  >
                    {isSubmitting ? 'Submitting...' : 'Apply'}
                  </button>
                ) : null}

                {canCancel && opportunity.status !== 'completed' ? (
                  <button
                    type="button"
                    className="volunteer-apply-secondary"
                    disabled={isSubmitting}
                    onClick={() =>
                      void runAction(() =>
                        cancelMyVolunteerApplication(opportunity.id)
                      )
                    }
                  >
                    Cancel application
                  </button>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VolunteerOpportunityPage;

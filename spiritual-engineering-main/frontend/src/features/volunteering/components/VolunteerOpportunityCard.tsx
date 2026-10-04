import { Link } from 'react-router-dom';
import { Calendar, Clock, HeartHandshake, MapPin, Users, Video } from 'lucide-react';

import VolunteerStatusBadge from './VolunteerStatusBadge';
import type { VolunteerOpportunity } from '../types/volunteering.types';
import {
  formatVolunteerDate,
  formatVolunteerDuration,
  formatVolunteerTime,
} from '../utils/formatVolunteerDate';
import '@/features/events/components/EventCard.css';

interface VolunteerOpportunityCardProps {
  opportunity: VolunteerOpportunity;
  to?: string;
  showApplication?: boolean;
}

const VolunteerOpportunityCard = ({
  opportunity,
  to,
  showApplication = false,
}: VolunteerOpportunityCardProps) => {
  const isOnline = opportunity.volunteer_type === 'online';
  const href = to ?? `/volunteering/${opportunity.id}`;
  const applicationStatus =
    opportunity.application_status ?? opportunity.my_application?.status;
  const capacityLabel =
    opportunity.capacity === null
      ? `${opportunity.occupied} applied`
      : `${opportunity.occupied} / ${opportunity.capacity}`;

  return (
    <article className="event-card">
      {opportunity.banner_url ? (
        <img
          src={opportunity.banner_url}
          alt={opportunity.title}
          className="event-card-banner"
        />
      ) : (
        <div className="event-card-banner event-card-banner-placeholder">
          <HeartHandshake size={36} />
        </div>
      )}

      <div className="event-card-content">
        <div className="event-card-top-row">
          <span className="event-card-type">
            {isOnline ? <Video size={16} /> : <MapPin size={16} />}
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <VolunteerStatusBadge status={opportunity.status} />
        </div>

        <h2 className="event-card-title">{opportunity.title}</h2>
        <p className="event-card-description">{opportunity.description}</p>

        <div className="event-card-details">
          <p className="event-card-detail">
            <Calendar size={16} />
            {formatVolunteerDate(opportunity.event_date)}
          </p>
          <p className="event-card-detail">
            <Clock size={16} />
            {formatVolunteerTime(opportunity.start_time)} –{' '}
            {formatVolunteerTime(opportunity.end_time)}
            {formatVolunteerDuration(opportunity.start_time, opportunity.end_time)
              ? ` · ${formatVolunteerDuration(opportunity.start_time, opportunity.end_time)}`
              : ''}
          </p>
          <p className="event-card-detail">
            <Users size={16} />
            {opportunity.is_full ? 'Full' : capacityLabel}
          </p>
        </div>

        {showApplication && applicationStatus ? (
          <div className="event-card-participation">
            <p>Application: {applicationStatus}</p>
            {opportunity.attendance_status ? (
              <p>Attendance: {opportunity.attendance_status}</p>
            ) : null}
            {opportunity.certificate_status &&
            opportunity.certificate_status !== 'not_available' ? (
              <p>Certificate: {opportunity.certificate_status}</p>
            ) : null}
          </div>
        ) : null}

        <Link to={href} className="event-card-primary-button event-card-view-button">
          View details
        </Link>
      </div>
    </article>
  );
};

export default VolunteerOpportunityCard;

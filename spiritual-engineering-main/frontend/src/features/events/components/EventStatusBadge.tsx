import type { EventLifecycleStatus, EventStatus } from '../types/event.types';
import { getEventLifecycleLabel } from '../utils/eventLifecycle';
import './EventStatusBadge.css';

interface EventStatusBadgeProps {
  status: EventStatus;
}

const EventStatusBadge = ({ status }: EventStatusBadgeProps) => {
  return (
    <span className={`event-status-badge event-status-badge-${status}`}>
      {status}
    </span>
  );
};

export const EventLifecycleBadge = ({
  status,
}: {
  status: EventLifecycleStatus;
}) => {
  return (
    <span className={`event-status-badge event-status-badge-${status}`}>
      {getEventLifecycleLabel(status)}
    </span>
  );
};

export default EventStatusBadge;

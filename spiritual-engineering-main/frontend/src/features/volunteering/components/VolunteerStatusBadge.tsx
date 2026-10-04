import '@/features/events/components/EventStatusBadge.css';

interface VolunteerStatusBadgeProps {
  status: string;
}

const VolunteerStatusBadge = ({ status }: VolunteerStatusBadgeProps) => {
  const className =
    status === 'published' || status === 'approved' || status === 'present'
      ? 'event-status-badge event-status-badge-published'
      : status === 'cancelled' || status === 'rejected' || status === 'absent'
        ? 'event-status-badge event-status-badge-cancelled'
        : status === 'completed'
          ? 'event-status-badge event-status-badge-completed'
          : status === 'applied' || status === 'partial' || status === 'closed'
            ? 'event-status-badge event-status-badge-live'
            : 'event-status-badge event-status-badge-draft';

  return <span className={className}>{status.replaceAll('_', ' ')}</span>;
};

export default VolunteerStatusBadge;

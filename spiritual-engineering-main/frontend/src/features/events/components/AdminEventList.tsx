import AdminEventCard, { type AdminEventAction } from './AdminEventCard';
import type { Event } from '../types/event.types';
import './AdminEventList.css';

interface AdminEventListProps {
  events: Event[];
  busyEventId: number | null;
  busyAction: AdminEventAction | null;
  onPublish: (event: Event) => void;
  onUnpublish: (event: Event) => void;
  onCancel: (event: Event) => void;
  onDelete: (event: Event) => void;
}

const AdminEventList = ({
  events,
  busyEventId,
  busyAction,
  onPublish,
  onUnpublish,
  onCancel,
  onDelete,
}: AdminEventListProps) => {
  return (
    <div className="admin-event-list">
      {events.map((event) => (
        <AdminEventCard
          key={event.id}
          event={event}
          busyAction={busyEventId === event.id ? busyAction : null}
          onPublish={onPublish}
          onUnpublish={onUnpublish}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default AdminEventList;

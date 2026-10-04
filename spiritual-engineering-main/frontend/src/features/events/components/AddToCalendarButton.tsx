import type { Event } from '../types/event.types';
import { downloadEventIcs } from '../utils/eventCalendar';
import './EventRegistrationPanel.css';

interface AddToCalendarButtonProps {
  event: Event;
  className?: string;
}

const AddToCalendarButton = ({ event, className }: AddToCalendarButtonProps) => {
  return (
    <button
      type="button"
      className={className ?? 'event-registration-button event-registration-button-secondary'}
      onClick={() => downloadEventIcs(event)}
    >
      Add to Calendar
    </button>
  );
};

export default AddToCalendarButton;

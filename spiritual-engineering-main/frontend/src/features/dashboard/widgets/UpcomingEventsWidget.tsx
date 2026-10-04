import { Link } from 'react-router-dom';
import './widgets.css';

interface EventItem {
  id: string;
  title: string;
  date: string;
}

const events: EventItem[] = [
  { id: '1', title: 'Weekend Silent Retreat', date: 'Aug 22' },
  { id: '2', title: 'Live Q&A with Guru Ji', date: 'Aug 25' },
];

const UpcomingEventsWidget = () => {
  return (
    <div className="widget-card">
      <h3 className="widget-title">Upcoming Events</h3>
      <ul className="widget-list">
        {events.map((event) => (
          <li key={event.id} className="widget-list-item">
            <p>{event.title}</p>
            <p className="widget-meta">{event.date}</p>
          </li>
        ))}
      </ul>
      <Link to="/events">View all events →</Link>
    </div>
  );
};

export default UpcomingEventsWidget;
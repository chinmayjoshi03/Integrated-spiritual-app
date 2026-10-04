import { Link } from 'react-router-dom';
import './widgets.css';

const MeditationWidget = () => {
  return (
    <div className="widget-card">
      <h3 className="widget-title">Today's Meditation</h3>
      <p>Morning Stillness — 10 min guided session</p>
      <Link to="/meditation">Start Session →</Link>
    </div>
  );
};

export default MeditationWidget;
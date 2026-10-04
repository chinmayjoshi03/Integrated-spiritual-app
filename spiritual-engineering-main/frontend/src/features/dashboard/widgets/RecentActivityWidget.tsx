import './widgets.css';

interface Activity {
  id: string;
  text: string;
  time: string;
}

const activities: Activity[] = [
  { id: '1', text: 'Completed "Morning Stillness" meditation', time: '2 hours ago' },
  { id: '2', text: 'Enrolled in "Letting Go" course', time: 'Yesterday' },
  { id: '3', text: 'Logged mood: Calm', time: '2 days ago' },
];

const RecentActivityWidget = () => {
  return (
    <div className="widget-card">
      <h3 className="widget-title">Recent Activity</h3>
      <ul className="widget-list">
        {activities.map((activity) => (
          <li key={activity.id} className="widget-list-item">
            <p>{activity.text}</p>
            <p className="widget-meta">{activity.time}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivityWidget;
import './widgets.css';

interface Update {
  id: string;
  text: string;
}

const updates: Update[] = [
  { id: '1', text: 'New discussion: "Finding stillness in a busy life"' },
  { id: '2', text: '24 members joined the Meditation Circle group' },
];

const CommunityUpdatesWidget = () => {
  return (
    <div className="widget-card">
      <h3 className="widget-title">Community Updates</h3>
      <ul className="widget-list">
        {updates.map((update) => (
          <li key={update.id} className="widget-list-item">
            {update.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommunityUpdatesWidget;
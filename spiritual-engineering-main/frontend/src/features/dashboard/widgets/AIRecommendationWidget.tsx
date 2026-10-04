import './widgets.css';

const AIRecommendationWidget = () => {
  return (
    <div className="widget-card">
      <h3 className="widget-title">Recommended For You</h3>
      <p>Based on your recent activity, try "Letting Go" — a 15 min course on release and acceptance.</p>
      <p className="widget-meta">AI recommendations coming in a later phase</p>
    </div>
  );
};

export default AIRecommendationWidget;
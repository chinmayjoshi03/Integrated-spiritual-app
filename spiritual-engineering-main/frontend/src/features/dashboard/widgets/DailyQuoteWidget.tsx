import './widgets.css';

const DailyQuoteWidget = () => {
  return (
    <div className="widget-card">
      <h3 className="widget-title">Today's Quote</h3>
      <p>"Peace comes from within. Do not seek it without."</p>
      <p className="widget-meta">— Buddha</p>
    </div>
  );
};

export default DailyQuoteWidget;
import './DashStatCard.css';

interface DashStatCardProps {
  label: string;
  value: string;
  meta: string;
}

const DashStatCard = ({ label, value, meta }: DashStatCardProps) => {
  return (
    <div className="dash-stat-card">
      <p className="dash-stat-label">{label}</p>
      <p className="dash-stat-value">{value}</p>
      <p className="dash-stat-meta">{meta}</p>
    </div>
  );
};

export default DashStatCard;
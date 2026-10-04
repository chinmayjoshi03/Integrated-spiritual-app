import { Construction } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import './ComingSoonPage.css';

interface ComingSoonPageProps {
  portalLabel: string;
  sections: any[];
  homePath: string;
  title: string;
}

const ComingSoonPage = ({ portalLabel, sections, homePath, title }: ComingSoonPageProps) => {
  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel={portalLabel} sections={sections} homePath={homePath} />

      <main className="dash-main">
        <DashboardHeader title={title} subtitle="This feature is coming soon." />

        <div className="coming-soon-box">
          <Construction size={40} color="var(--color-primary)" />
          <p>We're still building this. Check back soon.</p>
        </div>
      </main>
    </div>
  );
};

export default ComingSoonPage;
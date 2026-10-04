import type { ReactNode } from 'react';

import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import { userNavSections } from '@/features/dashboard/userNavConfig';
import { mentorNavSections } from '@/features/dashboard/mentor/mentorNavConfig';
import { useAuth } from '@/hooks/useAuth';
import '@/features/dashboard/DashboardPage.css';

interface ParticipantEventsShellProps {
  children: ReactNode;
}

const ParticipantEventsShell = ({ children }: ParticipantEventsShellProps) => {
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';

  return (
    <div className="dash-layout">
      <DashboardSidebar
        portalLabel={isMentor ? 'MENTOR PORTAL' : 'MY SPACE'}
        sections={isMentor ? mentorNavSections : userNavSections}
        homePath={isMentor ? '/mentor' : '/dashboard'}
      />
      <main className="dash-main">{children}</main>
    </div>
  );
};

export default ParticipantEventsShell;

import type { ReactNode } from 'react';

import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import { userNavSections } from '@/features/dashboard/userNavConfig';
import { mentorNavSections } from '@/features/dashboard/mentor/mentorNavConfig';
import { adminNavSections } from '@/features/dashboard/admin/adminNavConfig';
import { useAuth } from '@/hooks/useAuth';
import '@/features/dashboard/DashboardPage.css';

interface CommunityShellProps {
  children: ReactNode;
}

const CommunityShell = ({ children }: CommunityShellProps) => {
  const { user } = useAuth();
  const role = user?.role;
  const sections =
    role === 'admin'
      ? adminNavSections
      : role === 'mentor'
        ? mentorNavSections
        : userNavSections;
  const homePath =
    role === 'admin' ? '/admin' : role === 'mentor' ? '/mentor' : '/dashboard';
  const portalLabel =
    role === 'admin'
      ? 'ADMIN PORTAL'
      : role === 'mentor'
        ? 'MENTOR PORTAL'
        : 'MY SPACE';

  return (
    <div className="dash-layout">
      <DashboardSidebar
        portalLabel={portalLabel}
        sections={sections}
        homePath={homePath}
      />
      <main className="dash-main">{children}</main>
    </div>
  );
};

export default CommunityShell;

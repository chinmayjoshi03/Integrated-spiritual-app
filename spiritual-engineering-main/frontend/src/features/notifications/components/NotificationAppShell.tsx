import type { ReactNode } from 'react';

import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import { adminNavSections } from '@/features/dashboard/admin/adminNavConfig';
import { mentorNavSections } from '@/features/dashboard/mentor/mentorNavConfig';
import { userNavSections } from '@/features/dashboard/userNavConfig';
import { useAuth } from '@/hooks/useAuth';
import '@/features/dashboard/DashboardPage.css';

interface NotificationAppShellProps {
  children: ReactNode;
}

const NotificationAppShell = ({ children }: NotificationAppShellProps) => {
  const { user } = useAuth();
  const role = user?.role;
  const portalLabel =
    role === 'admin' ? 'ADMIN PORTAL' : role === 'mentor' ? 'MENTOR PORTAL' : 'MY SPACE';
  const sections =
    role === 'admin'
      ? adminNavSections
      : role === 'mentor'
        ? mentorNavSections
        : userNavSections;
  const homePath = role === 'admin' ? '/admin' : role === 'mentor' ? '/mentor' : '/dashboard';

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel={portalLabel} sections={sections} homePath={homePath} />
      <main className="dash-main">{children}</main>
    </div>
  );
};

export default NotificationAppShell;

import type { ReactNode } from 'react';

import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import { adminNavSections } from '@/features/dashboard/admin/adminNavConfig';
import '@/features/dashboard/DashboardPage.css';

interface AdminEventsShellProps {
  children: ReactNode;
}

const AdminEventsShell = ({ children }: AdminEventsShellProps) => {
  return (
    <div className="dash-layout">
      <DashboardSidebar
        portalLabel="ADMIN PORTAL"
        sections={adminNavSections}
        homePath="/admin"
      />
      <main className="dash-main">{children}</main>
    </div>
  );
};

export default AdminEventsShell;

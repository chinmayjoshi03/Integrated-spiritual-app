import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';
import './DashboardSidebar.css';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }> | any;
  path: string;
  soon?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface DashboardSidebarProps {
  portalLabel?: string;
  sections: NavSection[];
  homePath: string;
}

const DashboardSidebar = ({ portalLabel, sections, homePath }: DashboardSidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-header">
        <Link to={homePath} className="dash-sidebar-logo-link">
          <img src={logo} alt="The Karma Vajra Omniversity" className="dash-sidebar-logo" />
        </Link>
        {portalLabel && (
          <div className="dash-sidebar-portal-badge">
            <span className="dash-sidebar-portal-dot" />
            <span className="dash-sidebar-portal-label">{portalLabel}</span>
          </div>
        )}
      </div>

      <div className="dash-sidebar-nav">
        {sections.map((section) => (
        <div key={section.title} className="dash-sidebar-section">
          <p className="dash-sidebar-section-title">{section.title}</p>
          {section.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'dash-sidebar-link dash-sidebar-link-active' : 'dash-sidebar-link'
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.soon && <span className="dash-sidebar-soon-badge">Soon</span>}
            </NavLink>
          ))}
        </div>
      ))}
      </div>

      <button onClick={handleLogout} className="dash-sidebar-link dash-sidebar-logout-btn">
        <LogOut size={20} />
        <span>Logout</span>
      </button>

      <NavLink to="/dashboard/profile" className="dash-sidebar-profile-footer">
        <div className="dash-sidebar-profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <div className="dash-sidebar-profile-info">
          <p className="dash-sidebar-profile-name">{user?.name}</p>
          <p className="dash-sidebar-profile-link">View Profile</p>
        </div>
        <ChevronRight size={16} />
      </NavLink>
    </aside>
  );
};

export default DashboardSidebar;
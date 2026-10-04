import { useState, useEffect } from 'react';
import { Shield, MessageCircle, Users2, Smile, ShieldCheck, UserPlus, BookPlus, CalendarPlus, FileText, Send } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import DashStatCard from '../DashStatCard';
import { adminNavSections } from './adminNavConfig';
import { getAdminStats, type AdminStats } from '../statsService';
import './AdminDashboardPage.css';

const services = [
  { name: 'Backend API', status: 'Operational' },
  { name: 'Database', status: 'Operational' },
  { name: 'AI Service', status: 'Operational' },
  { name: 'Notification Service', status: 'Operational' },
  { name: 'Payment Service', status: 'Operational' },
  { name: 'Storage Service', status: 'Operational' },
];

const aiMetrics = [
  { label: 'Total Conversations', value: '—', change: 'Coming soon', icon: MessageCircle },
  { label: 'Resource Utilization', value: '—', change: 'Coming soon', icon: Users2 },
  { label: 'User Satisfaction', value: '—', change: 'Coming soon', icon: Smile },
  { label: 'Response Accuracy', value: '—', change: 'Coming soon', icon: ShieldCheck },
];

const quickActions = [
  { label: 'Add User', meta: 'Create new user', icon: UserPlus },
  { label: 'Create Course', meta: 'Add new course', icon: BookPlus },
  { label: 'Create Event', meta: 'Schedule new event', icon: CalendarPlus },
  { label: 'Publish Content', meta: 'Add new content', icon: FileText },
  { label: 'Send Notification', meta: 'Send announcement', icon: Send },
];

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="ADMIN PORTAL" sections={adminNavSections} homePath="/admin" />

      <main className="dash-main">
        <DashboardHeader
          title="Admin Dashboard"
          subtitle="Here's what's happening across your platform."
        />

        <div className="dash-stats-grid">
          <DashStatCard label="Total Users" value={String(stats?.totalUsers ?? 0)} meta={`${stats?.activeUsers ?? 0} verified`} />
          <DashStatCard label="Published Courses" value={String(stats?.totalCourses ?? 0)} meta={`${stats?.totalEnrollments ?? 0} enrollments`} />
          <DashStatCard label="Shop Orders" value={String(stats?.totalOrders ?? 0)} meta={`${stats?.totalProducts ?? 0} products live`} />
          <DashStatCard label="Total Revenue" value={`₹${stats?.totalRevenue ?? 0}`} meta="courses + shop" />
        </div>

        <div className="admin-widgets-grid">
          <div className="admin-widget-card">
            <h3 className="admin-widget-title">Platform Overview</h3>
            <p className="admin-widget-subtext">Live snapshot of platform activity.</p>
            <div className="admin-growth-placeholder">
              <p>{stats?.totalUsers ?? 0} users · {stats?.totalEnrollments ?? 0} course enrollments · {stats?.totalOrders ?? 0} orders</p>
            </div>
          </div>

          <div className="admin-widget-card">
            <h3 className="admin-widget-title">
              <span className="admin-widget-icon-badge"><Shield size={16} /></span>
              System Health
            </h3>
            <p className="admin-widget-subtext">All services running smoothly</p>

            <ul className="admin-service-list">
              {services.map((service) => (
                <li key={service.name} className="admin-service-row">
                  <span>{service.name}</span>
                  <span className="admin-service-status">
                    <span className="admin-status-dot" /> {service.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-widget-card">
            <h3 className="admin-widget-title">Recent Activity</h3>
            <ul className="admin-activity-list">
              {(stats?.recentActivity ?? []).map((activity, index) => (
                <li key={index} className="admin-activity-row">
                  <div className="admin-activity-info">
                    <p className="admin-activity-text">{activity.text}</p>
                    <p className="admin-activity-meta">{activity.meta}</p>
                  </div>
                  <span className="admin-activity-time">{new Date(activity.created_at).toLocaleDateString()}</span>
                </li>
              ))}
              {(!stats || stats.recentActivity.length === 0) && (
                <p className="admin-widget-subtext">No recent activity yet.</p>
              )}
            </ul>
          </div>

          <div className="admin-widget-card">
            <div className="dash-widget-header-row">
              <h3 className="admin-widget-title">AI Analytics Overview</h3>
              <span className="admin-widget-period">Coming Soon</span>
            </div>

            <ul className="admin-metric-list">
              {aiMetrics.map((metric) => (
                <li key={metric.label} className="admin-metric-row">
                  <span className="admin-metric-icon"><metric.icon size={16} /></span>
                  <div className="admin-metric-info">
                    <p className="admin-metric-label">{metric.label}</p>
                    <p className="admin-metric-value">{metric.value}</p>
                  </div>
                  <span className="admin-metric-change">{metric.change}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-widget-card">
            <h3 className="admin-widget-title">Quick Actions</h3>
            <p className="admin-widget-subtext">Manage your platform efficiently</p>
            <ul className="admin-action-list">
              {quickActions.map((action) => (
                <li key={action.label} className="admin-action-row">
                  <span className="admin-widget-icon-badge"><action.icon size={16} /></span>
                  <div className="admin-activity-info">
                    <p className="admin-activity-text">{action.label}</p>
                    <p className="admin-activity-meta">{action.meta}</p>
                  </div>
                  <span className="dash-widget-link">→</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
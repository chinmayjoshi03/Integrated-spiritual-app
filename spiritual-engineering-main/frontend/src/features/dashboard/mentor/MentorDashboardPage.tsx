import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import DashStatCard from '../DashStatCard';
import { mentorNavSections } from './mentorNavConfig';
import './MentorDashboardPage.css';
import { getMentorStats, type MentorStats } from '../statsService';

const progressMetrics = [
  { label: 'Mindfulness', value: 85 },
  { label: 'Emotional Well-being', value: 78 },
  { label: 'Inner Growth', value: 82 },
  { label: 'Life Balance', value: 75 },
];

const sessions = [
  { day: 'TODAY', time: '5:00 PM', title: 'Meditation Session', student: 'Aarav Sharma', meta: '45 min · 1:1 Session', action: 'Join Session' },
  { day: 'TOMORROW', time: '11:00 AM', title: 'Mindfulness Guidance', student: 'Priya Mehta', meta: '30 min · Group Session', action: 'Join Session' },
  { day: 'MAY 16', time: '4:00 PM', title: 'Inner Peace & Clarity', student: 'Rahul Verma', meta: '45 min · 1:1 Session', action: 'View Details' },
];

const quickActions = [
  { label: 'Schedule Session', meta: 'Book a session with student' },
  { label: 'Add Student', meta: 'Add a new mentee' },
  { label: 'Create Resource', meta: 'Share learning material' },
  { label: 'Send Message', meta: 'Message your students' },
];

const MentorDashboardPage = () => {
  const [stats, setStats] = useState<MentorStats | null>(null);

  useEffect(() => {
    getMentorStats().then(setStats).catch(() => {});
  }, []);
  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MENTOR PORTAL" sections={mentorNavSections} homePath="/mentor" />

      <main className="dash-main">
        <DashboardHeader
          title="Mentor Dashboard"
          subtitle="Here's what's happening with your learners today."
        />

<div className="dash-stats-grid">
  <DashStatCard label="Students" value={String(stats?.totalStudents ?? 0)} meta="across your courses" />
  <DashStatCard label="Active Courses" value={String(stats?.activeCourses ?? 0)} meta={`${stats?.totalCourses ?? 0} total`} />
  <DashStatCard label="Upcoming Sessions" value="—" meta="Coming soon" />
  <DashStatCard label="Average Progress" value="—" meta="Coming soon" />
</div>

        <div className="mentor-row">
          <div className="admin-widget-card mentor-progress-card">
            <div className="dash-widget-header-row">
              <h3 className="admin-widget-title">Student Progress</h3>
              <span className="admin-widget-period">This Month ⌄</span>
            </div>

            {progressMetrics.map((metric) => (
              <div key={metric.label} className="mentor-progress-row">
                <div className="mentor-progress-label-row">
                  <span>{metric.label}</span>
                  <span>{metric.value}%</span>
                </div>
                <div className="mentor-progress-track">
                  <div className="mentor-progress-fill" style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="admin-widget-card">
            <div className="dash-widget-header-row">
              <h3 className="admin-widget-title">Upcoming Sessions</h3>
              <a href="#" className="dash-widget-link">View Calendar →</a>
            </div>

            {sessions.map((session) => (
              <div key={session.title} className="mentor-session-row">
                <div className="mentor-session-day">
                  <span>{session.day}</span>
                  <strong>{session.time}</strong>
                </div>
                <span className="admin-widget-icon-badge"><CalendarIcon size={16} /></span>
                <div className="mentor-session-info">
                  <p className="admin-activity-text">{session.title}</p>
                  <p className="admin-activity-meta">{session.student}</p>
                  <p className="admin-activity-meta">{session.meta}</p>
                </div>
                <button className="dash-event-register-btn">{session.action}</button>
              </div>
            ))}
          </div>
        </div>

        <div className="mentor-row">
          <div className="admin-widget-card">
            <div className="dash-widget-header-row">
              <h3 className="admin-widget-title">Recent Student Activity</h3>
              <a href="#" className="dash-widget-link">View All →</a>
            </div>
            <ul className="admin-activity-list">
  {(stats?.recentActivity ?? []).map((activity, index) => (
    <li key={index} className="admin-activity-row">
      <div className="admin-activity-info">
        <p className="admin-activity-text">New enrollment</p>
        <p className="admin-activity-meta">{activity.name} enrolled in {activity.title}</p>
      </div>
      <span className="admin-activity-time">{new Date(activity.purchased_at).toLocaleDateString()}</span>
    </li>
  ))}
  {(!stats || stats.recentActivity.length === 0) && (
    <p className="admin-widget-subtext">No recent activity yet.</p>
  )}
</ul>
          </div>

          <div className="admin-widget-card">
            <h3 className="admin-widget-title">Quick Actions</h3>
            <div className="mentor-quick-actions-grid">
              {quickActions.map((action) => (
                <div key={action.label} className="mentor-quick-action-tile">
                  <p className="admin-activity-text">+ {action.label}</p>
                  <p className="admin-activity-meta">{action.meta}</p>
                </div>
              ))}
            </div>
            <button className="dash-widget-btn mentor-view-all-btn">
              View All Students <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MentorDashboardPage;
import { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { userNavSections } from './userNavConfig';
import { useAuth } from '@/hooks/useAuth';
import { getMeditationStats, type MeditationStats } from '@/features/meditation/meditationService';
import { getMyEnrolledCourses, type Course } from '@/features/courses/courseService';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MeditationStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    getMeditationStats().then(setStats).catch(() => {});
    getMyEnrolledCourses().then(setCourses).catch(() => {});
  }, []);

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />

      <main className="dash-main">
        <DashboardHeader title="Profile" subtitle="Your account and activity." />

        <div className="profile-header-card">
          <div className="profile-avatar-large">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <p className="profile-name">{user?.name}</p>
            <p className="profile-email">{user?.email}</p>
            <span className="profile-role-badge">{user?.role}</span>
          </div>
        </div>

        <div className="dash-stats-grid" style={{ marginTop: 'var(--spacing-xl)' }}>
          <div className="dash-stat-card">
            <p className="dash-stat-label">Meditation Sessions</p>
            <p className="dash-stat-value">{stats?.sessionsPlayed ?? 0}</p>
            <p className="dash-stat-meta">{stats?.sessionsCompleted ?? 0} completed</p>
          </div>
          <div className="dash-stat-card">
            <p className="dash-stat-label">Bookmarked</p>
            <p className="dash-stat-value">{stats?.bookmarkCount ?? 0}</p>
            <p className="dash-stat-meta">saved meditations</p>
          </div>
          <div className="dash-stat-card">
            <p className="dash-stat-label">Enrolled Courses</p>
            <p className="dash-stat-value">{courses.length}</p>
            <p className="dash-stat-meta">active courses</p>
          </div>
        </div>

        <h3 className="admin-widget-title" style={{ marginTop: 'var(--spacing-xl)' }}>
          My Courses
        </h3>

        {courses.length === 0 ? (
          <p className="admin-widget-subtext">You haven't enrolled in any courses yet.</p>
        ) : (
          <div className="lessons-list">
            {courses.map((course) => (
              <div key={course.id} className="lesson-row">
                <div className="lesson-info">
                  <p className="admin-activity-text">{course.title}</p>
                  <p className="admin-activity-meta">with {course.mentor_name || 'TBD'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
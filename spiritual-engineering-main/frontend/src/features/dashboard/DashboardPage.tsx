import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flower2, Sparkles, BookOpen } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import DashStatCard from './DashStatCard';
import { userNavSections } from './userNavConfig';
import { useAuth } from '@/hooks/useAuth';
import { getMeditationStats, type MeditationStats } from '@/features/meditation/meditationService';
import { getMyEnrolledCourses, type Course } from '@/features/courses/courseService';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [meditationStats, setMeditationStats] = useState<MeditationStats | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);

  useEffect(() => {
    getMeditationStats().then(setMeditationStats).catch(() => {});
    getMyEnrolledCourses().then(setEnrolledCourses).catch(() => {});
  }, []);

  const mostRecentCourse = enrolledCourses[0];

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />

      <main className="dash-main">
        <DashboardHeader
          title={`Good Morning, ${user?.name ?? ''}`}
          subtitle="Take a moment for yourself today."
        />

        <div className="dash-stats-grid">
          <DashStatCard
            label="Meditation Sessions"
            value={String(meditationStats?.sessionsPlayed ?? 0)}
            meta={`${meditationStats?.sessionsCompleted ?? 0} completed`}
          />
          <DashStatCard
            label="Bookmarked"
            value={String(meditationStats?.bookmarkCount ?? 0)}
            meta="saved meditations"
          />
          <DashStatCard
            label="Enrolled Courses"
            value={String(enrolledCourses.length)}
            meta="active courses"
          />
          <DashStatCard label="Spiritual Streak" value="—" meta="coming soon" />
        </div>

        <div className="dash-widgets-grid">
          <div className="dash-widget-card">
            <h3 className="dash-widget-title">
              <span className="dash-widget-icon-badge"><Flower2 size={16} /></span>
              Continue Meditation
            </h3>
            {meditationStats?.lastPlayed ? (
              <>
                <p className="dash-widget-value">{meditationStats.lastPlayed.title}</p>
                <p className="dash-widget-subtext">
                  {meditationStats.lastPlayed.completed ? 'Completed' : 'In progress'}
                </p>
                <Link
                  to={`/dashboard/meditation/${meditationStats.lastPlayed.id}`}
                  className="dash-widget-btn"
                  style={{ display: 'inline-block', textDecoration: 'none' }}
                >
                  {meditationStats.lastPlayed.completed ? 'Play Again' : 'Resume'} →
                </Link>
              </>
            ) : (
              <>
                <p className="dash-widget-subtext">You haven't started a meditation yet.</p>
                <Link to="/dashboard/meditation" className="dash-widget-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  Explore Meditations →
                </Link>
              </>
            )}
          </div>

          <div className="dash-widget-card">
            <h3 className="dash-widget-title">
              <span className="dash-widget-icon-badge"><BookOpen size={16} /></span>
              My Courses
            </h3>
            {mostRecentCourse ? (
              <>
                <p className="dash-widget-value">{mostRecentCourse.title}</p>
                <p className="dash-widget-subtext">with {mostRecentCourse.mentor_name || 'TBD'}</p>
                <Link
                  to={`/dashboard/courses/${mostRecentCourse.id}`}
                  className="dash-widget-btn"
                  style={{ display: 'inline-block', textDecoration: 'none' }}
                >
                  Continue Course →
                </Link>
              </>
            ) : (
              <>
                <p className="dash-widget-subtext">You haven't enrolled in any courses yet.</p>
                <Link to="/dashboard/courses" className="dash-widget-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  Browse Courses →
                </Link>
              </>
            )}
          </div>

          <div className="dash-widget-card">
            <h3 className="dash-widget-title">
              <span className="dash-widget-icon-badge"><Sparkles size={16} /></span>
              AI Guide
            </h3>
            <p className="dash-widget-subtext">
              Personalized recommendations are coming in a later phase.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
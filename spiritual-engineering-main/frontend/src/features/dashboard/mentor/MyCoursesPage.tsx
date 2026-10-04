import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { useAuth } from '@/hooks/useAuth';
import { mentorNavSections } from './mentorNavConfig';
import { getCourses, type Course } from '@/features/courses/courseService';

const MyCoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    getCourses().then((allCourses) => {
      const mine = allCourses.filter((c) => c.mentor_id === user?.id);
      setCourses(mine);
    });
  }, [user]);

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MENTOR PORTAL" sections={mentorNavSections} homePath="/mentor" />

      <main className="dash-main">
        <DashboardHeader title="My Courses" subtitle="Courses assigned to you." />

        {courses.length === 0 ? (
          <p className="admin-widget-subtext">No courses assigned to you yet.</p>
        ) : (
          <div className="dash-widgets-grid">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/mentor/courses/${course.id}/manage`}
                className="admin-widget-card"
                style={{ display: 'block' }}
              >
                <h3 className="admin-widget-title">{course.title}</h3>
                <p className="admin-widget-subtext">{course.description}</p>
                <p className="dash-widget-link">Manage Lessons →</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyCoursesPage;
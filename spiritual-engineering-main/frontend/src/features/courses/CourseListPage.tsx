import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { userNavSections } from '@/features/dashboard/userNavConfig';
import { getCourses, type Course } from './courseService';
import './CourseListPage.css';

const CourseListPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCourses()
      .then(setCourses)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />

      <main className="dash-main">
        <DashboardHeader title="Courses" subtitle="Deepen your practice with guided courses." />

        {isLoading ? (
          <p className="admin-widget-subtext">Loading...</p>
        ) : (
          <div className="course-grid">
            {courses.map((course) => (
              <Link key={course.id} to={`/dashboard/courses/${course.id}`} className="course-card">
                {course.thumbnail_url ? (
    <img src={course.thumbnail_url} alt={course.title} className="shop-card-image" />
  ) : (
    <div className="shop-card-image-placeholder">No image</div>
  )}
                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-mentor">with {course.mentor_name || 'TBD'}</p>
                <p className="course-card-desc">{course.description}</p>
                <p className="course-card-price">₹{course.price}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseListPage;
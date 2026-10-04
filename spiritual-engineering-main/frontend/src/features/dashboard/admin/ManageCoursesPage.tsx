import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { adminNavSections } from './adminNavConfig';
import { getCourses, updateCourse, getMentors, type Course, type Mentor } from '@/features/courses/courseService';

type StatusFilter = 'all' | 'draft' | 'published' | 'cancelled';

const ManageCoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  const loadCourses = (filter: StatusFilter) => {
    getCourses(filter === 'all' ? undefined : filter).then(setCourses);
  };

  useEffect(() => {
    loadCourses(activeFilter);
    getMentors().then(setMentors);
  }, [activeFilter]);

  const handleMentorChange = async (courseId: number, mentorId: string) => {
    await updateCourse(courseId, { mentorId: Number(mentorId) });
    loadCourses(activeFilter);
  };

  const handleStatusChange = async (course: Course, newStatus: 'draft' | 'published' | 'cancelled') => {
    await updateCourse(course.id, { status: newStatus });
    loadCourses(activeFilter);
  };

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="ADMIN PORTAL" sections={adminNavSections} homePath="/admin" />

      <main className="dash-main">
        <div className="dash-widget-header-row">
          <DashboardHeader title="Manage Courses" subtitle="View, assign mentors, and publish courses." />
          <Link to="/admin/courses/create" className="dash-widget-btn">+ New Course</Link>
        </div>

        <div className="med-category-tabs">
          {(['all', 'published', 'draft', 'cancelled'] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              className={activeFilter === filter ? 'med-tab med-tab-active' : 'med-tab'}
              onClick={() => setActiveFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        <div className="lessons-list">
          {courses.length === 0 ? (
            <p className="admin-widget-subtext">No courses found for this filter.</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="lesson-row">
                <div className="lesson-info">
                  <p className="admin-activity-text">{course.title}</p>
                  <p className="admin-activity-meta">
                    ₹{course.price} · <span className={`status-pill status-${course.status}`}>{course.status}</span>
                  </p>
                </div>

                <select
                  value={course.mentor_id ?? ''}
                  onChange={(e) => handleMentorChange(course.id, e.target.value)}
                >
                  <option value="">No mentor</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={mentor.id}>
                      {mentor.name}
                    </option>
                  ))}
                </select>

                <select
                  value={course.status}
                  onChange={(e) => handleStatusChange(course, e.target.value as 'draft' | 'published' | 'cancelled')}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageCoursesPage;
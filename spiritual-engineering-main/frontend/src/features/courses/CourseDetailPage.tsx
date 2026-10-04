import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, PlayCircle, FileText } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { userNavSections } from '@/features/dashboard/userNavConfig';
import {
  getCourseById,
  getLessons,
  getEnrollmentStatus,
  enrollInCourse,
  type Course,
  type Lesson,
} from './courseService';
import './CourseDetailPage.css';

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [locked, setLocked] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  const loadData = () => {
    if (!id) return;
    getCourseById(id).then(setCourse);
    getEnrollmentStatus(Number(id)).then(setIsEnrolled);
    getLessons(id).then((data) => {
      setLessons(data.lessons);
      setLocked(data.locked);
    });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleEnroll = async () => {
    if (!id) return;
    setError('');
    setIsEnrolling(true);

    try {
      await enrollInCourse(Number(id));
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Enrollment failed. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (!course) {
    return (
      <div className="dash-layout">
        <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />
        <main className="dash-main">
          <p className="admin-widget-subtext">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />

      <main className="dash-main">
        <DashboardHeader title={course.title} subtitle={`with ${course.mentor_name || 'TBD'}`} />

        <p className="admin-widget-subtext">{course.description}</p>

        {!isEnrolled && (
          <div className="course-buy-box">
            <p className="course-buy-price">₹{course.price}</p>
            {error && <p className="error-text">{error}</p>}
            <button onClick={handleEnroll} className="dash-widget-btn" disabled={isEnrolling}>
              {isEnrolling ? 'Processing...' : 'Buy Course'}
            </button>
          </div>
        )}

        <h3 className="admin-widget-title" style={{ marginTop: 'var(--spacing-xl)' }}>
          Curriculum
        </h3>

        <div className="lessons-list">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="lesson-row">
              <span className="lesson-position">{lesson.position}</span>
              <div className="lesson-info">
                <p className="admin-activity-text">{lesson.title}</p>
                <p className="admin-activity-meta">{lesson.content_type.toUpperCase()}</p>
              </div>

              {locked ? (
                <Lock size={18} color="var(--color-text-muted)" />
              ) : lesson.content_type === 'video' ? (
                <a href={lesson.content_url} target="_blank" rel="noopener noreferrer">
                  <PlayCircle size={20} color="var(--color-primary)" />
                </a>
              ) : (
                <a href={lesson.content_url} target="_blank" rel="noopener noreferrer">
                  <FileText size={20} color="var(--color-primary)" />
                </a>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CourseDetailPage;
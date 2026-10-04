import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Video as VideoIcon, Lock } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { userNavSections } from '@/features/dashboard/userNavConfig';
import { getCategories, getMeditations, type MeditationCategory, type Meditation } from './meditationService';
import { getMyEnrolledCourses, type Course } from '@/features/courses/courseService';
import './MeditationListPage.css';

const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)} min`;

type Scope = 'all' | 'general' | number;

const MeditationListPage = () => {
  const [categories, setCategories] = useState<MeditationCategory[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [activeScope, setActiveScope] = useState<Scope>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getMyEnrolledCourses().then(setEnrolledCourses).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const options: { categoryId?: number; courseId?: number; scope?: 'general' } = {};
    if (activeCategory) options.categoryId = activeCategory;
    if (activeScope === 'general') options.scope = 'general';
    if (typeof activeScope === 'number') options.courseId = activeScope;

    getMeditations(options)
      .then(setMeditations)
      .finally(() => setIsLoading(false));
  }, [activeCategory, activeScope]);

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MY SPACE" sections={userNavSections} homePath="/dashboard" />

      <main className="dash-main">
        <DashboardHeader title="Meditation" subtitle="Find a moment of stillness." />

        <div className="med-filter-section">
          <p className="med-filter-label">Browse</p>
          <div className="med-category-tabs">
            <button
              className={activeScope === 'all' ? 'med-tab med-tab-active' : 'med-tab'}
              onClick={() => setActiveScope('all')}
            >
              All
            </button>
            <button
              className={activeScope === 'general' ? 'med-tab med-tab-active' : 'med-tab'}
              onClick={() => setActiveScope('general')}
            >
              General (Free)
            </button>
            {enrolledCourses.map((course) => (
              <button
                key={course.id}
                className={activeScope === course.id ? 'med-tab med-tab-active' : 'med-tab'}
                onClick={() => setActiveScope(course.id)}
              >
                {course.title}
              </button>
            ))}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="med-filter-section">
            <p className="med-filter-label">Category</p>
            <div className="med-category-tabs">
              <button
                className={activeCategory === null ? 'med-tab med-tab-active' : 'med-tab'}
                onClick={() => setActiveCategory(null)}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={activeCategory === category.id ? 'med-tab med-tab-active' : 'med-tab'}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="loading-state">Loading...</p>
        ) : meditations.length === 0 ? (
          <p className="admin-widget-subtext">No meditations found for this filter.</p>
        ) : (
          <div className="med-grid">
            {meditations.map((meditation) => (
              <Link key={meditation.id} to={`/dashboard/meditation/${meditation.id}`} className="med-card">
                <div className="med-card-icon">
                  {meditation.locked ? (
                    <Lock size={20} />
                  ) : meditation.media_type === 'video' ? (
                    <VideoIcon size={20} />
                  ) : (
                    <Play size={20} />
                  )}
                </div>
                <h3 className="med-card-title">{meditation.title}</h3>
                <p className="med-card-meta">
                  {meditation.category_name || 'Uncategorized'} · {formatDuration(meditation.duration_seconds)}
                </p>
                {meditation.course_title && (
                  <p className="med-card-course-tag">{meditation.course_title}</p>
                )}
                {meditation.locked && <p className="med-card-locked-tag">Enroll to unlock</p>}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MeditationListPage;
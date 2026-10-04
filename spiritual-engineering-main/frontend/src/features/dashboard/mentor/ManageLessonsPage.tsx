import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trash2, Flower2, FileText, PlayCircle } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { mentorNavSections } from './mentorNavConfig';
import { getCourseById, getLessons, createLesson, deleteLesson, type Course, type Lesson } from '@/features/courses/courseService';
import { getMeditations, type Meditation } from '@/features/meditation/meditationService';
import './ManageLessonsPage.css';

const ManageLessonsPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [showLessonForm, setShowLessonForm] = useState(false);

  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<'video' | 'pdf'>('video');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLessons = () => {
    if (!courseId) return;
    getLessons(courseId).then((data) => setLessons(data.lessons));
  };

  const loadMeditations = () => {
    if (!courseId) return;
    getMeditations({ courseId: Number(courseId) }).then(setMeditations);
  };

  useEffect(() => {
    if (!courseId) return;
    getCourseById(courseId).then(setCourse);
    loadLessons();
    loadMeditations();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    if (!title || !file) {
      setError('Title and a content file are required.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('contentType', contentType);
      formData.append('position', String(lessons.length + 1));
      formData.append('content', file);

      await createLesson(courseId, formData);

      setTitle('');
      setFile(null);
      setShowLessonForm(false);
      loadLessons();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add lesson.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (lessonId: number) => {
    if (!courseId) return;
    await deleteLesson(courseId, lessonId);
    loadLessons();
  };

  const openContent = (url: string | null | undefined) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderLessonRow = (lesson: Lesson) => {
    return (
      <div key={lesson.id} className="lesson-row lesson-row-clickable" onClick={() => openContent(lesson.content_url)}>
        <span className="lesson-position">{lesson.position}</span>
        {lesson.content_type === 'video' ? (
          <PlayCircle size={18} color="var(--color-primary)" />
        ) : (
          <FileText size={18} color="var(--color-primary)" />
        )}
        <div className="lesson-info">
          <p className="admin-activity-text">{lesson.title}</p>
          <p className="admin-activity-meta">{lesson.content_type.toUpperCase()}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(lesson.id);
          }}
          className="lesson-delete-btn"
          aria-label="Delete lesson"
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  };

  const renderMeditationRow = (meditation: Meditation) => {
    return (
      <div key={meditation.id} className="lesson-row lesson-row-clickable" onClick={() => openContent(meditation.media_url)}>
        <PlayCircle size={18} color="var(--color-primary)" />
        <div className="lesson-info">
          <p className="admin-activity-text">{meditation.title}</p>
          <p className="admin-activity-meta">{meditation.media_type.toUpperCase()}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="MENTOR PORTAL" sections={mentorNavSections} homePath="/mentor" />

      <main className="dash-main">
        <DashboardHeader title={course?.title || 'Manage Course'} subtitle="Track and manage this course's content." />

        <div className="dash-widget-header-row">
          <h3 className="admin-widget-title">Lessons</h3>
          <button className="dash-widget-btn" onClick={() => setShowLessonForm((prev) => !prev)}>
            {showLessonForm ? 'Cancel' : '+ Upload Lesson'}
          </button>
        </div>

        <div className="lessons-list">
          {lessons.length === 0 ? (
            <p className="admin-widget-subtext">No lessons uploaded yet.</p>
          ) : (
            lessons.map((lesson) => renderLessonRow(lesson))
          )}
        </div>

        {showLessonForm && (
          <form onSubmit={handleSubmit} className="upload-form" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div className="upload-field">
              <label>Lesson Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="upload-field">
              <label>Content Type</label>
              <select value={contentType} onChange={(e) => setContentType(e.target.value as 'video' | 'pdf')}>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            <div className="upload-field">
              <label>Content File</label>
              <input
                type="file"
                accept={contentType === 'video' ? 'video/*' : 'application/pdf'}
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="dash-widget-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Lesson'}
            </button>
          </form>
        )}

        <div className="dash-widget-header-row">
          <h3 className="admin-widget-title">
            <span className="admin-widget-icon-badge"><Flower2 size={16} /></span>
            Meditation Content
          </h3>
          <Link to={`/mentor/upload-meditation?courseId=${courseId}`} className="dash-widget-btn">
            + Upload Meditation
          </Link>
        </div>

        <div className="lessons-list">
          {meditations.length === 0 ? (
            <p className="admin-widget-subtext">No meditation content uploaded for this course yet.</p>
          ) : (
            meditations.map((meditation) => renderMeditationRow(meditation))
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageLessonsPage;
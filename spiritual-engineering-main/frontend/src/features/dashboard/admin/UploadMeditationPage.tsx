import { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { adminNavSections } from './adminNavConfig';
import { getCategories, uploadMeditation, type MeditationCategory } from '@/features/meditation/meditationService';
import { getCourses, type Course } from '@/features/courses/courseService';

const UploadMeditationPage = () => {
  const [categories, setCategories] = useState<MeditationCategory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getCourses().then(setCourses).catch(() => {});
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDurationSeconds('');
    setCategoryId('');
    setCourseId('');
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !durationSeconds || !file) {
      setError('Title, duration, and a media file are required.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('mediaType', mediaType);
      formData.append('durationSeconds', durationSeconds);
      if (categoryId) formData.append('categoryId', categoryId);
      if (courseId) formData.append('courseId', courseId);
      formData.append('media', file);

      await uploadMeditation(formData);

      setSuccessMessage('Meditation uploaded successfully.');
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="ADMIN PORTAL" sections={adminNavSections} homePath="/admin" />

      <main className="dash-main">
        <DashboardHeader title="Upload Meditation" subtitle="Add meditation content for any course, or general content." />

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-field">
            <label>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="upload-field">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="upload-field-row">
            <div className="upload-field">
              <label>Media Type</label>
              <select value={mediaType} onChange={(e) => setMediaType(e.target.value as 'audio' | 'video')}>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div className="upload-field">
              <label>Duration (seconds)</label>
              <input type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)} />
            </div>
          </div>

          <div className="upload-field-row">
            <div className="upload-field">
              <label>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="upload-field">
              <label>Link to Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">General (not tied to a course)</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="upload-field">
            <label>Media File</label>
            <input
              type="file"
              accept={mediaType === 'audio' ? 'audio/*' : 'video/*'}
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />
          </div>

          {error && <p className="error-text">{error}</p>}
          {successMessage && <p style={{ color: 'green', fontSize: '0.9rem' }}>{successMessage}</p>}

          <button type="submit" className="dash-widget-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload Meditation'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default UploadMeditationPage;
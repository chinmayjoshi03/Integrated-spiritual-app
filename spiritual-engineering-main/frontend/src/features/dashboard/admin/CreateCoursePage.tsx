import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader/DashboardHeader';
import { adminNavSections } from './adminNavConfig';
import { getMentors, createCourse, type Mentor } from '@/features/courses/courseService';

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<Mentor[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getMentors().then(setMentors).catch(() => setError('Could not load mentors.'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      setError('Course title is required.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price || '0');
      if (mentorId) formData.append('mentorId', mentorId);
      if (thumbnail) formData.append('thumbnail', thumbnail);

      await createCourse(formData);
      navigate('/admin/courses');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dash-layout">
      <DashboardSidebar portalLabel="ADMIN PORTAL" sections={adminNavSections} homePath="/admin" />

      <main className="dash-main">
        <DashboardHeader title="Create Course" subtitle="Add a new course and assign a mentor." />

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-field">
            <label>Course Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="upload-field">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          <div className="upload-field-row">
            <div className="upload-field">
              <label>Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>

            <div className="upload-field">
              <label>Assign Mentor</label>
              <select value={mentorId} onChange={(e) => setMentorId(e.target.value)}>
                <option value="">No mentor yet</option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.name} ({mentor.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="upload-field">
            <label>Course Thumbnail</label>
            <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files ? e.target.files[0] : null)} />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="dash-widget-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Course'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default CreateCoursePage;
import pool from '../db.js';
import { getFileUrl } from '../utils/storage.js';

const verifyMentorOwnsCourse = async (courseId, userId, userRole) => {
  const result = await pool.query('SELECT mentor_id FROM courses WHERE id = $1', [courseId]);

  if (result.rows.length === 0) {
    return { authorized: false, error: 'Course not found.', status: 404 };
  }

  const course = result.rows[0];

  if (userRole === 'admin' || course.mentor_id === userId) {
    return { authorized: true };
  }

  return { authorized: false, error: 'You are not the assigned mentor for this course.', status: 403 };
};

export const createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, contentType, position, durationSeconds } = req.body || {};
    const userId = req.user.userId;
    const userRole = req.user.role;

    const ownership = await verifyMentorOwnsCourse(courseId, userId, userRole);
    if (!ownership.authorized) {
      return res.status(ownership.status).json({ error: ownership.error });
    }

    if (!title || !contentType || position === undefined) {
      return res.status(400).json({ error: 'Title, content type, and position are required.' });
    }

    if (!['video', 'pdf'].includes(contentType)) {
      return res.status(400).json({ error: 'Content type must be video or pdf.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'A content file is required.' });
    }

    const contentUrl = getFileUrl(req.file.filename);

    const result = await pool.query(
      `INSERT INTO course_lessons (course_id, title, content_type, content_url, position, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [courseId, title, contentType, contentUrl, position, durationSeconds || null]
    );

    res.status(201).json({ lesson: result.rows[0] });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const getLessonsByCourse = async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
  
      const courseResult = await pool.query('SELECT mentor_id FROM courses WHERE id = $1', [courseId]);
      if (courseResult.rows.length === 0) {
        return res.status(404).json({ error: 'Course not found.' });
      }
  
      const isMentorOrAdmin =
        userRole === 'admin' || (userRole === 'mentor' && courseResult.rows[0].mentor_id === userId);
  
      let hasAccess = isMentorOrAdmin;
  
      if (!hasAccess && userId) {
        const enrollment = await pool.query(
          'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
          [userId, courseId]
        );
        hasAccess = enrollment.rows.length > 0;
      }
  
      const result = await pool.query(
        'SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY position ASC',
        [courseId]
      );
  
      if (!hasAccess) {
        const preview = result.rows.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          content_type: lesson.content_type,
          position: lesson.position,
          duration_seconds: lesson.duration_seconds,
        }));
        return res.status(200).json({ lessons: preview, locked: true });
      }
  
      res.status(200).json({ lessons: result.rows, locked: false });
    } catch (error) {
      console.error('Get lessons error:', error);
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  };

export const updateLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { title, position, durationSeconds } = req.body || {};
    const userId = req.user.userId;
    const userRole = req.user.role;

    const ownership = await verifyMentorOwnsCourse(courseId, userId, userRole);
    if (!ownership.authorized) {
      return res.status(ownership.status).json({ error: ownership.error });
    }

    const result = await pool.query(
      `UPDATE course_lessons
       SET title = COALESCE($1, title),
           position = COALESCE($2, position),
           duration_seconds = COALESCE($3, duration_seconds)
       WHERE id = $4 AND course_id = $5
       RETURNING *`,
      [title, position, durationSeconds, lessonId, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    res.status(200).json({ lesson: result.rows[0] });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const ownership = await verifyMentorOwnsCourse(courseId, userId, userRole);
    if (!ownership.authorized) {
      return res.status(ownership.status).json({ error: ownership.error });
    }

    await pool.query('DELETE FROM course_lessons WHERE id = $1 AND course_id = $2', [lessonId, courseId]);

    res.status(200).json({ message: 'Lesson deleted successfully.' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
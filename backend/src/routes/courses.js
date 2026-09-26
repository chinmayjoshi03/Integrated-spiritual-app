const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notFound(res, entity = 'Resource') {
  return res.status(404).json({ error: `${entity} not found.` });
}

// ─── Courses ──────────────────────────────────────────────────────────────────

/**
 * GET /api/courses
 * List all published courses, enriched with the requesting user's progress.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows: courses } = await pool.query(
      `SELECT id, title, description, thumbnail_url, level, total_lessons, sort_order
       FROM courses
       WHERE is_published = true
       ORDER BY sort_order ASC, id ASC`
    );

    // Attach per-course progress for this user
    const { rows: progress } = await pool.query(
      `SELECT l.course_id,
              COUNT(lp.id) FILTER (WHERE lp.completed = true) AS completed_lessons
       FROM lesson_progress lp
       JOIN lessons l ON l.id = lp.lesson_id
       WHERE lp.user_id = $1
       GROUP BY l.course_id`,
      [req.user.id]
    );

    const progressMap = {};
    for (const p of progress) {
      progressMap[p.course_id] = parseInt(p.completed_lessons, 10);
    }

    const result = courses.map((c) => ({
      ...c,
      completed_lessons: progressMap[c.id] || 0,
      progress_pct:
        c.total_lessons > 0
          ? Math.round(((progressMap[c.id] || 0) / c.total_lessons) * 100)
          : 0,
    }));

    res.json({ courses: result });
  } catch (err) {
    console.error('GET /courses error:', err.message);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

/**
 * GET /api/courses/:courseId
 * Full detail for one course (lessons, resources, assignments, quizzes),
 * with the user's per-lesson completion status.
 */
router.get('/:courseId', authenticate, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  if (isNaN(courseId)) return notFound(res, 'Course');

  try {
    const { rows: courseRows } = await pool.query(
      `SELECT id, title, description, thumbnail_url, level, total_lessons
       FROM courses WHERE id = $1 AND is_published = true`,
      [courseId]
    );
    if (!courseRows.length) return notFound(res, 'Course');
    const course = courseRows[0];

    // Lessons
    const { rows: lessons } = await pool.query(
      `SELECT l.id, l.title, l.description, l.video_filename, l.duration_sec, l.sort_order, l.is_free,
              COALESCE(lp.completed, false) AS completed,
              COALESCE(lp.watched_sec, 0)   AS watched_sec
       FROM lessons l
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
       WHERE l.course_id = $2
       ORDER BY l.sort_order ASC`,
      [req.user.id, courseId]
    );

    // Resources
    const { rows: resources } = await pool.query(
      `SELECT id, title, description, file_url, file_type, sort_order
       FROM resources WHERE course_id = $1 ORDER BY sort_order ASC`,
      [courseId]
    );

    // Assignments with submission status
    const { rows: assignments } = await pool.query(
      `SELECT a.id, a.title, a.description, a.instructions, a.due_offset_days, a.sort_order,
              s.submitted_at, s.response_text
       FROM assignments a
       LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.user_id = $1
       WHERE a.course_id = $2
       ORDER BY a.sort_order ASC`,
      [req.user.id, courseId]
    );

    // Quizzes with best score
    const { rows: quizzes } = await pool.query(
      `SELECT q.id, q.title, q.description, q.sort_order,
              MAX(qa.score)  AS best_score,
              MAX(qa.total)  AS total_questions,
              COUNT(qa.id)   AS attempt_count
       FROM quizzes q
       LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.user_id = $1
       WHERE q.course_id = $2
       GROUP BY q.id, q.title, q.description, q.sort_order
       ORDER BY q.sort_order ASC`,
      [req.user.id, courseId]
    );

    const completedLessons = lessons.filter((l) => l.completed).length;
    const progressPct =
      course.total_lessons > 0
        ? Math.round((completedLessons / course.total_lessons) * 100)
        : 0;

    res.json({
      course: {
        ...course,
        completed_lessons: completedLessons,
        progress_pct: progressPct,
      },
      lessons,
      resources,
      assignments,
      quizzes,
    });
  } catch (err) {
    console.error('GET /courses/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch course details.' });
  }
});

// ─── Lesson Progress ───────────────────────────────────────────────────────────

/**
 * POST /api/courses/:courseId/lessons/:lessonId/progress
 * Body: { watched_sec: number, completed: boolean }
 * Upsert lesson progress for the authenticated user.
 */
router.post('/:courseId/lessons/:lessonId/progress', authenticate, async (req, res) => {
  const lessonId = parseInt(req.params.lessonId, 10);
  const courseId = parseInt(req.params.courseId, 10);
  const { watched_sec = 0, completed = false } = req.body;

  if (isNaN(lessonId) || isNaN(courseId)) return notFound(res, 'Lesson');

  try {
    // Verify lesson belongs to course
    const { rows } = await pool.query(
      'SELECT id FROM lessons WHERE id = $1 AND course_id = $2',
      [lessonId, courseId]
    );
    if (!rows.length) return notFound(res, 'Lesson');

    await pool.query(
      `INSERT INTO lesson_progress (user_id, lesson_id, completed, watched_sec, completed_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, lesson_id) DO UPDATE
         SET completed   = EXCLUDED.completed,
             watched_sec = GREATEST(lesson_progress.watched_sec, EXCLUDED.watched_sec),
             completed_at = CASE WHEN EXCLUDED.completed = true THEN NOW() ELSE lesson_progress.completed_at END`,
      [req.user.id, lessonId, completed, watched_sec, completed ? new Date() : null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('POST lesson progress error:', err.message);
    res.status(500).json({ error: 'Failed to save progress.' });
  }
});

// ─── Assignments ──────────────────────────────────────────────────────────────

/**
 * POST /api/courses/:courseId/assignments/:assignmentId/submit
 * Body: { response_text: string }
 * Submit (or re-submit) an assignment.
 */
router.post('/:courseId/assignments/:assignmentId/submit', authenticate, async (req, res) => {
  const assignmentId = parseInt(req.params.assignmentId, 10);
  const courseId = parseInt(req.params.courseId, 10);
  const { response_text } = req.body;

  if (!response_text || response_text.trim().length < 10) {
    return res.status(400).json({ error: 'Please write at least a few sentences before submitting.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id FROM assignments WHERE id = $1 AND course_id = $2',
      [assignmentId, courseId]
    );
    if (!rows.length) return notFound(res, 'Assignment');

    await pool.query(
      `INSERT INTO assignment_submissions (assignment_id, user_id, response_text)
       VALUES ($1, $2, $3)
       ON CONFLICT (assignment_id, user_id) DO UPDATE
         SET response_text = EXCLUDED.response_text,
             submitted_at  = NOW()`,
      [assignmentId, req.user.id, response_text.trim()]
    );

    res.json({ success: true, submitted_at: new Date().toISOString() });
  } catch (err) {
    console.error('POST assignment submit error:', err.message);
    res.status(500).json({ error: 'Failed to submit assignment.' });
  }
});

// ─── Quizzes ──────────────────────────────────────────────────────────────────

/**
 * GET /api/courses/:courseId/quizzes/:quizId
 * Return quiz with all questions (no correct answers exposed).
 */
router.get('/:courseId/quizzes/:quizId', authenticate, async (req, res) => {
  const quizId = parseInt(req.params.quizId, 10);
  const courseId = parseInt(req.params.courseId, 10);
  if (isNaN(quizId) || isNaN(courseId)) return notFound(res, 'Quiz');

  try {
    const { rows: quizRows } = await pool.query(
      'SELECT id, title, description FROM quizzes WHERE id = $1 AND course_id = $2',
      [quizId, courseId]
    );
    if (!quizRows.length) return notFound(res, 'Quiz');

    const { rows: questions } = await pool.query(
      `SELECT id, question, options, sort_order
       FROM quiz_questions WHERE quiz_id = $1 ORDER BY sort_order ASC`,
      [quizId]
    );

    // Past attempts
    const { rows: attempts } = await pool.query(
      `SELECT id, score, total, answers, attempted_at
       FROM quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2
       ORDER BY attempted_at DESC LIMIT 5`,
      [quizId, req.user.id]
    );

    res.json({ quiz: quizRows[0], questions, attempts });
  } catch (err) {
    console.error('GET quiz error:', err.message);
    res.status(500).json({ error: 'Failed to fetch quiz.' });
  }
});

/**
 * POST /api/courses/:courseId/quizzes/:quizId/submit
 * Body: { answers: number[] }  — array of selected option indices, one per question
 * Grades the quiz and returns score + per-question feedback.
 */
router.post('/:courseId/quizzes/:quizId/submit', authenticate, async (req, res) => {
  const quizId = parseInt(req.params.quizId, 10);
  const courseId = parseInt(req.params.courseId, 10);
  const { answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'answers must be an array.' });
  }

  try {
    const { rows: quizRows } = await pool.query(
      'SELECT id FROM quizzes WHERE id = $1 AND course_id = $2',
      [quizId, courseId]
    );
    if (!quizRows.length) return notFound(res, 'Quiz');

    const { rows: questions } = await pool.query(
      `SELECT id, question, options, correct_idx, explanation
       FROM quiz_questions WHERE quiz_id = $1 ORDER BY sort_order ASC`,
      [quizId]
    );

    let score = 0;
    const feedback = questions.map((q, i) => {
      const selected = answers[i] ?? null;
      const correct = selected === q.correct_idx;
      if (correct) score++;
      return {
        question_id: q.id,
        question: q.question,
        options: q.options,
        selected_idx: selected,
        correct_idx: q.correct_idx,
        is_correct: correct,
        explanation: q.explanation,
      };
    });

    await pool.query(
      `INSERT INTO quiz_attempts (quiz_id, user_id, score, total, answers)
       VALUES ($1, $2, $3, $4, $5)`,
      [quizId, req.user.id, score, questions.length, JSON.stringify(answers)]
    );

    res.json({
      score,
      total: questions.length,
      pct: Math.round((score / questions.length) * 100),
      feedback,
    });
  } catch (err) {
    console.error('POST quiz submit error:', err.message);
    res.status(500).json({ error: 'Failed to grade quiz.' });
  }
});

module.exports = router;

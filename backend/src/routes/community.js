const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

function notFound(res, entity = 'Post') {
  return res.status(404).json({ error: `${entity} not found.` });
}

/**
 * GET /api/community/posts
 * Fetch community posts with category filter, user like status, and comment count.
 */
router.get('/posts', authenticate, async (req, res) => {
  try {
    const { category } = req.query;

    let queryStr = `
      SELECT p.id, p.user_id, p.author_name, p.title, p.content, p.category, p.likes_count, p.created_at,
             EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1) AS liked_by_user,
             (SELECT COUNT(id) FROM post_comments pc WHERE pc.post_id = p.id) AS comments_count
      FROM posts p
    `;
    const params = [req.user.id];

    if (category && category !== 'All') {
      queryStr += ` WHERE p.category = $2`;
      params.push(category);
    }

    queryStr += ` ORDER BY p.created_at DESC, p.id DESC`;

    const { rows } = await pool.query(queryStr, params);

    res.json({ posts: rows });
  } catch (err) {
    console.error('GET /api/community/posts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch community posts.' });
  }
});

/**
 * POST /api/community/posts
 * Create a new discussion post.
 */
router.post('/posts', authenticate, async (req, res) => {
  try {
    const { title, content, category = 'General' } = req.body;

    console.log('📝 POST new post request:', { body: req.body, title, content, category, contentType: req.headers['content-type'] });

    if (!title || !content) {
      console.log('❌ Validation failed: missing title or content');
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    // Get author name from user profile
    const { rows: userRows } = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
    const authorName = userRows[0]?.name || userRows[0]?.email?.split('@')[0] || 'Seeker';

    const { rows } = await pool.query(
      `INSERT INTO posts (user_id, author_name, title, content, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, authorName, title, content, category]
    );

    res.status(201).json({ post: { ...rows[0], liked_by_user: false, comments_count: 0 } });
  } catch (err) {
    console.error('POST /api/community/posts error:', err.message);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

/**
 * GET /api/community/posts/:id
 * Get post details with full comment thread.
 */
router.get('/posts/:id', authenticate, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);

    const { rows: postRows } = await pool.query(
      `SELECT p.id, p.user_id, p.author_name, p.title, p.content, p.category, p.likes_count, p.created_at,
              EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1) AS liked_by_user
       FROM posts p
       WHERE p.id = $2`,
      [req.user.id, postId]
    );

    if (postRows.length === 0) return notFound(res, 'Post');

    const { rows: comments } = await pool.query(
      `SELECT id, post_id, user_id, author_name, content, created_at
       FROM post_comments
       WHERE post_id = $1
       ORDER BY created_at ASC, id ASC`,
      [postId]
    );

    res.json({ post: postRows[0], comments });
  } catch (err) {
    console.error('GET /api/community/posts/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch post details.' });
  }
});

/**
 * DELETE /api/community/posts/:id
 * Delete a post (author only). Removes likes and comments too.
 */
router.delete('/posts/:id', authenticate, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);

    const { rows: postRows } = await pool.query(
      'SELECT id, user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (postRows.length === 0) return notFound(res, 'Post');

    if (postRows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own posts.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM post_likes WHERE post_id = $1', [postId]);
      await client.query('DELETE FROM post_comments WHERE post_id = $1', [postId]);
      await client.query('DELETE FROM posts WHERE id = $1', [postId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: 'Post deleted.', deleted_id: postId });
  } catch (err) {
    console.error('DELETE /api/community/posts/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

/**
 * POST /api/community/posts/:id/like
 * Toggle like/upvote on a post.
 */
router.post('/posts/:id/like', authenticate, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const { rows: existingLike } = await pool.query(
      'SELECT id FROM post_likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    let liked = false;
    if (existingLike.length > 0) {
      await pool.query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
      await pool.query('UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1', [postId]);
      liked = false;
    } else {
      await pool.query('INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)', [userId, postId]);
      await pool.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [postId]);
      liked = true;
    }

    const { rows: updatedPost } = await pool.query('SELECT likes_count FROM posts WHERE id = $1', [postId]);

    res.json({ liked, likes_count: updatedPost[0]?.likes_count || 0 });
  } catch (err) {
    console.error('POST /api/community/posts/:id/like error:', err.message);
    res.status(500).json({ error: 'Failed to update like status.' });
  }
});

/**
 * POST /api/community/posts/:id/comments
 * Add a comment to a post.
 */
router.post('/posts/:id/comments', authenticate, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const { content } = req.body;

    console.log('📝 POST comment request:', { postId, body: req.body, content, contentType: req.headers['content-type'] });

    if (!content || !content.trim()) {
      console.log('❌ Validation failed: content empty');
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    const { rows: userRows } = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
    const authorName = userRows[0]?.name || userRows[0]?.email?.split('@')[0] || 'Seeker';

    const { rows } = await pool.query(
      `INSERT INTO post_comments (post_id, user_id, author_name, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [postId, req.user.id, authorName, content.trim()]
    );

    res.status(201).json({ comment: rows[0] });
  } catch (err) {
    console.error('POST /api/community/posts/:id/comments error:', err.message);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

module.exports = router;

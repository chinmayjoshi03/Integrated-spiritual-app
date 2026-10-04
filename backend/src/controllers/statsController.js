const { pool } = require('../db');

const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE is_verified = true');
    const totalCourses = await pool.query("SELECT COUNT(*) FROM courses WHERE status = 'published'");
    const totalEnrollments = await pool.query('SELECT COUNT(*) FROM course_enrollments');
    const totalProducts = await pool.query("SELECT COUNT(*) FROM products WHERE status = 'published'");
    const totalOrders = await pool.query('SELECT COUNT(*) FROM orders');

    const courseRevenue = await pool.query(
      `SELECT COALESCE(SUM(c.price), 0) AS total
       FROM course_enrollments ce JOIN courses c ON ce.course_id = c.id`
    );
    const shopRevenue = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status = 'paid'"
    );

    const recentActivity = await pool.query(`
      (SELECT 'New user registered' AS text, name AS meta, created_at FROM users ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'New course enrollment' AS text, u.name || ' enrolled in ' || c.title AS meta, ce.purchased_at AS created_at
       FROM course_enrollments ce
       JOIN users u ON ce.user_id = u.id
       JOIN courses c ON ce.course_id = c.id
       ORDER BY ce.purchased_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'New order placed' AS text, u.name || ' — ₹' || o.total_amount AS meta, o.created_at
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT 5)
      ORDER BY created_at DESC LIMIT 5
    `);

    res.status(200).json({
      totalUsers: Number(totalUsers.rows[0].count),
      activeUsers: Number(activeUsers.rows[0].count),
      totalCourses: Number(totalCourses.rows[0].count),
      totalEnrollments: Number(totalEnrollments.rows[0].count),
      totalProducts: Number(totalProducts.rows[0].count),
      totalOrders: Number(totalOrders.rows[0].count),
      totalRevenue: Number(courseRevenue.rows[0].total) + Number(shopRevenue.rows[0].total),
      recentActivity: recentActivity.rows,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const getMentorStats = async (req, res) => {
  try {
    const mentorId = req.user.userId;

    const totalStudents = await pool.query(
      `SELECT COUNT(DISTINCT ce.user_id) FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id WHERE c.mentor_id = $1`,
      [mentorId]
    );

    const activeCourses = await pool.query(
      "SELECT COUNT(*) FROM courses WHERE mentor_id = $1 AND status = 'published'",
      [mentorId]
    );

    const totalCourses = await pool.query('SELECT COUNT(*) FROM courses WHERE mentor_id = $1', [mentorId]);

    const recentActivity = await pool.query(
      `SELECT u.name, c.title, ce.purchased_at
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       JOIN users u ON ce.user_id = u.id
       WHERE c.mentor_id = $1
       ORDER BY ce.purchased_at DESC LIMIT 5`,
      [mentorId]
    );

    res.status(200).json({
      totalStudents: Number(totalStudents.rows[0].count),
      activeCourses: Number(activeCourses.rows[0].count),
      totalCourses: Number(totalCourses.rows[0].count),
      recentActivity: recentActivity.rows,
    });
  } catch (error) {
    console.error('Get mentor stats error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

module.exports = { getAdminStats, getMentorStats };

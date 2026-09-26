const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

function notFound(res, entity = 'Item') {
  return res.status(404).json({ error: `${entity} not found.` });
}

/**
 * GET /api/shop/items
 * List all shop items with optional category filter.
 */
router.get('/items', authenticate, async (req, res) => {
  try {
    const { category } = req.query;

    let queryStr = `
      SELECT id, title, description, price, currency, category, image_url, stock_quantity, is_featured, created_at
      FROM shop_items
    `;
    const params = [];

    if (category && category !== 'All') {
      queryStr += ` WHERE category = $1`;
      params.push(category);
    }

    queryStr += ` ORDER BY is_featured DESC, id ASC`;

    const { rows } = await pool.query(queryStr, params);

    res.json({ items: rows });
  } catch (err) {
    console.error('GET /api/shop/items error:', err.message);
    res.status(500).json({ error: 'Failed to fetch shop items.' });
  }
});

/**
 * GET /api/shop/items/:id
 * Get single shop item detail.
 */
router.get('/items/:id', authenticate, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      `SELECT id, title, description, price, currency, category, image_url, stock_quantity, is_featured, created_at
       FROM shop_items
       WHERE id = $1`,
      [itemId]
    );

    if (rows.length === 0) return notFound(res, 'Shop item');

    res.json({ item: rows[0] });
  } catch (err) {
    console.error('GET /api/shop/items/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch shop item details.' });
  }
});

/**
 * POST /api/shop/purchase
 * Place an order for a shop item.
 */
router.post('/purchase', authenticate, async (req, res) => {
  try {
    const { item_id, quantity = 1, shipping_address } = req.body;

    if (!item_id || !shipping_address) {
      return res.status(400).json({ error: 'item_id and shipping_address are required.' });
    }

    const qty = Math.max(1, parseInt(quantity, 10));

    // Check item and stock
    const { rows: itemRows } = await pool.query(
      'SELECT id, title, price, stock_quantity FROM shop_items WHERE id = $1',
      [item_id]
    );

    if (itemRows.length === 0) return notFound(res, 'Shop item');

    const item = itemRows[0];
    if (item.stock_quantity < qty) {
      return res.status(400).json({ error: `Insufficient stock. Only ${item.stock_quantity} available.` });
    }

    const totalPrice = parseFloat(item.price) * qty;

    // Create Order
    const { rows: orderRows } = await pool.query(
      `INSERT INTO shop_orders (user_id, item_id, quantity, total_price, shipping_address, status)
       VALUES ($1, $2, $3, $4, $5, 'Confirmed')
       RETURNING *`,
      [req.user.id, item_id, qty, totalPrice, shipping_address]
    );

    // Decrement stock quantity
    await pool.query(
      'UPDATE shop_items SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2',
      [qty, item_id]
    );

    res.status(201).json({
      message: 'Order placed successfully.',
      order: orderRows[0],
    });
  } catch (err) {
    console.error('POST /api/shop/purchase error:', err.message);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

/**
 * GET /api/shop/orders
 * Fetch purchase order history for current user.
 */
router.get('/orders', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.item_id, si.title AS item_title, si.category AS item_category, si.image_url,
              o.quantity, o.total_price, o.shipping_address, o.status, o.created_at
       FROM shop_orders o
       JOIN shop_items si ON si.id = o.item_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({ orders: rows });
  } catch (err) {
    console.error('GET /api/shop/orders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user orders.' });
  }
});

module.exports = router;

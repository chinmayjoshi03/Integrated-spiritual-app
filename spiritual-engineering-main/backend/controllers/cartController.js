import pool from '../db.js';

export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.image_url, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.added_at DESC`,
      [userId]
    );

    res.status(200).json({ items: result.rows });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body || {};
    const userId = req.user.userId;

    if (!productId) {
      return res.status(400).json({ error: 'Product is required.' });
    }

    const qty = quantity && quantity > 0 ? quantity : 1;

    const product = await pool.query('SELECT id, stock FROM products WHERE id = $1', [productId]);
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING *`,
      [userId, productId, qty]
    );

    res.status(200).json({ item: result.rows[0] });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body || {};
    const userId = req.user.userId;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1.' });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, itemId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    res.status(200).json({ item: result.rows[0] });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.userId;

    await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [itemId, userId]);
    res.status(200).json({ message: 'Item removed from cart.' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
import pool from '../db.js';

export const checkout = async (req, res) => {
  const client = await pool.connect();

  try {
    const { shippingAddress } = req.body || {};
    const userId = req.user.userId;

    const cartResult = await client.query(
      `SELECT ci.quantity, p.id AS product_id, p.name, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    for (const item of cartResult.rows) {
      if (item.quantity > item.stock) {
        return res.status(400).json({ error: `Not enough stock for "${item.name}".` });
      }
    }

    const totalAmount = cartResult.rows.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_address)
       VALUES ($1, $2, 'paid', $3)
       RETURNING *`,
      [userId, totalAmount, shippingAddress || null]
    );
    const order = orderResult.rows[0];

    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price_at_purchase, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.product_id, item.name, item.price, item.quantity]
      );

      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    await client.query('COMMIT');

    res.status(201).json({ order });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Something went wrong during checkout. Please try again.' });
  } finally {
    client.release();
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
        return { ...order, items: itemsResult.rows };
      })
    );

    res.status(200).json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
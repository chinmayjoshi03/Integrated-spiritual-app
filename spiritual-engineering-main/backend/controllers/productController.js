import pool from '../db.js';
import { getFileUrl } from '../utils/storage.js';

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body || {};
    const createdBy = req.user.userId;

    if (!name || !price) {
      return res.status(400).json({ error: 'Product name and price are required.' });
    }

    const imageUrl = req.file ? getFileUrl(req.file.filename) : null;

    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, image_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description || null, price, stock || 0, imageUrl, createdBy]
    );

    res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const getProducts = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const { status } = req.query;

    let query = 'SELECT * FROM products';
    const conditions = [];
    const params = [];

    if (isAdmin) {
      if (status && ['draft', 'published'].includes(status)) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }
    } else {
      conditions.push(`status = 'published'`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.status(200).json({ products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.status(200).json({ product: result.rows[0] });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, status } = req.body || {};

    const existing = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (status && !['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const imageUrl = req.file ? getFileUrl(req.file.filename) : null;

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock),
           image_url = COALESCE($5, image_url),
           status = COALESCE($6, status)
       WHERE id = $7
       RETURNING *`,
      [name, description, price, stock, imageUrl, status, id]
    );

    res.status(200).json({ product: result.rows[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
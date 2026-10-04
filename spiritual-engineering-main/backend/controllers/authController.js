import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { isValidEmail, validatePassword } from '../utils/validators.js';
import { generateOtp, generateResetToken } from '../utils/otp.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../utils/mailer.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash]
    );

    const newUser = result.rows[0];

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_codes (user_id, code, expires_at) VALUES ($1, $2, $3)`,
      [newUser.id, otpCode, expiresAt]
    );

    await sendOtpEmail(newUser.email, otpCode);

    res.status(201).json({
      message: 'Registration successful. Please check your email for a verification code.',
      email: newUser.email,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await pool.query(
      'SELECT id, name, email, password_hash, role, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.', unverified: true });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body || {};

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required.' });
    }

    const userResult = await pool.query('SELECT id, is_verified FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    const user = userResult.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ error: 'This account is already verified.' });
    }

    const otpResult = await pool.query(
      `SELECT id, code, expires_at FROM otp_codes
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }

    const otpRow = otpResult.rows[0];

    if (new Date() > new Date(otpRow.expires_at)) {
      return res.status(400).json({ error: 'This code has expired. Please request a new one.' });
    }

    if (otpRow.code !== code) {
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }

    await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [user.id]);
    await pool.query('DELETE FROM otp_codes WHERE user_id = $1', [user.id]);

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const userResult = await pool.query('SELECT id, is_verified FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    const user = userResult.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ error: 'This account is already verified.' });
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_codes (user_id, code, expires_at) VALUES ($1, $2, $3)`,
      [user.id, otpCode, expiresAt]
    );

    await sendOtpEmail(email, otpCode);

    res.status(200).json({ message: 'A new verification code has been sent.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(200).json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    const user = userResult.rows[0];

    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(email, resetLink);

    res.status(200).json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const tokenResult = await pool.query(
      'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    const tokenRow = tokenResult.rows[0];

    if (new Date() > new Date(tokenRow.expires_at)) {
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      newPasswordHash,
      tokenRow.user_id,
    ]);

    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [tokenRow.user_id]);

    res.status(200).json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
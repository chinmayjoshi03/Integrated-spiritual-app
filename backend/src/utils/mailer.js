const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const isConfigured = () => {
  return Boolean(
    process.env.GMAIL_USER &&
    process.env.GMAIL_APP_PASSWORD &&
    process.env.GMAIL_APP_PASSWORD !== 'your_app_password_here'
  );
};

const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

const sendOtpEmail = async (toEmail, otpCode) => {
  // Always log in development console so testing is never blocked
  console.log(`\n========================================`);
  console.log(`📨 [VERIFICATION OTP] For: ${toEmail}`);
  console.log(`🔑 Code: ${otpCode}`);
  console.log(`========================================\n`);

  if (!isConfigured()) {
    console.warn(
      `⚠️ GMAIL_APP_PASSWORD is not configured in backend/.env. Using console OTP above for verification.`
    );
    return;
  }

  const mailOptions = {
    from: `"Spiritual Platform" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your email — Spiritual Platform',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4a6b57;">Verify your email</h2>
        <p>Use the code below to verify your account. This code expires in 10 minutes.</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #35503f;">
          ${otpCode}
        </p>
        <p style="color: #6b6b6b; font-size: 0.9rem;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send email via Gmail: ${error.message}`);
    console.warn(`👉 Use the console OTP printed above to verify during development.`);
  }
};

const sendPasswordResetEmail = async (toEmail, resetLink) => {
  console.log(`\n========================================`);
  console.log(`🔗 [PASSWORD RESET LINK] For: ${toEmail}`);
  console.log(`URL: ${resetLink}`);
  console.log(`========================================\n`);

  if (!isConfigured()) {
    console.warn(`⚠️ GMAIL_APP_PASSWORD is not configured in backend/.env.`);
    return;
  }

  const mailOptions = {
    from: `"Spiritual Platform" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your password — Spiritual Platform',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4a6b57;">Reset your password</h2>
        <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 30 minutes.</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #4a6b57; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #6b6b6b; font-size: 0.9rem;">
          If you didn't request this, you can safely ignore this email — your password will remain unchanged.
        </p>
      </div>
    `,
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`❌ Failed to send password reset email via Gmail: ${error.message}`);
  }
};

module.exports = { sendOtpEmail, sendPasswordResetEmail };

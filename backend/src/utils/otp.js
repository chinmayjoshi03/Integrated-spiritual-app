const crypto = require('crypto');

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = { generateOtp, generateResetToken };

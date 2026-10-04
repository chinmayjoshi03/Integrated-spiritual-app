import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '@/components/Input/Input';
import { forgotPassword } from './authService';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const data = await forgotPassword(email);
      setSuccessMessage(data.message);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <p>Enter your email and we'll send you a link to reset your password.</p>

      <form onSubmit={handleSubmit}>
        <Input label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        {error && <p className="error-text">{error}</p>}
        {successMessage && <p style={{ color: 'green', fontSize: '0.9rem' }}>{successMessage}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p><Link to="/login">Back to Login</Link></p>
    </div>
  );
};

export default ForgotPasswordPage;
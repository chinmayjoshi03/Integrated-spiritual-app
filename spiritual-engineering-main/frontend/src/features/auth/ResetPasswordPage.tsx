import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Input from '@/components/Input/Input';
import { resetPassword } from './authService';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <div>
        <h1>Invalid Link</h1>
        <p>This password reset link is missing or invalid.</p>
        <Link to="/forgot-password">Request a new link</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await resetPassword({ token, newPassword });
      navigate('/login');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Reset Password</h1>

      <form onSubmit={handleSubmit}>
        <Input
          label="New Password"
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          label="Confirm New Password"
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Input from '@/components/Input/Input';
import { verifyOtp, resendOtp } from './authService';

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!email) {
    return (
      <div>
        <h1>Verify Email</h1>
        <p>No email found to verify. Please register first.</p>
        <Link to="/register">Go to Register</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code) {
      setError('Please enter the verification code.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await verifyOtp({ email, code });
      navigate('/login');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Verification failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccessMessage('');
    setIsResending(true);

    try {
      const data = await resendOtp(email);
      setSuccessMessage(data.message);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to resend code. Please try again.';
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div>
      <h1>Verify your email</h1>
      <p>We sent a 6-digit code to {email}.</p>

      <form onSubmit={handleSubmit}>
        <Input
          label="Verification Code"
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {error && <p className="error-text">{error}</p>}
        {successMessage && <p style={{ color: 'green', fontSize: '0.9rem' }}>{successMessage}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      <button onClick={handleResend} disabled={isResending} style={{ marginTop: '12px' }}>
        {isResending ? 'Sending...' : "Didn't get a code? Resend"}
      </button>
    </div>
  );
};

export default VerifyEmailPage;
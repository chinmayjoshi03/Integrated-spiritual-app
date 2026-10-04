import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { loginUser } from './authService';
import { useAuth } from '@/hooks/useAuth';

import './LoginPage.css';
import AuthVisualPanel from './AuthVisualPanel';
import { getDashboardPath } from '@/utils/roleRoutes';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const data = await loginUser({ email, password });
      login(data.user, data.token);
      navigate(getDashboardPath(data.user.role));
    } catch (err: any) {
      if (err.response?.data?.unverified) {
        navigate('/verify-email', { state: { email } });
        return;
      }
      const message = err.response?.data?.error || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      
      
  <AuthVisualPanel
    headline="Find your inner balance."
    subtext="A space to pause, reflect, connect and grow."
  />

      <div className="login-form-panel">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Continue your journey inward.</p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email address"
              className="login-field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label className="login-field-label" htmlFor="password">Password</label>
            <div className="login-field-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="login-field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-field-eye-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Link to="/forgot-password" className="login-forgot-link">Forgot password?</Link>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-divider">or</div>

        <p className="login-register-prompt">
          Don't have an account? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
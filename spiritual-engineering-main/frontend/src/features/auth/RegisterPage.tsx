import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { registerUser } from './authService';
import { isValidEmail, validatePassword } from '@/utils/validators';
import AuthVisualPanel from './AuthVisualPanel';
import './RegisterPage.css';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const data = await registerUser({ name, email, password });
      navigate('/verify-email', { state: { email: data.email } });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <AuthVisualPanel
        headline="Begin your journey inward."
        subtext="Join a community devoted to stillness and growth."
      />

      <div className="register-form-panel">
        <h1 className="register-title">Create Account</h1>
        <p className="register-subtitle">Start your path to inner peace.</p>

        <form onSubmit={handleSubmit}>
          <div className="register-field">
            <label className="register-field-label" htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              placeholder="Full name"
              className="register-field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="register-field">
            <label className="register-field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email address"
              className="register-field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="register-field">
            <label className="register-field-label" htmlFor="password">Password</label>
            <div className="register-field-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                className="register-field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="register-field-eye-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="register-field">
            <label className="register-field-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              className="register-field-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="register-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="register-login-prompt">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
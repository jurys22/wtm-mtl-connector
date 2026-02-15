import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthForms.css';

export const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { resetPassword, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  // Pre-fill token from URL query parameter if present
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Token validation
    if (!token) {
      newErrors.token = 'Reset token is required';
    } else if (token.length !== 64 || !/^[a-f0-9]{64}$/.test(token)) {
      newErrors.token = 'Invalid token format';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await resetPassword(token, password);
      // Auto-login happens in resetPassword, navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create New Password</h1>
        <p className="auth-subtitle">
          Enter your reset token and choose a new password
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="token">Reset Token</label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={errors.token ? 'error' : ''}
              placeholder="Paste your reset token here"
              disabled={isLoading}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            {errors.token && <span className="error-text">{errors.token}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'error' : ''}
              placeholder="Min 8 characters"
              disabled={isLoading}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Re-enter password"
              disabled={isLoading}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <p className="auth-footer">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

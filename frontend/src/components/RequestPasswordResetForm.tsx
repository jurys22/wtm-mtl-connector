import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthForms.css';

export const RequestPasswordResetForm = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const { requestPasswordReset, error, clearError, isLoading } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);
    setDevToken(null);

    if (!validateForm()) {
      return;
    }

    try {
      const response = await requestPasswordReset(email);
      setSuccessMessage(response.message);

      // In development, show the token
      if (response.token) {
        setDevToken(response.token);
      }

      setEmail('');
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p className="auth-subtitle">
          Enter your email address and we'll send you a reset token
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="success-banner">
              {successMessage}
              {devToken && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Development Mode - Your reset token:</strong>
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all'
                  }}>
                    {devToken}
                  </div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    Copy this token and use it on the <Link to={`/reset-password?token=${devToken}`}>reset password page</Link>.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'error' : ''}
              placeholder="you@example.com"
              disabled={isLoading}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Token'}
          </button>

          <p className="auth-footer">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

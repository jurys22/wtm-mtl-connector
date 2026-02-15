import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { INDUSTRIES, TECH_SKILLS, SOFT_SKILLS, NETWORKING_INTENTIONS } from '../utils/constants';
import './AuthForms.css';

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    display_name: '',
    networking_intention: '' as any,
    industry: '',
    tech_skills: [] as string[],
    soft_skills: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Display name
    if (!formData.display_name || formData.display_name.length < 2) {
      newErrors.display_name = 'Display name must be at least 2 characters';
    }

    // Networking intention
    if (!formData.networking_intention) {
      newErrors.networking_intention = 'Please select your networking intention';
    }

    // Industry
    if (!formData.industry) {
      newErrors.industry = 'Please select your industry';
    }

    // Tech skills
    if (formData.tech_skills.length === 0) {
      newErrors.tech_skills = 'Select at least 1 tech skill';
    } else if (formData.tech_skills.length > 3) {
      newErrors.tech_skills = 'Select at most 3 tech skills';
    }

    // Soft skills
    if (formData.soft_skills.length === 0) {
      newErrors.soft_skills = 'Select at least 1 soft skill';
    } else if (formData.soft_skills.length > 3) {
      newErrors.soft_skills = 'Select at most 3 soft skills';
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
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  const handleSkillToggle = (skill: string, type: 'tech_skills' | 'soft_skills') => {
    const currentSkills = formData[type];
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill].slice(0, 3);

    setFormData({ ...formData, [type]: newSkills });
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h1>Join WTM MTL</h1>
        <p className="auth-subtitle">Create your networking profile</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          <div className="form-section">
            <h3>Account Information</h3>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? 'error' : ''}
                placeholder="you@example.com"
                disabled={isLoading}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? 'error' : ''}
                  placeholder="Min 8 characters"
                  disabled={isLoading}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder="Re-enter password"
                  disabled={isLoading}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Profile Information</h3>

            <div className="form-group">
              <label htmlFor="display_name">Display Name *</label>
              <input
                type="text"
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className={errors.display_name ? 'error' : ''}
                placeholder="How should we call you?"
                disabled={isLoading}
              />
              {errors.display_name && <span className="error-text">{errors.display_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="networking_intention">What brings you here? *</label>
              <select
                id="networking_intention"
                value={formData.networking_intention}
                onChange={(e) => setFormData({ ...formData, networking_intention: e.target.value as any })}
                className={errors.networking_intention ? 'error' : ''}
                disabled={isLoading}
              >
                <option value="">Select your intention...</option>
                {NETWORKING_INTENTIONS.map(intention => (
                  <option key={intention} value={intention}>{intention}</option>
                ))}
              </select>
              {errors.networking_intention && <span className="error-text">{errors.networking_intention}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="industry">Industry *</label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className={errors.industry ? 'error' : ''}
                disabled={isLoading}
              >
                <option value="">Select your industry...</option>
                {INDUSTRIES.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              {errors.industry && <span className="error-text">{errors.industry}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Tech Skills * (Select 1-3)</h3>
            <div className="skills-grid">
              {TECH_SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  className={`skill-chip ${formData.tech_skills.includes(skill) ? 'selected' : ''}`}
                  onClick={() => handleSkillToggle(skill, 'tech_skills')}
                  disabled={isLoading}
                >
                  {skill}
                </button>
              ))}
            </div>
            <p className="skill-counter">{formData.tech_skills.length} / 3 selected</p>
            {errors.tech_skills && <span className="error-text">{errors.tech_skills}</span>}
          </div>

          <div className="form-section">
            <h3>Soft Skills * (Select 1-3)</h3>
            <div className="skills-grid">
              {SOFT_SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  className={`skill-chip ${formData.soft_skills.includes(skill) ? 'selected' : ''}`}
                  onClick={() => handleSkillToggle(skill, 'soft_skills')}
                  disabled={isLoading}
                >
                  {skill}
                </button>
              ))}
            </div>
            <p className="skill-counter">{formData.soft_skills.length} / 3 selected</p>
            {errors.soft_skills && <span className="error-text">{errors.soft_skills}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

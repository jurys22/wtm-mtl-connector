import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { DashboardRecap } from './DashboardRecap';
import './Dashboard.css';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const data = await apiService.getInbox();
        const pending = data.meetingRequests.filter(r => r.status === 'pending').length;
        setPendingCount(pending);
      } catch (err) {
        // Silently fail - not critical for dashboard
        console.error('Failed to fetch pending requests:', err);
      }
    };

    fetchPendingRequests();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-left">
            <Link to="/dashboard" className="logo-link">
              <img src="/logo.png" alt="WTM MTL Connector Logo" className="header-logo" />
            </Link>
            <h1>WTM MTL Connector</h1>
          </div>

          <button
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="hamburger-icon">
              {isMobileMenuOpen ? '✕' : '☰'}
            </span>
          </button>

          <nav className={`dashboard-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              onClick={closeMobileMenu}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/matches"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              onClick={closeMobileMenu}
            >
              Matches
            </NavLink>
            <NavLink
              to="/schedule"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              onClick={closeMobileMenu}
            >
              Schedule
            </NavLink>
            <NavLink
              to="/meeting-requests"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              onClick={closeMobileMenu}
            >
              Meetings
            </NavLink>
            <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="btn-logout">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="dashboard-main container">
        <div className="welcome-section">
          <h2>Welcome back, {user.display_name}!</h2>
          <p>Your networking profile is active</p>
        </div>

        <div className="profile-card">
          <h3>Your Profile</h3>
          <div className="profile-details">
            <div className="profile-item">
              <span className="label">Email:</span>
              <span className="value">{user.email}</span>
            </div>
            <div className="profile-item">
              <span className="label">Networking Goal:</span>
              <span className="value">{user.networking_intention}</span>
            </div>
            <div className="profile-item">
              <span className="label">Industry:</span>
              <span className="value">{user.industry}</span>
            </div>
            <div className="profile-item">
              <span className="label">Tech Skills:</span>
              <div className="skills-list">
                {user.tech_skills.map(skill => (
                  <span key={skill} className="skill-badge">{skill}</span>
                ))}
              </div>
            </div>
            <div className="profile-item">
              <span className="label">Soft Skills:</span>
              <div className="skills-list">
                {user.soft_skills.map(skill => (
                  <span key={skill} className="skill-badge">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="action-cards">
          <Link to="/matches" className="action-card">
            <h3>🤝 Find Matches</h3>
            <p>Discover attendees with similar interests</p>
          </Link>

          <Link to="/schedule" className="action-card">
            <h3>📅 Conference Schedule</h3>
            <p>View sessions and manage your attendance</p>
          </Link>

          <Link to="/meeting-requests" className="action-card">
            <h3>📬 Meeting Requests</h3>
            <p>
              {pendingCount > 0
                ? `${pendingCount} pending request${pendingCount !== 1 ? 's' : ''} waiting`
                : 'Manage your meeting requests'}
            </p>
            {pendingCount > 0 && <span className="notification-badge">{pendingCount}</span>}
          </Link>
        </div>

        {/* Schedule Recap Section */}
        <DashboardRecap />
      </main>
    </div>
  );
};

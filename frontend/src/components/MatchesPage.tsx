import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { Matches } from './Matches';
import './Dashboard.css';

export const MatchesPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <Matches />
      </main>
    </div>
  );
};

import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { RequestPasswordResetForm } from './components/RequestPasswordResetForm'
import { ResetPasswordForm } from './components/ResetPasswordForm'
import { Dashboard } from './components/Dashboard'
import { MatchesPage } from './components/MatchesPage'
import { SchedulePage } from './components/SchedulePage'
import { MeetingRequestsPage } from './components/MeetingRequestsPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterForm /></PublicRoute>} />
          <Route path="/request-password-reset" element={<PublicRoute><RequestPasswordResetForm /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPasswordForm /></PublicRoute>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <MatchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <SchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting-requests"
            element={
              <ProtectedRoute>
                <MeetingRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <h1>WTM MTL Connector</h1>
        <p>Connect with fellow attendees at WTM MTL events</p>
      </header>

      <main className="app-main">
        <div className="home">
          <h2>Welcome to WTM MTL Connector</h2>
          <p>Your networking companion for WTM MTL events</p>

          <div className="feature-list">
            <div className="feature">
              <h3>Find Connections</h3>
              <p>Match with attendees based on your networking goals</p>
            </div>
            <div className="feature">
              <h3>Schedule Meetings</h3>
              <p>Coordinate meetups that work with your conference schedule</p>
            </div>
            <div className="feature">
              <h3>Share Skills</h3>
              <p>Connect based on technical and soft skills</p>
            </div>
          </div>

          <div className="cta-buttons">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

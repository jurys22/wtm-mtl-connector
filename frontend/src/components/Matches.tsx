import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { Match } from '../types/matching.types';
import { MeetingRequestModal } from './MeetingRequestModal';
import './Matches.css';

export const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const limit = 12;

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async (append: boolean = false) => {
    try {
      setLoading(true);
      const currentOffset = append ? offset : 0;
      const data = await apiService.getMatches(limit, currentOffset);

      if (append) {
        setMatches([...matches, ...data.matches]);
      } else {
        setMatches(data.matches);
      }

      setHasMore(data.hasMore);
      setOffset(currentOffset + data.matches.length);
    } catch (err: any) {
      setError(err.error || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'great';
    if (score >= 40) return 'good';
    return 'fair';
  };

  const getMatchScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Great Match';
    if (score >= 40) return 'Good Match';
    return 'Fair Match';
  };

  const handleRequestMeeting = (match: Match) => {
    setSelectedMatch(match);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedMatch(null);
  };

  const handleRequestSuccess = () => {
    setSuccessMessage('Meeting request sent successfully!');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  if (loading && matches.length === 0) {
    return (
      <div className="matches-loading">
        <div className="spinner"></div>
        <p>Finding your matches...</p>
      </div>
    );
  }

  return (
    <div className="matches">
      <div className="matches-header">
        <h2>Suggested Connections</h2>
        <p className="matches-info">
          Found {matches.length} potential connections ranked by compatibility
        </p>
      </div>

      {successMessage && (
        <div className="success-banner">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {matches.length === 0 && !loading ? (
        <div className="empty-state">
          <h3>No matches yet</h3>
          <p>Be the first to create your profile and start networking!</p>
        </div>
      ) : (
        <>
          <div className="matches-grid">
            {matches.map((match) => (
              <div key={match.user.id} className="match-card">
                <div className="match-header">
                  <div className="match-user-info">
                    <h3>{match.user.display_name}</h3>
                    <p className="match-intention">{match.user.networking_intention}</p>
                  </div>
                  <div className={`match-score ${getMatchScoreColor(match.matchScore)}`}>
                    <div className="score-value">{match.matchScore}%</div>
                    <div className="score-label">{getMatchScoreLabel(match.matchScore)}</div>
                  </div>
                </div>

                <div className="match-details">
                  <div className="match-attribute">
                    <span className="attribute-icon">🏢</span>
                    <span className="attribute-value">{match.user.industry}</span>
                    {match.sharedAttributes.sameIndustry && (
                      <span className="attribute-badge">Same industry</span>
                    )}
                  </div>

                  {match.sharedAttributes.sharedTechSkills.length > 0 && (
                    <div className="match-attribute">
                      <span className="attribute-icon">💻</span>
                      <div className="shared-skills">
                        <span className="attribute-label">Shared tech skills:</span>
                        <div className="skills-tags">
                          {match.sharedAttributes.sharedTechSkills.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {match.sharedAttributes.sharedSoftSkills.length > 0 && (
                    <div className="match-attribute">
                      <span className="attribute-icon">🤝</span>
                      <div className="shared-skills">
                        <span className="attribute-label">Shared soft skills:</span>
                        <div className="skills-tags">
                          {match.sharedAttributes.sharedSoftSkills.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {match.sharedAttributes.sameIntention && (
                    <div className="match-highlight">
                      ✨ Same networking goal
                    </div>
                  )}
                </div>

                <button
                  className="btn-connect"
                  onClick={() => handleRequestMeeting(match)}
                >
                  Request Meeting
                </button>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="load-more">
              <button
                onClick={() => loadMatches(true)}
                className="btn-load-more"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Matches'}
              </button>
            </div>
          )}
        </>
      )}

      {showModal && selectedMatch && (
        <MeetingRequestModal
          recipientId={selectedMatch.user.id}
          recipientName={selectedMatch.user.display_name}
          onClose={handleModalClose}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
};

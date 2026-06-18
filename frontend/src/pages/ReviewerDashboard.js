// Purpose: Implement page-level UI and behavior.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import InterviewToolsPanel from '../components/InterviewToolsPanel';

// Main flow: Initialize dependencies and run module logic.

const STATUS_BADGE = { OPEN: 'badge-green', CLOSED: 'badge-gray', REVIEWING: 'badge-blue' };

export default function ReviewerDashboard() {
  const { user } = useAuth();
  const [reviewCards, setReviewCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'reviewer') {
      navigate('/reviewer/login', { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    // Function: loadReviewCards - Handles load review cards.
    async function loadReviewCards() {
      try {
        const { data: sessions } = await api.get('/scheduling/sessions');
        const cards = [];

        for (const session of sessions) {
          const { data: assignments = [] } = await api.get(`/scheduling/sessions/${session._id}/assignments`).catch(() => ({ data: [] }));

          if (!assignments.length) {
            cards.push({
              key: `pending-${session._id}`,
              sessionId: session._id,
              sessionStatus: session.status,
              deadline: session.deadline,
              sessionTitle: session.title,
              candidateId: '',
              candidateName: 'Pending candidate',
            });
            continue;
          }

          assignments.forEach((assignment) => {
            cards.push({
              key: `${session._id}-${assignment._id}`,
              sessionId: session._id,
              sessionStatus: session.status,
              deadline: session.deadline,
              sessionTitle: session.title,
              candidateId: assignment.candidate_id,
              candidateName: assignment?.candidate_profile?.full_name || assignment.candidate_id,
            });
          });
        }

        setReviewCards(cards);
      } catch (err) {
        const status = err?.response?.status;
        setError(status ? `Failed to load sessions (HTTP ${status}).` : 'Failed to load sessions.');
        setReviewCards([]);
      } finally {
        setLoading(false);
      }
    }

    loadReviewCards();
  }, []);

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container">
          <div className="hero-banner mb-md">
            <p className="hero-kicker">Reviewer Workspace</p>
            <h1 style={{ marginBottom: '.3rem' }}>Reviewer Dashboard</h1>
            <p style={{ marginBottom: 0 }}>Pick a session and leave precise timestamped feedback.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? <div className="spinner" /> : (
            <>
              <div className="grid-2">
                {reviewCards.length === 0 && (
                  <p className="text-muted">No sessions assigned to you yet.</p>
                )}
                {reviewCards.map((card) => (
                  <div className="card card-elevated" key={card.key}>
                    <div className="flex-between" style={{ marginBottom: '.75rem' }}>
                      <span className={`badge ${STATUS_BADGE[card.sessionStatus] || 'badge-gray'}`}>{card.sessionStatus}</span>
                      {card.deadline && <span className="text-muted text-sm">{new Date(card.deadline).toLocaleDateString()}</span>}
                    </div>
                    <h3 style={{ marginBottom: '.35rem' }}>{card.candidateName}</h3>
                    <p className="text-sm" style={{ marginBottom: '.35rem' }}>{card.sessionTitle}</p>
                    <p className="text-sm" style={{ marginBottom: '1rem' }}>Session ID: {card.sessionId.slice(0, 8)}...</p>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/review/${card.sessionId}${card.candidateId ? `?candidate=${encodeURIComponent(card.candidateId)}` : ''}`)}
                    >
                      Open review room
                    </button>
                  </div>
                ))}
              </div>

              <div className="card card-elevated mt-lg">
                <InterviewToolsPanel
                  embedded
                  title="Reviewer Tools"
                  description="Generate candidate invite tokens and check transcript readiness from your reviewer workspace."
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const STATUS_BADGE = { OPEN: 'badge-green', CLOSED: 'badge-gray', REVIEWING: 'badge-blue' };

export default function ReviewerDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/scheduling/sessions')
      .then(({ data }) => setSessions(data))
      .catch((err) => {
        const status = err?.response?.status;
        setError(status ? `Failed to load sessions (HTTP ${status}).` : 'Failed to load sessions.');
        setSessions([]);
      })
      .finally(() => setLoading(false));
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
            <div className="grid-2">
              {sessions.length === 0 && (
                <p className="text-muted">No sessions assigned to you yet.</p>
              )}
              {sessions.map(s => (
                <div className="card card-elevated" key={s._id}>
                  <div className="flex-between" style={{ marginBottom: '.75rem' }}>
                    <span className={`badge ${STATUS_BADGE[s.status] || 'badge-gray'}`}>{s.status}</span>
                    {s.deadline && <span className="text-muted text-sm">{new Date(s.deadline).toLocaleDateString()}</span>}
                  </div>
                  <h3 style={{ marginBottom: '.5rem' }}>{s.title}</h3>
                  <p className="text-sm" style={{ marginBottom: '1rem' }}>Session ID: {s._id.slice(0, 8)}...</p>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/review/${s._id}`)}>
                    Open review room
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

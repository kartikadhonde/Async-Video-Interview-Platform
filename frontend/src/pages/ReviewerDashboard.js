import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const STATUS_BADGE = { OPEN: 'badge-green', CLOSED: 'badge-gray', REVIEWING: 'badge-blue' };

export default function ReviewerDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/scheduling/sessions')
      .then(({ data }) => setSessions(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container">
          <h1 className="mb-md">Reviewer Dashboard</h1>

          {loading ? <div className="spinner" /> : (
            <div className="grid-2">
              {sessions.length === 0 && (
                <p className="text-muted">No sessions assigned to you yet.</p>
              )}
              {sessions.map(s => (
                <div className="card" key={s._id}>
                  <div className="flex-between" style={{ marginBottom: '.75rem' }}>
                    <span className={`badge ${STATUS_BADGE[s.status] || 'badge-gray'}`}>{s.status}</span>
                    {s.deadline && <span className="text-muted text-sm">{new Date(s.deadline).toLocaleDateString()}</span>}
                  </div>
                  <h3 style={{ marginBottom: '.5rem' }}>{s.title}</h3>
                  <p className="text-sm" style={{ marginBottom: '1rem' }}>Session ID: {s._id}</p>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/review/${s._id}`)}>
                    Review
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

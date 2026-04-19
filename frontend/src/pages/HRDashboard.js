import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const STATUS_BADGE = { OPEN: 'badge-green', CLOSED: 'badge-gray', REVIEWING: 'badge-blue' };

export default function HRDashboard() {
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
          <div className="flex-between mb-md">
            <h1>HR Dashboard</h1>
            <button className="btn btn-primary btn-sm">+ New Session</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="card">
            <p className="text-muted" style={{ marginBottom: '1rem' }}>All interview sessions</p>
            {loading ? <div className="spinner" /> : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 && (
                    <tr><td colSpan={4} className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No sessions yet</td></tr>
                  )}
                  {sessions.map(s => (
                    <tr key={s._id}>
                      <td><strong>{s.title}</strong></td>
                      <td><span className={`badge ${STATUS_BADGE[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                      <td className="text-muted">{s.deadline ? new Date(s.deadline).toLocaleDateString() : '—'}</td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate(`/analytics?session=${s._id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const trimmedInviteToken = inviteToken.trim();

      if (trimmedInviteToken) {
        const { data } = await api.post('/auth/invite-login', { invite_token: trimmedInviteToken });
        login(data.user, data.token);
        navigate(`/interview/${trimmedInviteToken}`);
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const { data } = await api.post('/auth/login', { email: normalizedEmail, password });

      if (data.user.role === 'candidate' && !trimmedInviteToken) {
        setError('Invite token is required for candidate login.');
        setLoading(false);
        return;
      }

      login(data.user, data.token);
      if (data.user.role === 'candidate') navigate(`/interview/${trimmedInviteToken}`);
      else if (data.user.role === 'reviewer') navigate('/reviewer');
      else navigate('/hr');
    } catch (err) {
      const serverError = err?.response?.data?.error;
      setError(serverError || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center">
      <div className="container-sm" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--brand)', marginBottom: '.25rem' }}>Interview Platform</h1>
          <p style={{ margin: 0 }}>Sign in to continue</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Invite token (required for candidates)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Paste invite token (candidate access)"
                value={inviteToken}
                onChange={e => setInviteToken(e.target.value)}
              />
              <p className="text-muted text-sm" style={{ marginTop: '.35rem', marginBottom: 0 }}>
                If invite token is provided, candidate login uses token directly.
              </p>
            </div>

            <div className="mt-md">
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>

            <div className="mt-md" style={{ textAlign: 'center' }}>
              <Link className="btn btn-outline btn-sm" to="/tools/tokens">
                Open token + transcript tools
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

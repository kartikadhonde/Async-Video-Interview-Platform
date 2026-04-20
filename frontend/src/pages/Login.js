import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import PublicTopBar from '../components/PublicTopBar';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [inviteToken, setInviteToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const trimmedInviteToken = inviteToken.trim();

      if (!trimmedInviteToken) {
        setError('Invite token is required to continue.');
        setLoading(false);
        return;
      }

      const profile = {
        full_name: fullName.trim(),
        email: candidateEmail.trim().toLowerCase(),
        phone: phone.trim(),
        college: college.trim(),
      };

      const { data } = await api.post('/auth/invite-login', {
        invite_token: trimmedInviteToken,
        candidate_profile: profile,
      });

      login(data.user, data.token);
      navigate(`/interview/${trimmedInviteToken}`);
    } catch (err) {
      const serverError = err?.response?.data?.error;
      setError(serverError || 'Unable to start interview. Check invite token and profile details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center">
      <div className="container-sm" style={{ width: '100%' }}>
        <PublicTopBar />
        <div className="hero-banner" style={{ marginBottom: '1.5rem' }}>
          <p className="hero-kicker">Candidate Portal</p>
          <h1 style={{ marginBottom: '.4rem' }}>Start Your Interview</h1>
          <p style={{ margin: 0 }}>Enter your invite token and a few details before recording.</p>
        </div>

        <div className="card card-elevated">
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Kartik Adhonde"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={candidateEmail}
                onChange={e => setCandidateEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">College / University</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. VIT Pune"
                value={college}
                onChange={e => setCollege(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Invite token</label>
              <input
                className="form-input"
                type="text"
                placeholder="Paste your interview invite token"
                value={inviteToken}
                onChange={e => setInviteToken(e.target.value)}
                required
              />
              <p className="text-muted text-sm" style={{ marginTop: '.35rem', marginBottom: 0 }}>
                This token is provided by HR. Your basic profile is saved for reviewers.
              </p>
            </div>

            <div className="mt-md">
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'Starting interview…' : 'Continue to interview'}
              </button>
            </div>

            <div className="mt-md flex gap-sm" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link className="btn btn-outline btn-sm" to="/admin/login">Admin sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

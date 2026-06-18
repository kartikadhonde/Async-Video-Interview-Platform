// Purpose: Implement page-level UI and behavior.

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import PublicTopBar from '../components/PublicTopBar';

// Main flow: Initialize dependencies and run module logic.

export default function ReviewerLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Function: handleSubmit - Handles submit.
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const normalizedUsername = username.trim().toLowerCase();
            const { data } = await api.post('/auth/reviewer-login', {
                username: normalizedUsername,
                password,
            });

            login(data.user, data.token);
            navigate('/reviewer');
        } catch (err) {
            const serverError = err?.response?.data?.error;
            setError(serverError || 'Invalid reviewer credentials.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page-center">
            <div className="container-sm" style={{ width: '100%' }}>
                <PublicTopBar />
                <div className="hero-banner" style={{ marginBottom: '1.5rem' }}>
                    <p className="hero-kicker">Reviewer Portal</p>
                    <h1 style={{ marginBottom: '.4rem' }}>Reviewer Login</h1>
                    <p style={{ margin: 0 }}>Use username format reviewer1, reviewer2, etc. Password is review.</p>
                </div>

                <div className="card card-elevated">
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-error">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="reviewer1"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="review"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in as reviewer'}
                        </button>

                        <div className="mt-md" style={{ textAlign: 'center' }}>
                            <Link className="btn btn-outline btn-sm" to="/admin/login">HR login</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

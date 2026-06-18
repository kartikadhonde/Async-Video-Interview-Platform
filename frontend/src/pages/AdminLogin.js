// Purpose: Implement page-level UI and behavior.

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import PublicTopBar from '../components/PublicTopBar';

// Main flow: Initialize dependencies and run module logic.

export default function AdminLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Function: handleSubmit - Handles submit.
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const normalizedEmail = email.trim().toLowerCase();
            const { data } = await api.post('/auth/login', { email: normalizedEmail, password });

            if (data?.user?.role === 'candidate') {
                setError('Candidates must use the candidate portal with an invite token.');
                setLoading(false);
                return;
            }

            login(data.user, data.token);
            if (data.user.role === 'reviewer') {
                navigate('/reviewer');
            } else {
                navigate('/hr');
            }
        } catch (err) {
            const serverError = err?.response?.data?.error;
            setError(serverError || 'Invalid admin credentials.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page-center">
            <div className="container-sm" style={{ width: '100%' }}>
                <PublicTopBar />
                <div className="hero-banner" style={{ marginBottom: '1.5rem' }}>
                    <p className="hero-kicker">Admin Portal</p>
                    <h1 style={{ marginBottom: '.4rem' }}>HR Login</h1>
                    <p style={{ margin: 0 }}>Sign in with your HR account. No invite token needed.</p>
                </div>

                <div className="card card-elevated">
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-error">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input
                                className="form-input"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in as HR'}
                        </button>

                        <div className="mt-md flex gap-sm" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link className="btn btn-outline btn-sm" to="/reviewer/login">Reviewer login</Link>
                            <Link className="btn btn-outline btn-sm" to="/login">Candidate portal</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

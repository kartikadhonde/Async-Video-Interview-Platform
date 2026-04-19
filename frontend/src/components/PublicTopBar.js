import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DEFAULT_LINKS = [
    { to: '/login', label: 'Candidate' },
    { to: '/admin/login', label: 'Admin' },
    { to: '/reviewer', label: 'Reviewer' },
    { to: '/tools/tokens', label: 'Tools' },
];

export default function PublicTopBar({ links = DEFAULT_LINKS }) {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="public-topbar">
            <div className="public-topbar-inner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} type="button">Back</button>
                    <button className="navbar-brand" onClick={() => navigate('/login')} type="button">Interview Platform</button>
                </div>
                <div className="public-links">
                    {links.map((link) => (
                        <button
                            key={link.to}
                            type="button"
                            className={`public-link-btn ${location.pathname === link.to ? 'active' : ''}`}
                            onClick={() => navigate(link.to)}
                        >
                            {link.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

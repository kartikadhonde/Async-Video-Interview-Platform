// Purpose: Render reusable UI components.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Main flow: Initialize dependencies and run module logic.

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const homePath = user?.role === 'reviewer' ? '/reviewer' : '/hr';

  // Function: handleLogout - Handles logout.
  function handleLogout() {
    const nextPath = user?.role === 'reviewer' ? '/reviewer/login' : '/admin/login';
    logout();
    navigate(nextPath);
  }

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
        <button className="btn btn-outline btn-sm" type="button" onClick={() => navigate(-1)}>Back</button>
        <button className="navbar-brand" onClick={() => navigate(homePath)}>Interview Platform</button>
      </div>
      <div className="navbar-right">
        {user && <span className="navbar-user">{user.name || user.email} · <strong>{user.role}</strong></span>}
        {user && <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>}
      </div>
    </nav>
  );
}

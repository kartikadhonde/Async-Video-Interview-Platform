import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <a className="navbar-brand" href="/">Interview Platform</a>
      <div className="navbar-right">
        {user && <span className="navbar-user">{user.email} · <strong>{user.role}</strong></span>}
        {user && <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>}
      </div>
    </nav>
  );
}

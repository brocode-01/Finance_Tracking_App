import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/transactions', label: 'Transactions', icon: '💳' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/performance', label: 'Performance', icon: '⚡' },
    ...(isAdmin ? [{ path: '/users', label: 'Users', icon: '👥' }] : []),
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">💰 FinTracker</div>

        <div style={{ padding: '0 1.25rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text)' }}>{user?.name}</strong><br />
          <span className={`badge badge-${user?.role === 'read-only' ? 'readonly' : user?.role}`} style={{ marginTop: '0.25rem' }}>
            {user?.role}
          </span>
        </div>

        <div className="nav-section">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="nav-section" style={{ marginTop: '1rem' }}>Settings</div>
        <button
          className="nav-item"
          onClick={toggleTheme}
          style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <span>{isDark ? '☀️' : '🌙'}</span>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          className="nav-item"
          onClick={handleLogout}
          style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--danger)' }}
        >
          <span>🚪</span>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <button
          className="btn btn-ghost"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ display: 'none', marginBottom: '1rem' }}
          id="mobile-menu-btn"
        >
          ☰ Menu
        </button>
        <Outlet />
      </main>

      <style>{`@media (max-width: 768px) { #mobile-menu-btn { display: flex !important; } }`}</style>
    </div>
  );
}

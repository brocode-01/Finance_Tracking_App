import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role) => {
    const credentials = {
      admin: { email: 'rupeshadmin@demo.com', password: 'password123' },
      user: { email: 'rupeshuser@demo.com', password: 'password123' },
      readonly: { email: 'rupeshreadonly@demo.com', password: 'password123' },
    };
    setForm(credentials[role]);
    setLoading(true);
    try {
      await login(credentials[role]);
      toast.success(`Logged in as ${role}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">💰 FinTracker</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-control"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>── login from above buttons by rupesh ──</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['admin', 'user', 'readonly'].map((r) => (
            <button key={r} onClick={() => demoLogin(r)} className="btn btn-secondary btn-sm" style={{ flex: 1 }} disabled={loading}>
              {r === 'readonly' ? 'Read-only' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#6366f1', fontWeight: 600 }}>Register</Link>
        </p>
      </div>
    </div>
  );
}

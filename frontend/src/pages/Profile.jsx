import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, canWrite, isAdmin } = useAuth();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      return toast.error('Passwords do not match');
    }
    if (pwForm.newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }
    setPwLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const permissions = [
    { label: 'View Transactions', allowed: true },
    { label: 'View Analytics & Dashboard', allowed: true },
    { label: 'Add Transactions', allowed: canWrite },
    { label: 'Edit Transactions', allowed: canWrite },
    { label: 'Delete Transactions', allowed: canWrite },
    { label: 'Manage All Users', allowed: isAdmin },
    { label: 'View All Users Data', allowed: isAdmin },
    { label: 'Change User Roles', allowed: isAdmin },
  ];

  return (
    <div>
      <h1 className="topbar-title" style={{ marginBottom: '1.5rem' }}>👤 Profile</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Account Information</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', color: 'white', fontWeight: 700,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user?.email}</div>
              <span className={`badge badge-${user?.role === 'read-only' ? 'readonly' : user?.role}`} style={{ marginTop: '0.35rem' }}>
                {user?.role}
              </span>
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: 8 }}>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>Your Permissions</h4>
            {permissions.map((p) => (
              <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem' }}>{p.label}</span>
                <span style={{ fontSize: '1rem' }}>{p.allowed ? '✅' : '🚫'}</span>
              </div>
            ))}
          </div>
        </div>

      
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>🔐 Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                className="form-control"
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                required
                placeholder="Enter current password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-control"
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                required
                placeholder="Min. 8 characters"
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-control"
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                required
                placeholder="Confirm new password"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={pwLoading} style={{ width: '100%' }}>
              {pwLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

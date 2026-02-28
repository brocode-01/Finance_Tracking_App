import React, { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../services/api';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.getAll({ page, limit: 10, search: search || undefined });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId, role) => {
    try {
      await usersAPI.updateRole(userId, role);
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user and all their data?')) return;
    try {
      await usersAPI.delete(userId);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="topbar">
        <h1 className="topbar-title">👥 User Management</h1>
        <span className="badge badge-admin">Admin Only</span>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <input
          className="form-control"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 400 }}
        />
      </div>

      <div className="card">
        {loading ? (
          <LoadingSpinner fullPage={false} />
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 500 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        {u.id === currentUser.id ? (
                          <span className={`badge badge-${u.role === 'read-only' ? 'readonly' : u.role}`}>{u.role} (you)</span>
                        ) : (
                          <select
                            className="form-control"
                            style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                            <option value="read-only">Read-only</option>
                          </select>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {new Date(u.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        {u.id !== currentUser.id && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

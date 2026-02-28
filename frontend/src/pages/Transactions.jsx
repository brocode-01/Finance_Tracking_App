import React, { useState, useMemo, useCallback } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import TransactionForm from '../components/transactions/TransactionForm';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const CATEGORIES = ['All', 'Food', 'Transport', 'Entertainment', 'Housing', 'Healthcare', 'Shopping', 'Education', 'Utilities', 'Salary', 'Freelance', 'Investment', 'Other'];

export default function Transactions() {
  const { canWrite } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

const {
    transactions, pagination, filters, loading,
    updateFilters, createTransaction, updateTransaction, deleteTransaction
  } = useTransactions();


  const pageTotals = useMemo(() => ({
    income: transactions.filter((t) => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0),
    expense: transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0),
  }), [transactions]);

  const handleSearch = useCallback((e) => {
    updateFilters({ search: e.target.value, page: 1 });
  }, [updateFilters]);

  const handleTypeFilter = useCallback((e) => {
    updateFilters({ type: e.target.value || undefined, page: 1 });
  }, [updateFilters]);

  const handleCategoryFilter = useCallback((e) => {
    const val = e.target.value;
    updateFilters({ category: val === 'All' ? undefined : val, page: 1 });
  }, [updateFilters]);

  const handleSubmit = useCallback(async (data) => {
    setFormLoading(true);
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, data);
      } else {
        await createTransaction(data);
      }
      setShowForm(false);
      setEditingTx(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  }, [editingTx, createTransaction, updateTransaction]);

  const handleEdit = useCallback((tx) => {
    setEditingTx(tx);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(id);
    } catch (err) {
      toast.error('Delete failed');
    }
  }, [deleteTransaction]);

  return (
    <div>
      <div className="topbar">
        <h1 className="topbar-title">💳 Transactions</h1>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => { setEditingTx(null); setShowForm(true); }}>
            + Add Transaction
          </button>
        )}
      </div>


      <div className="stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="stat-card">
          <div className="stat-label">Page Income</div>
          <div className="stat-value text-income" style={{ fontSize: '1.25rem' }}>{fmt(pageTotals.income)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Page Expense</div>
          <div className="stat-value text-expense" style={{ fontSize: '1.25rem' }}>{fmt(pageTotals.expense)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Page Net</div>
          <div className={`stat-value ${pageTotals.income - pageTotals.expense >= 0 ? 'text-income' : 'text-expense'}`} style={{ fontSize: '1.25rem' }}>
            {fmt(pageTotals.income - pageTotals.expense)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Records</div>
          <div className="stat-value text-primary" style={{ fontSize: '1.25rem' }}>{pagination.total}</div>
        </div>
      </div>

    
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="filters-bar">
          <div className="form-group">
            <label className="form-label">Search</label>
            <input
              className="form-control"
              placeholder="Search transactions..."
              onChange={handleSearch}
              defaultValue={filters.search || ''}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-control" onChange={handleTypeFilter} defaultValue="">
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" onChange={handleCategoryFilter}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">From</label>
            <input className="form-control" type="date" onChange={(e) => updateFilters({ startDate: e.target.value || undefined, page: 1 })} />
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <input className="form-control" type="date" onChange={(e) => updateFilters({ endDate: e.target.value || undefined, page: 1 })} />
          </div>
          <div className="form-group">
            <label className="form-label">Per Page</label>
            <select className="form-control" value={filters.limit} onChange={(e) => updateFilters({ limit: parseInt(e.target.value), page: 1 })}>
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
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
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    {canWrite && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">No transactions found</td>
                    </tr>
                  ) : transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                      <td><span className={`badge badge-${t.type}`}>{t.type}</span></td>
                      <td>{t.category}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{t.description || '—'}</td>
                      <td style={{ fontWeight: 600, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                      </td>
                      {canWrite && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(t)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Del</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={pagination}
              onPageChange={(page) => updateFilters({ page })}
            />
          </>
        )}
      </div>

      {showForm && (
        <TransactionForm
          transaction={editingTx}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditingTx(null); }}
          loading={formLoading}
        />
      )}
    </div>
  );
}

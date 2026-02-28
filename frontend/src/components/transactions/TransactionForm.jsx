import React, { useState, useEffect, useCallback } from 'react';

const CATEGORIES = [
  'Food', 'Transport', 'Entertainment', 'Housing', 'Healthcare',
  'Shopping', 'Education', 'Utilities', 'Salary', 'Freelance', 'Investment', 'Other'
];

const defaultForm = {
  type: 'expense',
  amount: '',
  category: 'Food',
  description: '',
  date: new Date().toISOString().split('T')[0],
};

export default function TransactionForm({ transaction, onSubmit, onClose, loading }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description || '',
        date: transaction.date?.split('T')[0] || defaultForm.date,
      });
    } else {
      setForm(defaultForm);
    }
  }, [transaction]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit(form);
  }, [form, onSubmit]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{transaction ? 'Edit' : 'Add'} Transaction</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['income', 'expense'].map((t) => (
                <label
                  key={t}
                  style={{
                    flex: 1, padding: '0.6rem', border: `2px solid ${form.type === t ? (t === 'income' ? '#22c55e' : '#ef4444') : 'var(--border)'}`,
                    borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 600,
                    color: form.type === t ? (t === 'income' ? '#22c55e' : '#ef4444') : 'var(--text-secondary)',
                    background: form.type === t ? (t === 'income' ? '#f0fdf4' : '#fef2f2') : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input type="radio" name="type" value={t} checked={form.type === t} onChange={handleChange} style={{ display: 'none' }} />
                  {t === 'income' ? '⬆️ Income' : '⬇️ Expense'}
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                className="form-control"
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                className="form-control"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" name="category" value={form.category} onChange={handleChange} required>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-control"
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional description..."
              maxLength={500}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

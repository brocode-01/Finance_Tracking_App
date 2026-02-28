import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { PieChart, LineChart, BarChart } from '../components/dashboard/Charts';
import LoadingSpinner from '../components/common/LoadingSpinner';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function Dashboard() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { summary, categoryData, monthlyTrends, incomeVsExpense, recentTransactions, loading, fromCache } =
    useAnalytics(selectedYear);

  const years = useMemo(() => {
    const arr = [];
    for (let y = currentYear; y >= currentYear - 3; y--) arr.push(y);
    return arr;
  }, [currentYear]);

  if (loading && !summary) return <LoadingSpinner fullPage={false} />;

  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">👋 Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Here's your financial overview</p>
        </div>
        <div className="topbar-actions">
          {fromCache && <span className="cache-badge">⚡ Cached</span>}
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

    
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value text-income">{fmt(summary?.totalIncome)}</div>
          <div className="stat-sub">{summary?.incomeCount || 0} transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expense</div>
          <div className="stat-value text-expense">{fmt(summary?.totalExpense)}</div>
          <div className="stat-sub">{summary?.expenseCount || 0} transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Balance</div>
          <div className={`stat-value ${summary?.netBalance >= 0 ? 'text-income' : 'text-expense'}`}>
            {fmt(summary?.netBalance)}
          </div>
          <div className="stat-sub">{summary?.netBalance >= 0 ? '✅ Positive' : '⚠️ Negative'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value text-primary">{summary?.totalTransactions || 0}</div>
          <div className="stat-sub">Total records in {selectedYear}</div>
        </div>
      </div>

   
      <div className="charts-grid">
        <PieChart data={categoryData} title="Expense by Category" />
        <LineChart data={monthlyTrends} title="Monthly Income vs Expense" />
      </div>


      <div style={{ marginBottom: '1.5rem' }}>
        <BarChart data={incomeVsExpense} title="Income vs Expense (Monthly)" />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🕒 Recent Transactions</h3>
          <a href="/transactions" style={{ color: 'var(--primary)', fontSize: '0.875rem', textDecoration: 'none' }}>View all →</a>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No transactions</td></tr>
              ) : recentTransactions.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                  <td>{t.category}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{t.description || '—'}</td>
                  <td><span className={`badge badge-${t.type}`}>{t.type}</span></td>
                  <td style={{ fontWeight: 600, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

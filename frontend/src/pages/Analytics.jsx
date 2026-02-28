import React, { useState, useMemo } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { PieChart, LineChart, BarChart } from '../components/dashboard/Charts';
import LoadingSpinner from '../components/common/LoadingSpinner';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function Analytics() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { summary, categoryData, monthlyTrends, incomeVsExpense, loading, fromCache } = useAnalytics(selectedYear);

  const years = useMemo(() => {
    const arr = [];
    for (let y = currentYear; y >= currentYear - 3; y--) arr.push(y);
    return arr;
  }, [currentYear]);

  const savingsRate = useMemo(() => {
    if (!summary?.totalIncome) return 0;
    return ((summary.netBalance / summary.totalIncome) * 100).toFixed(1);
  }, [summary]);

  if (loading && !summary) return <LoadingSpinner fullPage={false} />;

  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">📈 Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deep dive into your finances</p>
        </div>
        <div className="topbar-actions">
          {fromCache && <span className="cache-badge">⚡ Cached (15min)</span>}
          <select className="form-control" style={{ width: 'auto' }} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

   
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value text-income">{fmt(summary?.totalIncome)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expense</div>
          <div className="stat-value text-expense">{fmt(summary?.totalExpense)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Savings</div>
          <div className={`stat-value ${summary?.netBalance >= 0 ? 'text-income' : 'text-expense'}`}>
            {fmt(summary?.netBalance)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Savings Rate</div>
          <div className={`stat-value ${savingsRate >= 0 ? 'text-income' : 'text-expense'}`}>
            {savingsRate}%
          </div>
          <div className="stat-sub">of income saved</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Monthly Expense</div>
          <div className="stat-value text-primary">
            {fmt((summary?.totalExpense || 0) / 12)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value">{summary?.totalTransactions || 0}</div>
        </div>
      </div>

  
      <div className="charts-grid">
        <PieChart data={categoryData} title="Expense Category Breakdown" />
        <LineChart data={monthlyTrends} title={`Monthly Trends ${selectedYear}`} />
      </div>
      <BarChart data={incomeVsExpense} title={`Income vs Expense — ${selectedYear}`} />

    
      {categoryData.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">📋 Expense Breakdown by Category</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Transactions</th>
                  <th>Total</th>
                  <th>% of Expenses</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((c) => {
                  const pct = summary?.totalExpense
                    ? ((parseFloat(c.total) / summary.totalExpense) * 100).toFixed(1)
                    : 0;
                  return (
                    <tr key={c.category}>
                      <td style={{ fontWeight: 500 }}>{c.category}</td>
                      <td>{c.count}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{fmt(c.total)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: '0.85rem', minWidth: 40 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

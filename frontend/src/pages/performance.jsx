import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../services/api';
import API from '../services/api';

export default function Performance() {
  const [metrics, setMetrics] = useState([]);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [running, setRunning] = useState(false);

  const fetchCacheStatus = useCallback(async () => {
    try {
      const { data } = await API.get('/cache/status');
      setCacheStatus(data);
    } catch {
      setCacheStatus({ error: 'Could not reach cache status endpoint' });
    }
  }, []);

  useEffect(() => { fetchCacheStatus(); }, [fetchCacheStatus]);

  const runBenchmark = async () => {
    setRunning(true);
    setMetrics([]);
    const results = [];

    const endpoints = [
      { name: 'Summary', call: () => analyticsAPI.getSummary({ year: 2025 }) },
      { name: 'Category Breakdown', call: () => analyticsAPI.getCategoryBreakdown({ year: 2025 }) },
      { name: 'Monthly Trends', call: () => analyticsAPI.getMonthlyTrends({ year: 2025 }) },
      { name: 'Income vs Expense', call: () => analyticsAPI.getIncomeVsExpense({ year: 2025 }) },
    ];

    for (const ep of endpoints) {
      const t1Start = performance.now();
      let fromCache1 = false;
      try {
        const res = await ep.call();
        fromCache1 = res.data?.fromCache || false;
      } catch {}
      const t1 = performance.now() - t1Start;

      const t2Start = performance.now();
      let fromCache2 = false;
      try {
        const res = await ep.call();
        fromCache2 = res.data?.fromCache || false;
      } catch {}
      const t2 = performance.now() - t2Start;

      const improvement = t1 > 0 ? (((t1 - t2) / t1) * 100).toFixed(1) : 0;

      results.push({
        name: ep.name,
        dbTime: t1.toFixed(1),
        cacheTime: t2.toFixed(1),
        improvement: Math.max(0, improvement),
        call1Cache: fromCache1,
        call2Cache: fromCache2,
      });
    }

    setMetrics(results);
    await fetchCacheStatus();
    setRunning(false);
  };

  const avgImprovement = metrics.length
    ? (metrics.reduce((s, m) => s + parseFloat(m.improvement), 0) / metrics.length).toFixed(1)
    : null;

  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">⚡ Performance Metrics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Redis caching effectiveness benchmark
          </p>
        </div>
        <button className="btn btn-primary" onClick={runBenchmark} disabled={running}>
          {running ? '⏳ Running...' : '▶ Run Benchmark'}
        </button>
      </div>


      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #eef2ff, #f0fdf4)' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 700 }}>How Caching Works</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: 8 }}>
            <div style={{ fontSize: '1.5rem' }}>1️⃣</div>
            <strong>First Request</strong>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Cache MISS → Query runs on PostgreSQL → Result stored in Redis</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: 8 }}>
            <div style={{ fontSize: '1.5rem' }}>2️⃣</div>
            <strong>Subsequent Requests</strong>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Cache HIT → Data served from Redis → No DB query needed</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: 8 }}>
            <div style={{ fontSize: '1.5rem' }}>3️⃣</div>
            <strong>Auto Invalidation</strong>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Cache cleared on any create/update/delete → Data always fresh</p>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Analytics Cache TTL</div>
          <div className="stat-value text-primary">15 min</div>
          <div className="stat-sub">Summary, Category, Trends, IvE</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categories Cache TTL</div>
          <div className="stat-value text-primary">1 hour</div>
          <div className="stat-sub">Transaction category list</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cache Strategy</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>Cache-Aside</div>
          <div className="stat-sub">Read-through with write invalidation</div>
        </div>
        {avgImprovement && (
          <div className="stat-card">
            <div className="stat-label">Avg Speed Improvement</div>
            <div className="stat-value text-income">{avgImprovement}%</div>
            <div className="stat-sub">Cache vs DB response time</div>
          </div>
        )}
      </div>

   
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">🗂️ Active Redis Cache Keys</h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchCacheStatus}>Refresh</button>
        </div>
        {!cacheStatus ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : cacheStatus.error ? (
          <p style={{ color: 'var(--danger)' }}>{cacheStatus.error}</p>
        ) : cacheStatus.totalKeys === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>
            No cache keys yet. Run the benchmark or visit the Dashboard/Analytics page first.
          </p>
        ) : (
          <>
            <p style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {cacheStatus.totalKeys} active key(s) in Redis
            </p>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {Object.entries(cacheStatus.keys || {}).map(([key, ttl]) => (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0.75rem', marginBottom: '0.35rem',
                  background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)'
                }}>
                  <span style={{ color: 'var(--primary)' }}>{key}</span>
                  <span className="cache-badge">⏱ {ttl}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

     
      {metrics.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"> Benchmark Results</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Each endpoint called twice — 1st (DB) vs 2nd (Cache)
            </span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>1st Call (DB)</th>
                  <th>2nd Call (Cache)</th>
                  <th>Speed Improvement</th>
                  <th>Cache Working?</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.name}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td style={{ color: 'var(--danger)' }}>{m.dbTime} ms</td>
                    <td style={{ color: 'var(--success)' }}>{m.cacheTime} ms</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 80, height: 8, background: 'var(--border)', borderRadius: 4 }}>
                          <div style={{
                            width: `${Math.min(100, m.improvement)}%`, height: '100%',
                            background: 'var(--success)', borderRadius: 4
                          }} />
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>{m.improvement}% faster</span>
                      </div>
                    </td>
                    <td>
                      {m.call2Cache
                        ? <span className="badge badge-income"> Cache HIT</span>
                        : <span className="badge badge-expense"> Cache MISS</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            marginTop: '1.25rem', padding: '1rem',
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            borderRadius: 8, border: '1px solid #bbf7d0'
          }}>
            <strong> Summary:</strong> Redis cache served analytics data{' '}
            <strong style={{ color: 'var(--success)' }}>{avgImprovement}% faster</strong> on average.
            Cache eliminates repeated PostgreSQL queries for the same data within the 15-minute TTL window.
          </div>
        </div>
      )}

      {!running && metrics.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</p>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No benchmark data yet</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Click "Run Benchmark" to measure the speed difference between cached and uncached responses.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

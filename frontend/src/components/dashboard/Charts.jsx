import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16'];

export function PieChart({ data, title }) {
  const chartData = useMemo(() => ({
    labels: data.map((d) => d.category),
    datasets: [{
      data: data.map((d) => parseFloat(d.total)),
      backgroundColor: COLORS.slice(0, data.length),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }), [data]);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">🥧 {title || 'Category Distribution'}</h3>
      </div>
      {data.length === 0 ? (
        <div className="empty-state"><p>No data available</p></div>
      ) : (
        <Pie
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'right' },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ₹${parseFloat(ctx.raw).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                },
              },
            },
          }}
        />
      )}
    </div>
  );
}

export function LineChart({ data, title }) {
  const chartData = useMemo(() => ({
    labels: data.map((d) => d.month_name || d.period),
    datasets: [
      {
        label: 'Income',
        data: data.map((d) => parseFloat(d.income) || 0),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expense',
        data: data.map((d) => parseFloat(d.expense) || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }), [data]);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📉 {title || 'Monthly Trends'}</h3>
      </div>
      {data.length === 0 ? (
        <div className="empty-state"><p>No data available</p></div>
      ) : (
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { callback: (v) => `₹${(v / 1000).toFixed(0)}k` },
              },
            },
          }}
        />
      )}
    </div>
  );
}

export function BarChart({ data, title }) {
  const chartData = useMemo(() => ({
    labels: data.map((d) => d.period || d.month_name),
    datasets: [
      {
        label: 'Income',
        data: data.map((d) => parseFloat(d.income) || 0),
        backgroundColor: 'rgba(34,197,94,0.8)',
        borderRadius: 4,
      },
      {
        label: 'Expense',
        data: data.map((d) => parseFloat(d.expense) || 0),
        backgroundColor: 'rgba(239,68,68,0.8)',
        borderRadius: 4,
      },
    ],
  }), [data]);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📊 {title || 'Income vs Expense'}</h3>
      </div>
      {data.length === 0 ? (
        <div className="empty-state"><p>No data available</p></div>
      ) : (
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { callback: (v) => `₹${(v / 1000).toFixed(0)}k` },
              },
              x: { grid: { display: false } },
            },
          }}
        />
      )}
    </div>
  );
}

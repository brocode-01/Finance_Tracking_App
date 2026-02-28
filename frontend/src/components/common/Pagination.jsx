import React from 'react';

export default function Pagination({ pagination, onPageChange }) {
  const { page, totalPages, total, limit } = pagination;
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Showing {start}–{end} of {total}
      </span>
      <div className="pagination">
        <button
          className="page-btn"
          disabled={page === 1}
          onClick={() => onPageChange(1)}
        >«</button>
        <button
          className="page-btn"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >‹</button>
        {pages.map((p) => (
          <button
            key={p}
            className={`page-btn ${p === page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >{p}</button>
        ))}
        <button
          className="page-btn"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >›</button>
        <button
          className="page-btn"
          disabled={page === totalPages}
          onClick={() => onPageChange(totalPages)}
        >»</button>
      </div>
    </div>
  );
}

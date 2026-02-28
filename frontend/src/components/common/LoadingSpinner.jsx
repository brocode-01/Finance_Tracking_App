import React from 'react';

export default function LoadingSpinner({ fullPage = true }) {
  return (
    <div className={fullPage ? 'spinner-wrapper' : ''} style={fullPage ? { minHeight: '100vh' } : {}}>
      <div className="spinner" />
    </div>
  );
}

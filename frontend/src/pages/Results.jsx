import React from 'react';
import { useParams } from 'react-router-dom';

export default function Results() {
  const { code } = useParams();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: '#22c55e', marginBottom: '1rem' }}>Results</h1>
        <p style={{ color: '#94a3b8' }}>Room: <strong style={{ color: '#f1f5f9' }}>{code}</strong></p>
        <p style={{ color: '#64748b', marginTop: '1rem', fontSize: '0.9rem' }}>(Results feature coming soon)</p>
      </div>
    </div>
  );
}

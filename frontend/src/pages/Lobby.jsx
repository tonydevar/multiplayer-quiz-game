import React from 'react';
import { useParams } from 'react-router-dom';

export default function Lobby() {
  const { code } = useParams();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: '#38bdf8', marginBottom: '1rem' }}>Lobby</h1>
        <p style={{ color: '#94a3b8' }}>Room code: <strong style={{ color: '#f1f5f9', letterSpacing: '0.2rem' }}>{code}</strong></p>
        <p style={{ color: '#64748b', marginTop: '1rem', fontSize: '0.9rem' }}>(Lobby feature coming soon)</p>
      </div>
    </div>
  );
}

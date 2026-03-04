import React from 'react';

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Scoreboard overlay shown between rounds.
 *
 * Props:
 *   scores  — object keyed by playerId: { name, gained, total }
 *             OR array of { id, name, score } (game:end shape)
 *   onClose — optional close handler
 */
export default function Scoreboard({ scores, onClose }) {
  // Normalise both shapes into [ { name, total, gained? } ]
  let rows = [];
  if (Array.isArray(scores)) {
    rows = scores.map((p) => ({ name: p.name, total: p.score, gained: null }));
  } else if (scores && typeof scores === 'object') {
    rows = Object.values(scores).map((p) => ({
      name: p.name,
      total: p.total,
      gained: p.gained,
    }));
  }

  rows.sort((a, b) => b.total - a.total);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: '1rem',
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
        }}
      >
        <h2 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
          📊 Scores
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {rows.map((row, i) => (
            <div
              key={row.name + i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 1rem',
                borderRadius: '0.5rem',
                background: i === 0 ? 'rgba(56,189,248,0.1)' : '#0f172a',
                border: i === 0 ? '1px solid #38bdf8' : '1px solid #1e293b',
              }}
            >
              <span style={{ fontSize: '1.25rem', width: '1.5rem', textAlign: 'center' }}>
                {MEDALS[i] || `${i + 1}.`}
              </span>
              <span style={{ flex: 1, fontWeight: 600, color: '#f1f5f9' }}>{row.name}</span>
              <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '1.1rem' }}>
                {row.total}
              </span>
              {row.gained !== null && row.gained !== undefined && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: row.gained > 0 ? '#22c55e' : '#64748b',
                    fontWeight: 600,
                  }}
                >
                  {row.gained > 0 ? `+${row.gained}` : '–'}
                </span>
              )}
            </div>
          ))}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              padding: '0.7rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

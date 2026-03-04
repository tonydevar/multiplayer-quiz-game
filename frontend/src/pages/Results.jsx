import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Confetti from '../components/Confetti.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];

const RANK_COLOURS = {
  0: { border: '#f59e0b', bg: 'rgba(245,158,11,0.12)', nameColor: '#fcd34d' },
  1: { border: '#94a3b8', bg: 'rgba(148,163,184,0.08)', nameColor: '#cbd5e1' },
  2: { border: '#b45309', bg: 'rgba(180,83,9,0.08)', nameColor: '#fbbf24' },
};

export default function Results() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [finalData, setFinalData] = useState(null);

  useEffect(() => {
    // Load from sessionStorage (saved by Game.jsx on game:end)
    try {
      const raw = sessionStorage.getItem('quiz_final');
      if (raw) {
        setFinalData(JSON.parse(raw));
      }
    } catch {
      // nothing
    }
  }, []);

  const players = finalData?.finalScores ?? [];
  const winner = finalData?.winner ?? null;

  // Check if current user is the winner
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem('quiz_session') || '{}'); } catch { return {}; }
  })();
  const isWinner = winner && session.name && winner.name === session.name;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
      gap: '1.5rem',
    }}>
      {/* Confetti fires for everyone — celebrating the winner */}
      <Confetti active={players.length > 0} />

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.25rem' }}>🏆</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', marginBottom: '0.25rem' }}>
          Game Over!
        </h1>
        {winner && (
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            {isWinner ? '🎉 You won!' : `🎉 ${winner.name} wins!`}
          </p>
        )}
        {code && (
          <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: '0.25rem' }}>Room {code}</p>
        )}
      </div>

      {/* Leaderboard */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#1e293b',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Final Standings
        </h2>

        {players.length === 0 ? (
          <p style={{ color: '#475569', textAlign: 'center', padding: '1.5rem 0' }}>
            No scores available.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {players.map((player, i) => {
              const rankStyle = RANK_COLOURS[i] || { border: '#1e293b', bg: '#0f172a', nameColor: '#f1f5f9' };
              const isFirst = i === 0;

              return (
                <div
                  key={player.id || player.name + i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: isFirst ? '1rem 1.25rem' : '0.7rem 1rem',
                    borderRadius: '0.75rem',
                    background: rankStyle.bg,
                    border: `2px solid ${rankStyle.border}`,
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Rank icon */}
                  <span style={{ fontSize: isFirst ? '1.75rem' : '1.25rem', width: '2rem', textAlign: 'center', flexShrink: 0 }}>
                    {MEDALS[i] || `${i + 1}`}
                  </span>

                  {/* Name */}
                  <span style={{
                    flex: 1,
                    fontWeight: isFirst ? 800 : 600,
                    fontSize: isFirst ? '1.15rem' : '1rem',
                    color: rankStyle.nameColor,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {player.name}
                    {isFirst && <span style={{ marginLeft: '0.4rem', fontSize: '0.9rem' }}>👑</span>}
                  </span>

                  {/* Score */}
                  <span style={{
                    fontWeight: 800,
                    fontSize: isFirst ? '1.4rem' : '1.1rem',
                    color: isFirst ? '#f59e0b' : '#94a3b8',
                    flexShrink: 0,
                  }}>
                    {player.score}
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, marginLeft: '0.2rem', color: '#475569' }}>pts</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Play Again */}
      <button
        onClick={() => navigate('/create')}
        style={{
          padding: '0.9rem 2.5rem',
          borderRadius: '0.625rem',
          border: 'none',
          background: '#38bdf8',
          color: '#0f172a',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          minWidth: '200px',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        🔄 Play Again
      </button>
    </div>
  );
}

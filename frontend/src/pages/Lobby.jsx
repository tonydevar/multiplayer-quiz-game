import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    background: '#1e293b',
    borderRadius: '1rem',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
  },
  title: { fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.25rem' },
  codeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: '#0f172a',
    borderRadius: '0.625rem',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
  },
  code: { fontSize: '2rem', fontWeight: 900, letterSpacing: '0.3rem', color: '#f1f5f9', flex: 1 },
  copyBtn: {
    padding: '0.4rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1.5px solid #334155',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '0.8rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  sectionTitle: { fontSize: '0.875rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  playerList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.6rem 0.875rem',
    background: '#0f172a',
    borderRadius: '0.5rem',
  },
  playerName: { flex: 1, fontWeight: 600, color: '#f1f5f9' },
  badge: (ready) => ({
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.2rem 0.5rem',
    borderRadius: '9999px',
    background: ready ? '#15803d' : '#334155',
    color: ready ? '#bbf7d0' : '#94a3b8',
  }),
  startBtn: (enabled) => ({
    width: '100%',
    padding: '0.85rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: enabled ? '#38bdf8' : '#334155',
    color: enabled ? '#0f172a' : '#64748b',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s',
  }),
  readyBtn: (ready) => ({
    width: '100%',
    padding: '0.85rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: ready ? '#15803d' : '#a78bfa',
    color: ready ? '#bbf7d0' : '#0f172a',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  hint: { marginTop: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' },
};

export default function Lobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { send, roomState, lastEvent } = useSocket();

  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Load session
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem('quiz_session') || '{}'); } catch { return {}; }
  })();
  const isHost = session.isHost === true;

  // Join room via WS when lobby mounts (host joins too)
  useEffect(() => {
    if (session.name && code) {
      send('player:join', { code, name: session.name });
    }
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to /game when game starts
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === 'room:state' && lastEvent.payload?.status === 'playing') {
      navigate(`/game/${code}`, { replace: true });
    }
  }, [lastEvent, code, navigate]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }, [code]);

  const handleReady = useCallback(() => {
    const next = !isReady;
    setIsReady(next);
    send('player:ready', { ready: next });
  }, [isReady, send]);

  const handleStart = useCallback(() => {
    send('game:start', {});
  }, [send]);

  const players = roomState?.players || [];
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>🎯 Waiting Lobby</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Share the code with your friends
        </p>

        {/* Room code + copy */}
        <div style={s.codeRow}>
          <span style={s.code}>{code}</span>
          <button style={s.copyBtn} onClick={handleCopy}>
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>

        {/* Player list */}
        <p style={s.sectionTitle}>Players ({players.length})</p>
        <ul style={s.playerList}>
          {players.length === 0 && (
            <li style={{ color: '#475569', fontSize: '0.9rem', padding: '0.5rem' }}>
              Waiting for players to join…
            </li>
          )}
          {players.map((p) => (
            <li key={p.id} style={s.playerRow}>
              <span style={{ fontSize: '1.1rem' }}>{p.isHost ? '👑' : '🎮'}</span>
              <span style={s.playerName}>
                {p.name}
                {p.isHost && <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.4rem' }}>(host)</span>}
              </span>
              <span style={s.badge(p.ready)}>
                {p.ready ? '✅ Ready' : '⏳ Not ready'}
              </span>
            </li>
          ))}
        </ul>

        {/* Action button */}
        {isHost ? (
          <>
            <button
              style={s.startBtn(allReady)}
              onClick={handleStart}
              disabled={!allReady}
            >
              🚀 Start Game
            </button>
            {!allReady && (
              <p style={s.hint}>
                {players.length < 2
                  ? 'Need at least 2 players to start.'
                  : 'Waiting for all players to be ready.'}
              </p>
            )}
          </>
        ) : (
          <>
            <button style={s.readyBtn(isReady)} onClick={handleReady}>
              {isReady ? '✅ Ready!' : "I'm Ready"}
            </button>
            <p style={s.hint}>
              {isReady ? 'Waiting for the host to start…' : 'Click when you are ready to play.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

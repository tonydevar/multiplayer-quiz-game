import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '1rem',
  },
  card: {
    background: '#1e293b',
    borderRadius: '1rem',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    marginBottom: '0.5rem',
    color: '#a78bfa',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    marginBottom: '2rem',
    textAlign: 'center',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: '0.4rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: '1.5px solid #334155',
    background: '#0f172a',
    color: '#f1f5f9',
    fontSize: '1rem',
    outline: 'none',
    marginBottom: '1.5rem',
  },
  codeInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: '1.5px solid #334155',
    background: '#0f172a',
    color: '#f1f5f9',
    fontSize: '1.25rem',
    fontWeight: 700,
    letterSpacing: '0.25rem',
    textTransform: 'uppercase',
    outline: 'none',
    marginBottom: '1.5rem',
  },
  button: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: '#a78bfa',
    color: '#0f172a',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    color: '#f87171',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  backLink: {
    marginTop: '1.5rem',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  link: {
    color: '#a78bfa',
    textDecoration: 'underline',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: 'inherit',
  },
};

export default function JoinRoom() {
  const navigate = useNavigate();
  const { code: codeParam } = useParams();
  const { send, wsRef } = useSocket();

  const [roomCode, setRoomCode] = useState((codeParam || '').toUpperCase());
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const name = playerName.trim();
    const code = roomCode.trim().toUpperCase();

    if (!code) {
      setError('Please enter the room code.');
      return;
    }
    if (!name) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify room exists via REST first
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) {
        throw new Error('Room not found. Check the code and try again.');
      }

      // Store session info
      sessionStorage.setItem('quiz_session', JSON.stringify({ name, isHost: false, code }));

      // Send player:join via WebSocket
      // Ensure WS is open (SocketContext auto-connects)
      const ws = wsRef.current;
      const doJoin = () => {
        send('player:join', { code, name });
        navigate(`/lobby/${code}`);
      };

      if (ws && ws.readyState === WebSocket.OPEN) {
        doJoin();
      } else {
        // Wait briefly for connection to establish
        const deadline = Date.now() + 4000;
        const interval = setInterval(() => {
          const w = wsRef.current;
          if (w && w.readyState === WebSocket.OPEN) {
            clearInterval(interval);
            doJoin();
          } else if (Date.now() > deadline) {
            clearInterval(interval);
            setError('Could not connect to the server. Please try again.');
            setLoading(false);
          }
        }, 100);
      }
    } catch (err) {
      setError(err.message || 'Network error. Is the backend running?');
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎮 Join Room</h1>
        <p style={styles.subtitle}>Enter the room code to join your friends</p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="roomCode" style={styles.label}>Room code</label>
          <input
            id="roomCode"
            type="text"
            placeholder="ABC123"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={styles.codeInput}
          />

          <label htmlFor="playerName" style={styles.label}>Your name</label>
          <input
            id="playerName"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={24}
            autoFocus={!codeParam}
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          >
            {loading ? 'Joining…' : 'Join Room'}
          </button>
        </form>

        <p style={styles.backLink}>
          Want to host?{' '}
          <button style={styles.link} onClick={() => navigate('/create')}>
            Create a room
          </button>
        </p>
      </div>
    </div>
  );
}

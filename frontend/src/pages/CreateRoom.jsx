import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    color: '#38bdf8',
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
  button: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: '#38bdf8',
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
  joinLink: {
    marginTop: '1.5rem',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  link: {
    color: '#38bdf8',
    textDecoration: 'underline',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: 'inherit',
  },
};

export default function CreateRoom() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const name = hostName.trim();
    if (!name) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create room.');
      }

      const { code } = await res.json();
      sessionStorage.setItem('quiz_session', JSON.stringify({ name, isHost: true, code }));
      navigate(`/lobby/${code}`);
    } catch (err) {
      setError(err.message || 'Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎯 Quiz Game</h1>
        <p style={styles.subtitle}>Create a room and invite your friends</p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="hostName" style={styles.label}>Your name</label>
          <input
            id="hostName"
            type="text"
            placeholder="Enter your name"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            maxLength={24}
            autoFocus
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          >
            {loading ? 'Creating…' : 'Create Room'}
          </button>
        </form>

        <p style={styles.joinLink}>
          Have a code?{' '}
          <button style={styles.link} onClick={() => navigate('/join')}>
            Join a room
          </button>
        </p>
      </div>
    </div>
  );
}

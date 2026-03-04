import React from 'react';

// state: 'default' | 'selected' | 'correct' | 'incorrect'
const STATE_STYLES = {
  default: {
    background: '#1e293b',
    border: '2px solid #334155',
    color: '#f1f5f9',
    cursor: 'pointer',
    transform: 'scale(1)',
  },
  selected: {
    background: '#1d4ed8',
    border: '2px solid #3b82f6',
    color: '#fff',
    cursor: 'not-allowed',
    transform: 'scale(1)',
  },
  correct: {
    background: '#15803d',
    border: '2px solid #22c55e',
    color: '#fff',
    cursor: 'not-allowed',
    transform: 'scale(1.02)',
  },
  incorrect: {
    background: '#7f1d1d',
    border: '2px solid #ef4444',
    color: '#fca5a5',
    cursor: 'not-allowed',
    transform: 'scale(1)',
  },
};

const ICONS = {
  default: '',
  selected: '⏳',
  correct: '✅',
  incorrect: '❌',
};

export default function AnswerButton({ label, onClick, state = 'default', index }) {
  const LETTERS = ['A', 'B', 'C', 'D'];
  const letter = LETTERS[index] || '';
  const stateStyle = STATE_STYLES[state] || STATE_STYLES.default;
  const icon = ICONS[state] || '';

  return (
    <button
      onClick={state === 'default' ? onClick : undefined}
      disabled={state !== 'default'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '0.9rem 1.25rem',
        borderRadius: '0.625rem',
        fontSize: '1rem',
        fontWeight: 500,
        textAlign: 'left',
        transition: 'all 0.2s ease',
        outline: 'none',
        ...stateStyle,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '1.75rem',
          height: '1.75rem',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          fontSize: '0.875rem',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {letter}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {icon && <span style={{ fontSize: '1.1rem' }}>{icon}</span>}
    </button>
  );
}

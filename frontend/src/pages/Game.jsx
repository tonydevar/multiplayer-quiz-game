import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import CountdownTimer from '../components/CountdownTimer.jsx';
import AnswerButton from '../components/AnswerButton.jsx';
import Scoreboard from '../components/Scoreboard.jsx';

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.5rem 1rem',
    gap: '1.25rem',
  },
  header: {
    width: '100%',
    maxWidth: '680px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionBadge: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: 600,
  },
  card: {
    background: '#1e293b',
    borderRadius: '1rem',
    padding: '2rem 1.75rem',
    width: '100%',
    maxWidth: '680px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
  },
  question: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f1f5f9',
    lineHeight: 1.5,
    marginBottom: '1.75rem',
    textAlign: 'center',
  },
  choices: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  waiting: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    gap: '1rem',
  },
};

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { send, lastEvent } = useSocket();

  const [question, setQuestion] = useState(null);   // { index, question, choices, timeLimit }
  const [timerKey, setTimerKey] = useState(0);      // increment to reset CountdownTimer
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [roundResult, setRoundResult] = useState(null); // { correctAnswer, scores }
  const [showScoreboard, setShowScoreboard] = useState(false);

  // Track submitted answers per question index so we don't double-submit
  const submittedRef = useRef(new Set());

  const handleExpire = useCallback(() => {
    // Timer ran out client-side — server will also resolve, nothing extra needed
  }, []);

  useEffect(() => {
    if (!lastEvent) return;
    const { type, payload } = lastEvent;

    if (type === 'question:new') {
      setQuestion(payload);
      setSelectedIdx(null);
      setRoundResult(null);
      setShowScoreboard(false);
      setTimerKey((k) => k + 1);
      return;
    }

    if (type === 'round:results') {
      setRoundResult(payload);
      setShowScoreboard(true);
      return;
    }

    if (type === 'game:end') {
      // Store final scores for Results page then navigate
      sessionStorage.setItem('quiz_final', JSON.stringify(payload));
      navigate(`/results/${code}`, { replace: true });
      return;
    }
  }, [lastEvent, code, navigate]);

  const handleAnswer = useCallback(
    (choice, idx) => {
      if (selectedIdx !== null) return;
      if (!question) return;
      if (submittedRef.current.has(question.index)) return;

      submittedRef.current.add(question.index);
      setSelectedIdx(idx);
      send('answer:submit', { questionIndex: question.index, answer: choice });
    },
    [selectedIdx, question, send]
  );

  const dismissScoreboard = useCallback(() => {
    setShowScoreboard(false);
  }, []);

  // Determine button states
  function getButtonState(choice, idx) {
    if (!roundResult) {
      if (selectedIdx === null) return 'default';
      return idx === selectedIdx ? 'selected' : 'default';
    }
    // After result
    if (choice === roundResult.correctAnswer) return 'correct';
    if (idx === selectedIdx) return 'incorrect';
    return 'default';
  }

  if (!question) {
    return (
      <div style={s.waiting}>
        <span style={{ fontSize: '3rem' }}>⏳</span>
        <p style={{ fontSize: '1.1rem' }}>Waiting for the game to start…</p>
        <p style={{ fontSize: '0.875rem', color: '#475569' }}>Room: {code}</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header row */}
      <div style={s.header}>
        <span style={s.questionBadge}>
          Question {question.index + 1} of 10
        </span>
        <CountdownTimer
          key={timerKey}
          duration={question.timeLimit || 15}
          onExpire={handleExpire}
        />
      </div>

      {/* Question card */}
      <div style={s.card}>
        <p style={s.question}>{question.question}</p>

        <div style={s.choices}>
          {question.choices.map((choice, idx) => (
            <AnswerButton
              key={idx}
              index={idx}
              label={choice}
              state={getButtonState(choice, idx)}
              onClick={() => handleAnswer(choice, idx)}
            />
          ))}
        </div>
      </div>

      {/* Scoreboard overlay between rounds */}
      {showScoreboard && roundResult && (
        <Scoreboard
          scores={roundResult.scores}
          onClose={dismissScoreboard}
        />
      )}
    </div>
  );
}

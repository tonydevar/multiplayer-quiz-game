import React, { useEffect, useRef, useState } from 'react';

const SIZE = 120;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Animated SVG circular countdown timer.
 *
 * Props:
 *   duration   — total seconds (e.g. 15)
 *   onExpire   — called once when time reaches 0
 *   key        — change key externally to reset the timer
 */
export default function CountdownTimer({ duration, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const startRef = useRef(performance.now());
  const rafRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    startRef.current = performance.now();
    firedRef.current = false;
    setTimeLeft(duration);

    function tick(now) {
      const elapsed = (now - startRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (!firedRef.current) {
          firedRef.current = true;
          onExpire && onExpire();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration, onExpire]);

  const progress = timeLeft / duration; // 1 → 0
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // Colour shifts red as time runs out
  const hue = Math.round(progress * 120); // 120 = green, 0 = red
  const colour = `hsl(${hue}, 90%, 55%)`;

  const seconds = Math.ceil(timeLeft);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#1e293b"
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={colour}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.3s' }}
        />
        {/* Counter text — rotated back upright */}
        <text
          x={SIZE / 2}
          y={SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fill: colour,
            fontSize: '1.75rem',
            fontWeight: 800,
            fontFamily: 'inherit',
            transform: `rotate(90deg)`,
            transformOrigin: `${SIZE / 2}px ${SIZE / 2}px`,
          }}
        >
          {seconds}
        </text>
      </svg>
      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>seconds</span>
    </div>
  );
}

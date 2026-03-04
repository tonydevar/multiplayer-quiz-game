import { useEffect } from 'react';
import confetti from 'canvas-confetti';

/**
 * Fires a confetti burst on mount. No DOM output — purely a side-effect component.
 * Props:
 *   active — if false, skip firing
 */
export default function Confetti({ active = true }) {
  useEffect(() => {
    if (!active) return;

    // First big burst from both sides
    const left = confetti({
      particleCount: 80,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.65 },
      colors: ['#38bdf8', '#a78bfa', '#f59e0b', '#22c55e', '#f87171'],
    });

    const right = confetti({
      particleCount: 80,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.65 },
      colors: ['#38bdf8', '#a78bfa', '#f59e0b', '#22c55e', '#f87171'],
    });

    // Follow-up shower from the top
    const top = setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 90,
        spread: 120,
        origin: { x: 0.5, y: 0 },
        startVelocity: 30,
        colors: ['#ffd700', '#fff', '#38bdf8', '#a78bfa'],
      });
    }, 400);

    return () => {
      clearTimeout(top);
    };
  }, [active]);

  return null;
}

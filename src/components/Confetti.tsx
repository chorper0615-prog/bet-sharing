import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
}

const COLORS = ['#a78bfa', '#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#f87171', '#818cf8'];

export const Confetti: React.FC<ConfettiProps> = ({ active }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < 80; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-particle';
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const left = Math.random() * 100;
      const duration = 1.5 + Math.random() * 2;
      const delay = Math.random() * 0.8;
      const size = 6 + Math.random() * 8;
      const isCircle = Math.random() > 0.5;

      el.style.cssText = `
        left: ${left}vw;
        top: -20px;
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: ${isCircle ? '50%' : '2px'};
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        transform: rotate(${Math.random() * 360}deg);
      `;

      document.body.appendChild(el);
      particles.push(el);
    }

    const cleanup = setTimeout(() => {
      particles.forEach(p => p.remove());
    }, 3500);

    return () => {
      clearTimeout(cleanup);
      particles.forEach(p => p.remove());
    };
  }, [active]);

  return <div ref={containerRef} />;
};

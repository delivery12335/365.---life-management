import { useEffect, useRef, useState, type ReactNode } from 'react';
export function ProgressRing({
  value,
  size = 156,
  color = 'var(--blue)',
  stroke = 10,
  children,
  label,
}: {
  value: number;
  size?: number;
  color?: string;
  stroke?: number;
  children?: ReactNode;
  label: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value));
  const element = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    let firstFrame = 0;
    let secondFrame = 0;
    const reveal = () => {
      observer?.disconnect();
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => setEntered(true));
      });
    };
    const preferenceChanged = () => {
      if (motion.matches) {
        observer?.disconnect();
        setEntered(true);
      }
    };
    if (motion.matches) setEntered(true);
    else if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) reveal();
        },
        { threshold: 0.15 },
      );
      if (element.current) observer.observe(element.current);
    } else reveal();
    motion.addEventListener('change', preferenceChanged);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      motion.removeEventListener('change', preferenceChanged);
    };
  }, []);
  return (
    <div
      className="progress-ring"
      ref={element}
      data-entered={entered}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - (entered ? progress : 0) / 100)}
        />
      </svg>
      {children && <div className="ring-center">{children}</div>}
    </div>
  );
}

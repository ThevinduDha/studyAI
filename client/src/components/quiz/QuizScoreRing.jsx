import React from 'react';

/**
 * QuizScoreRing
 *
 * Lightweight, zero-dependency SVG circular progress ring for quiz scores.
 * Uses semantic tokens and smooth stroke transitions.
 */
export function QuizScoreRing({
  percentage = 0,
  score = null,
  total = null,
  size = 130,
  strokeWidth = 10,
  className = ''
}) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;

  // Semantic color selection
  let strokeColor = '#6366f1'; // indigo
  let textColor = 'text-indigo-500';
  let bgColor = 'text-indigo-500/10';

  if (safePercent >= 70) {
    strokeColor = '#10b981'; // emerald
    textColor = 'text-emerald-500';
    bgColor = 'text-emerald-500/10';
  } else if (safePercent < 50) {
    strokeColor = '#f43f5e'; // rose
    textColor = 'text-rose-500';
    bgColor = 'text-rose-500/10';
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      role="progressbar"
      aria-valuenow={safePercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Score: ${safePercent}%`}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Track Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-subtle"
        />

        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </svg>

      {/* Center Display */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${textColor}`}>
          {safePercent}%
        </span>
        {score !== null && total !== null && (
          <span className="text-[11px] font-medium text-muted mt-0.5">
            {score}/{total}
          </span>
        )}
      </div>
    </div>
  );
}

export default QuizScoreRing;

import React from 'react';

/**
 * QuizStatCard
 *
 * Clean, modern metric card for displaying test counts, scores, and accuracy.
 */
export function QuizStatCard({
  icon: Icon,
  label,
  value,
  subtext = null,
  variant = 'default',
  className = ''
}) {
  const variantStyles = {
    default: {
      border: 'border-subtle',
      iconBg: 'bg-indigo-500/10 text-indigo-400',
      valueColor: 'text-heading'
    },
    emerald: {
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      valueColor: 'text-emerald-400'
    },
    rose: {
      border: 'border-rose-500/30',
      iconBg: 'bg-rose-500/10 text-rose-400',
      valueColor: 'text-rose-400'
    },
    indigo: {
      border: 'border-indigo-500/30',
      iconBg: 'bg-indigo-500/10 text-indigo-400',
      valueColor: 'text-indigo-400'
    },
    amber: {
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-400',
      valueColor: 'text-amber-400'
    }
  };

  const current = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`card-base p-4 rounded-xl border ${current.border} shadow-xs transition hover:border-indigo-500/30 ${className}`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${current.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted block truncate">
            {label}
          </span>
          <span className={`text-xl sm:text-2xl font-extrabold tracking-tight block ${current.valueColor}`}>
            {value}
          </span>
          {subtext && (
            <span className="text-[11px] text-muted block truncate mt-0.5">
              {subtext}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuizStatCard;

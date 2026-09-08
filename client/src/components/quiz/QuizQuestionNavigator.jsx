import React from 'react';
import { Check } from 'lucide-react';

/**
 * QuizQuestionNavigator
 *
 * Clickable question palette allowing fast jump-to navigation with
 * clear visual indicators for answered, current, and unanswered items.
 */
export function QuizQuestionNavigator({
  questions = [],
  currentIndex = 0,
  selectedAnswers = {},
  onSelectIndex,
  className = ''
}) {
  const answeredCount = questions.filter(
    (q) => selectedAnswers[q.id]?.trim()?.length > 0
  ).length;

  return (
    <div className={`card-base p-4 rounded-xl border border-subtle space-y-3 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-heading">Question Navigator</span>
        <div className="flex items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Answered ({answeredCount})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-subtle border border-subtle" />
            Remaining ({questions.length - answeredCount})
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = Boolean(selectedAnswers[q.id]?.trim()?.length > 0);

          return (
            <button
              key={q.id || idx}
              type="button"
              onClick={() => onSelectIndex(idx)}
              aria-label={`Jump to question ${idx + 1}${isCurrent ? ' (current)' : ''}${isAnswered ? ' (answered)' : ''}`}
              className={`relative h-9 w-9 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center select-none ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500 ring-offset-2 ring-offset-canvas'
                  : isAnswered
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'card-base border border-subtle text-muted hover:text-heading hover:border-indigo-500/40'
              }`}
            >
              <span>{idx + 1}</span>
              {isAnswered && !isCurrent && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="h-2 w-2 stroke-[3]" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuizQuestionNavigator;

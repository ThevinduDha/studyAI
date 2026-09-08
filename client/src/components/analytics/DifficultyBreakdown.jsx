import React from 'react';
import { Target, Layers, HelpCircle } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

/**
 * DifficultyBreakdown
 *
 * Visual horizontal bar cards for Level 2, Level 3, and Level 4 questions.
 */
export function DifficultyBreakdown({
  difficultyPerformance = [],
  className = ''
}) {
  const statusBadgeVariant = {
    strong: 'emerald',
    average: 'amber',
    weak: 'rose',
    insufficient_data: 'default'
  };

  return (
    <Card className={`p-5 sm:p-6 shadow-sm border border-subtle space-y-4 ${className}`}>
      <div>
        <h3 className="text-sm sm:text-base font-bold text-heading flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-400" />
          Performance by Difficulty Level
        </h3>
        <p className="text-xs text-muted mt-0.5">
          Diagnoses whether errors concentrate on foundational recall or advanced scenarios
        </p>
      </div>

      <div className="space-y-3.5">
        {difficultyPerformance.map((diff) => {
          const accuracy = Math.round(diff.accuracy || 0);
          const status = (diff.status || 'insufficient_data').toLowerCase();

          return (
            <div
              key={diff.difficulty}
              className="p-4 rounded-xl card-base border border-subtle shadow-xs space-y-2 hover:border-indigo-500/30 transition"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-heading">
                  {diff.label || `Level ${diff.difficulty}`}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-heading text-sm">{accuracy}%</span>
                  <Badge
                    variant={statusBadgeVariant[status] || 'default'}
                    size="xs"
                    className="capitalize"
                  >
                    {status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-subtle rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    accuracy >= 80 ? 'bg-emerald-500' : accuracy >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted pt-0.5">
                <span>{diff.correct} correct / {diff.total} total</span>
                <span>{diff.attempted} answered</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default DifficultyBreakdown;

import React from 'react';
import { Zap, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

/**
 * QuestionTypeBreakdown
 *
 * Visual horizontal bars analyzing MCQ vs True/False vs Short Answer vs Scenario.
 */
export function QuestionTypeBreakdown({
  questionTypePerformance = [],
  weakestQuestionType = null,
  className = ''
}) {
  const formatTypeName = (type) => {
    switch (type) {
      case 'MCQ':
        return 'Multiple Choice (MCQ)';
      case 'TRUE_FALSE':
        return 'True / False';
      case 'SHORT_ANSWER':
        return 'Short Answer';
      case 'SCENARIO':
        return 'Scenario Case Study';
      default:
        return type.replace('_', ' ');
    }
  };

  return (
    <Card className={`p-5 sm:p-6 shadow-sm border border-subtle space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-heading flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-400" />
            Performance by Question Type
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Compares factual recall vs complex scenario diagnostic accuracy
          </p>
        </div>

        {weakestQuestionType && (
          <Badge variant="rose" size="xs" className="font-bold">
            Weakest: {weakestQuestionType}
          </Badge>
        )}
      </div>

      <div className="space-y-3.5">
        {questionTypePerformance.map((item) => {
          const accuracy = Math.round(item.accuracy || 0);
          const isWeakest = item.questionType === weakestQuestionType;

          return (
            <div
              key={item.questionType}
              className={`p-4 rounded-xl card-base border shadow-xs space-y-2 transition ${
                isWeakest ? 'border-rose-500/40 bg-rose-500/5' : 'border-subtle hover:border-indigo-500/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-heading">
                  {formatTypeName(item.questionType)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-heading text-sm">{accuracy}%</span>
                  {isWeakest && (
                    <Badge variant="rose" size="xs">
                      Focus Area
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-subtle rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    accuracy >= 80 ? 'bg-emerald-500' : accuracy >= 60 ? 'bg-amber-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted pt-0.5">
                <span>{item.correct} correct / {item.total} total</span>
                <span>{item.attempted} answered</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default QuestionTypeBreakdown;

import React from 'react';
import { AlertTriangle, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';

/**
 * WeakTopicCard
 *
 * Visual card for prioritized weak topics identified by Phase 11 formula.
 */
export function WeakTopicCard({
  topic = {},
  onPractice = null,
  className = ''
}) {
  const priorityVariant = {
    HIGH: 'rose',
    MEDIUM: 'amber',
    LOW: 'indigo'
  }[topic.priority] || 'rose';

  const accuracy = Math.round(topic.accuracy || 0);

  return (
    <Card
      className={`p-5 flex flex-col justify-between transition-all duration-200 hover:border-indigo-500/40 shadow-xs border border-subtle ${className}`}
    >
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {topic.moduleCode && (
              <Badge variant="indigo" size="xs">
                {topic.moduleCode}
              </Badge>
            )}
            <Badge variant="default" size="xs">
              Level {Math.round(topic.averageDifficulty || 3)}
            </Badge>
          </div>

          <Badge variant={priorityVariant} size="xs" className="font-bold">
            {topic.priority} Priority
          </Badge>
        </div>

        {/* Topic Title */}
        <h3 className="text-sm sm:text-base font-bold text-heading line-clamp-2 leading-snug">
          {topic.topic}
        </h3>

        {/* Accuracy Progress Bar */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-muted">
            <span>Accuracy Rate</span>
            <span className="font-bold text-rose-400">{accuracy}%</span>
          </div>

          <div className="w-full bg-subtle rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                accuracy >= 60 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${accuracy}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted pt-0.5">
            <span>{topic.incorrect} mistakes / {topic.totalQuestions} questions</span>
            <span>Error rate: {Math.round(100 - accuracy)}%</span>
          </div>
        </div>

        {/* Recommendation Quote */}
        {topic.recommendation && (
          <div className="p-2.5 rounded-lg bg-subtle/50 border border-subtle text-[11px] text-secondary leading-relaxed italic">
            "{topic.recommendation}"
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between">
        <span className="text-[11px] text-muted">High-yield revision</span>

        {onPractice ? (
          <Button
            variant="outline"
            size="xs"
            icon={ArrowRight}
            onClick={() => onPractice(topic)}
          >
            Practice Topic
          </Button>
        ) : (
          <a
            href={`/quizzes?module=${topic.moduleId || ''}`}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
          >
            Practice Topic <ArrowRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </Card>
  );
}

export default WeakTopicCard;

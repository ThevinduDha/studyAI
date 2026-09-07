import { Link } from 'react-router-dom';
import {
  Award,
  Clock,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  History
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';

/**
 * Format relative or short date
 */
function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function RecentQuizzes({ recentAttempts = [] }) {
  const hasAttempts = Array.isArray(recentAttempts) && recentAttempts.length > 0;

  return (
    <Card className="p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-heading flex items-center gap-2">
            <History className="h-4 w-4 text-purple-500" />
            Recent Quiz Activity
          </h2>
          <p className="text-xs text-muted">Latest evaluated tests and scoring records</p>
        </div>

        {hasAttempts && (
          <Link
            to="/quiz-history"
            className="text-xs text-indigo-500 hover:opacity-80 font-medium inline-flex items-center gap-1 transition"
          >
            Full History <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* List */}
      {!hasAttempts ? (
        <div className="p-6 rounded-xl card-base border border-subtle text-center">
          <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-2">
            <Award className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-heading">No Recent Quizzes</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto leading-relaxed">
            Practice questions under timed conditions to benchmark your lecture retention.
          </p>
          <div className="mt-4">
            <Link to="/quizzes">
              <Button variant="primary" size="xs" icon={PlusCircle}>
                Take a Quiz
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recentAttempts.slice(0, 4).map((att) => {
            const isHighScore = att.percentage >= 70;
            const isPass = att.percentage >= 50;

            return (
              <Link
                key={att.attemptId || att._id}
                to={`/quiz-results/${att.attemptId || att._id}`}
                className="group block"
              >
                <div className="p-3.5 rounded-xl card-base border border-subtle hover:border-indigo-500/40 transition flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="indigo" size="xs">
                        {att.moduleCode || att.module?.moduleCode || 'Module'}
                      </Badge>
                      <span className="text-xs font-semibold text-heading truncate group-hover:text-indigo-500 transition">
                        {att.quizTitle || att.quiz?.title || 'Practice Quiz'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <span>{formatTimeAgo(att.submittedAt || att.startedAt)}</span>
                      <span>&bull;</span>
                      <span>
                        {att.score} / {att.totalQuestions} pts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-sm font-extrabold ${
                          isHighScore
                            ? 'text-emerald-500'
                            : isPass
                            ? 'text-indigo-500'
                            : 'text-rose-500'
                        }`}
                      >
                        {att.percentage}%
                      </span>
                      <span className="block text-[10px] text-muted">
                        {isHighScore ? 'Mastered' : isPass ? 'Passed' : 'Needs Review'}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg card-base text-muted group-hover:text-heading transition border border-subtle">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

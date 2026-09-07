import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  History,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  RotateCw,
  PlusCircle,
  FileText
} from 'lucide-react';
import { quizService } from '../services/quiz.service.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';

export default function QuizHistoryPage() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await quizService.getAttemptHistory();
        setAttempts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load quiz history:', err);
        setError(err.response?.data?.error?.message || err.message || 'Failed to load quiz history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatTimer = (secs) => {
    if (!secs && secs !== 0) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        badge="Progress Archive"
        badgeVariant="indigo"
        title="My Quiz History"
        icon={History}
        subtitle="Track your past attempts, evaluate accuracy progression, and review detailed answer breakdowns."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => navigate('/quizzes')}
          >
            Create New Quiz
          </Button>
        }
      />

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Empty State */}
      {!loading && attempts.length === 0 && (
        <EmptyState
          icon={Award}
          title="No Quiz Attempts Yet"
          description="Test your lecture knowledge, practice realistic exam scenarios, and see where you can improve."
          actionLabel="Take Your First Quiz"
          onAction={() => navigate('/quizzes')}
        />
      )}

      {/* Attempts List */}
      {!loading && attempts.length > 0 && (
        <div className="space-y-4">
          {attempts.map((att) => {
            const isCompleted = att.status === 'completed';
            const isAbandoned = att.status === 'abandoned';
            const isHighScore = att.percentage >= 70;
            const isPass = att.percentage >= 50;

            return (
              <Card
                key={att._id}
                hoverable={isCompleted}
                onClick={() => {
                  if (isCompleted) navigate(`/quiz-results/${att._id}`);
                }}
                className={`p-5 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm ${
                  isCompleted ? 'cursor-pointer hover:border-indigo-500/40' : ''
                }`}
              >
                {/* Left info */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="indigo" size="sm">
                      {att.module?.moduleCode || 'Module'}
                    </Badge>
                    <span className="text-xs text-muted font-medium">
                      {att.module?.moduleName}
                    </span>
                    {att.document?.originalName && (
                      <span className="text-xs text-muted flex items-center gap-1">
                        &bull; <FileText className="h-3 w-3" /> {att.document.originalName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-heading">
                    {att.quiz?.title || 'Practice Quiz'}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>{formatDate(att.submittedAt || att.startedAt)}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimer(att.timeSpentSeconds)}
                    </span>
                    <span>&bull;</span>
                    <span>{att.totalQuestions} questions</span>
                  </div>
                </div>

                {/* Right score / action */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-subtle">
                  {isCompleted ? (
                    <div className="text-right">
                      <div
                        className={`text-base font-bold ${
                          isHighScore
                            ? 'text-emerald-500'
                            : isPass
                            ? 'text-indigo-500'
                            : 'text-rose-500'
                        }`}
                      >
                        {att.score} / {att.totalQuestions} ({att.percentage}%)
                      </div>
                      <span className="text-xs text-muted">
                        {att.correctAnswers} correct, {att.incorrectAnswers} incorrect
                      </span>
                    </div>
                  ) : isAbandoned ? (
                    <Badge variant="default" size="sm">
                      Abandoned
                    </Badge>
                  ) : (
                    <Badge variant="amber" size="sm">
                      In Progress
                    </Badge>
                  )}

                  {isCompleted && (
                    <div className="p-2 rounded-xl card-base text-muted hover:text-heading transition border border-subtle">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

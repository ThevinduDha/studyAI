import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FileText,
  Filter,
  BarChart3,
  Calendar,
  BookOpen
} from 'lucide-react';
import { quizService } from '../services/quiz.service.js';
import { moduleService } from '../services/module.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import { QuizStatCard } from '../components/quiz/index.js';

export default function QuizHistoryPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [attempts, setAttempts] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterModule, setFilterModule] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [historyData, modulesData] = await Promise.all([
          quizService.getAttemptHistory(),
          isAdmin ? moduleService.getAllModules() : moduleService.getEnrolledModules()
        ]);
        setAttempts(Array.isArray(historyData) ? historyData : []);
        setModules(Array.isArray(modulesData) ? modulesData : []);
      } catch (err) {
        console.error('Failed to load quiz history:', err);
        setError(err.response?.data?.error?.message || err.message || 'Failed to load quiz history.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  // Compute real summary statistics from attempts
  const stats = useMemo(() => {
    const completedAttempts = attempts.filter((a) => a.status === 'completed');
    const totalCompleted = completedAttempts.length;

    if (totalCompleted === 0) {
      return {
        totalAttempts: attempts.length,
        completedCount: 0,
        averageScore: 0,
        bestScore: 0,
        totalQuestionsAnswered: 0
      };
    }

    let sumPercent = 0;
    let maxPercent = 0;
    let questionsAnswered = 0;

    completedAttempts.forEach((a) => {
      const p = a.percentage || 0;
      sumPercent += p;
      if (p > maxPercent) maxPercent = p;
      questionsAnswered += (a.answeredQuestions || a.totalQuestions || 0);
    });

    return {
      totalAttempts: attempts.length,
      completedCount: totalCompleted,
      averageScore: Math.round(sumPercent / totalCompleted),
      bestScore: Math.round(maxPercent),
      totalQuestionsAnswered: questionsAnswered
    };
  }, [attempts]);

  // Filtered attempts
  const filteredAttempts = useMemo(() => {
    return attempts.filter((att) => {
      if (filterStatus !== 'ALL' && att.status !== filterStatus) return false;
      if (filterModule !== 'ALL') {
        const modId = att.module?._id || att.module;
        if (modId !== filterModule) return false;
      }
      return true;
    });
  }, [attempts, filterStatus, filterModule]);

  const hasActiveFilters = filterModule !== 'ALL' || filterStatus !== 'ALL';

  const clearFilters = () => {
    setFilterModule('ALL');
    setFilterStatus('ALL');
  };

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <PageHeader
        badge="Progress Archive"
        badgeVariant="indigo"
        title="My Quiz History"
        icon={History}
        subtitle="Review your past test attempts, evaluate accuracy progression, and jump back into detailed question breakdowns."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => navigate('/quizzes')}
            >
              Start New Quiz
            </Button>
          </div>
        }
      />

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-rose-400 hover:text-rose-300 font-bold text-base cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Real Summary Metrics Cards */}
      {!loading && attempts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuizStatCard
            icon={Award}
            label="Quizzes Taken"
            value={stats.completedCount}
            subtext={`${stats.totalAttempts} total launched`}
            variant="indigo"
          />
          <QuizStatCard
            icon={CheckCircle2}
            label="Average Score"
            value={`${stats.averageScore}%`}
            variant={stats.averageScore >= 70 ? 'emerald' : stats.averageScore >= 50 ? 'indigo' : 'rose'}
          />
          <QuizStatCard
            icon={Award}
            label="Best Score"
            value={`${stats.bestScore}%`}
            variant="emerald"
          />
          <QuizStatCard
            icon={BarChart3}
            label="Questions Solved"
            value={stats.totalQuestionsAnswered}
            variant="default"
          />
        </div>
      )}

      {/* Filter Toolbar */}
      {!loading && attempts.length > 0 && (
        <Card className="p-3.5 shadow-xs border border-subtle">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Filter className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Filter History:</span>
            </div>

            {/* Module Filter */}
            {modules.length > 0 && (
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="input-base text-xs rounded-lg px-2.5 py-1.5 max-w-[200px] truncate"
                aria-label="Filter by module"
              >
                <option value="ALL">All Modules ({modules.length})</option>
                {modules.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.moduleCode || m.code} — {m.moduleName || m.name}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-base text-xs rounded-lg px-2.5 py-1.5"
              aria-label="Filter by attempt status"
            >
              <option value="ALL">All Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="in_progress">In Progress</option>
              <option value="abandoned">Abandoned</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer ml-auto"
              >
                Clear Filters
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <SkeletonCard className="h-28" />
          <SkeletonCard className="h-28" />
          <SkeletonCard className="h-28" />
        </div>
      )}

      {/* Empty State: 0 attempts total */}
      {!loading && attempts.length === 0 && (
        <EmptyState
          icon={Award}
          title="No Quiz Attempts Yet"
          description="Test your lecture comprehension, practice realistic exam-style questions, and track your progress over time."
          actionLabel="Take Your First Practice Quiz"
          onAction={() => navigate('/quizzes')}
        />
      )}

      {/* Empty State: Filter yielded 0 attempts */}
      {!loading && attempts.length > 0 && filteredAttempts.length === 0 && (
        <EmptyState
          icon={Filter}
          title="No Attempts Match Current Filter"
          description="Try selecting a different module or status filter to view your attempts."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      )}

      {/* Attempts List */}
      {!loading && filteredAttempts.length > 0 && (
        <div className="space-y-3.5">
          {filteredAttempts.map((att) => {
            const isCompleted = att.status === 'completed';
            const isAbandoned = att.status === 'abandoned';
            const percent = Math.round(att.percentage || 0);
            const isHighScore = percent >= 70;
            const isPass = percent >= 50;

            return (
              <Card
                key={att._id}
                hoverable={isCompleted}
                onClick={() => {
                  if (isCompleted) navigate(`/quiz-results/${att._id}`);
                }}
                className={`p-5 transition-all duration-150 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs border border-subtle ${
                  isCompleted ? 'cursor-pointer hover:border-indigo-500/40 hover:-translate-y-0.5' : ''
                }`}
              >
                {/* Left metadata info */}
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="indigo" size="xs">
                      {att.module?.moduleCode || 'Module'}
                    </Badge>
                    <span className="text-xs text-muted font-medium truncate max-w-[200px]">
                      {att.module?.moduleName}
                    </span>
                    {att.document?.originalName && (
                      <span className="text-xs text-muted flex items-center gap-1 truncate max-w-[180px]">
                        • <FileText className="h-3 w-3 text-indigo-400 shrink-0" /> {att.document.originalName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-heading">
                    {att.quiz?.title || 'Practice Test'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(att.submittedAt || att.startedAt)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      {formatTimer(att.timeSpentSeconds)}
                    </span>
                    <span>•</span>
                    <span>{att.totalQuestions} questions</span>
                  </div>
                </div>

                {/* Right score / status indicator */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-subtle shrink-0">
                  {isCompleted ? (
                    <div className="text-right">
                      <div
                        className={`text-base sm:text-lg font-extrabold ${
                          isHighScore
                            ? 'text-emerald-500'
                            : isPass
                            ? 'text-indigo-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {att.score} / {att.totalQuestions} ({percent}%)
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
                    <div className="p-2 rounded-xl card-base text-muted hover:text-heading transition border border-subtle shrink-0">
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

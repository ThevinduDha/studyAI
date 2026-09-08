import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BarChart2,
  Target,
  Award,
  CheckCircle2,
  TrendingUp,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  Calendar,
  Sparkles
} from 'lucide-react';
import { analyticsService } from '../services/analytics.service.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Skeleton, SkeletonGrid, SkeletonCard } from '../components/ui/Skeleton.jsx';
import {
  PerformanceTrendChart,
  DifficultyBreakdown
} from '../components/analytics/index.js';

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await analyticsService.getOverview();
      if (res && res.success) {
        setAnalytics(res.data);
      } else {
        setError(res?.error?.message || 'Unable to load performance analytics.');
      }
    } catch (err) {
      console.error('Analytics load error:', err);
      setError(err.message || 'Failed to connect to analytics service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <Skeleton height="h-28" className="w-full rounded-2xl" />
        <SkeletonGrid count={4} />
        <SkeletonCard className="h-64" />
        <SkeletonGrid count={2} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center animate-fade-in">
        <Card className="p-8 space-y-4 border border-rose-500/30">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-heading">Analytics couldn't be loaded</h2>
          <p className="text-xs text-muted leading-relaxed">{error}</p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchAnalytics(false)}
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const {
    hasData = false,
    overview = {},
    trend = {},
    recentPerformance = [],
    weakTopics = [],
    difficultyPerformance = []
  } = analytics || {};

  const totalQuizzes = overview.totalQuizzesCompleted || 0;

  // PART 9 — Clean Empty State if student has no quiz attempts
  if (!hasData || totalQuizzes === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
        <PageHeader
          badge="Learning Progress"
          badgeVariant="indigo"
          title="Your Performance"
          icon={BarChart2}
          subtitle="Track your exam readiness, accuracy trends, and areas for improvement."
        />

        <div className="py-12">
          <EmptyState
            icon={BarChart2}
            title="Your analytics will appear here after you complete your first quiz."
            description="Take your first practice quiz to track your accuracy, view performance trends, and identify topics to improve."
            actionLabel="Take a Quiz"
            onAction={() => navigate('/quizzes')}
          />
        </div>
      </div>
    );
  }

  const overallAccuracy = Math.round(overview.overallAccuracy || 0);
  const questionsAnswered = overview.totalQuestionsAnswered || 0;
  // Calculate average score if not directly in overview
  const averageScore = overview.averageScore !== undefined
    ? Math.round(overview.averageScore)
    : overallAccuracy;

  // 3 to 5 highest priority weak topics
  const prioritizedWeakTopics = weakTopics.slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <PageHeader
        badge="Learning Progress"
        badgeVariant="indigo"
        title="Your Performance"
        icon={BarChart2}
        subtitle="Actionable insights into your exam preparation, accuracy trends, and topics to improve."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchAnalytics(true)}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Award}
              onClick={() => navigate('/quizzes')}
            >
              Practice Quiz
            </Button>
          </div>
        }
      />

      {/* 1. YOUR PERFORMANCE (4 Simple Cards) */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Your Performance
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Overall Accuracy */}
          <Card className="p-5 border border-subtle">
            <div className="flex items-center justify-between text-muted text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Overall Accuracy</span>
              <Target className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-heading">
                {overallAccuracy}%
              </span>
              <Badge
                variant={
                  overallAccuracy >= 75
                    ? 'emerald'
                    : overallAccuracy >= 60
                    ? 'amber'
                    : 'rose'
                }
                size="xs"
              >
                {overallAccuracy >= 75 ? 'Strong' : overallAccuracy >= 60 ? 'Passing' : 'Needs Work'}
              </Badge>
            </div>
          </Card>

          {/* Quizzes Completed */}
          <Card className="p-5 border border-subtle">
            <div className="flex items-center justify-between text-muted text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Quizzes Completed</span>
              <Award className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-heading">
                {totalQuizzes}
              </span>
            </div>
          </Card>

          {/* Questions Answered */}
          <Card className="p-5 border border-subtle">
            <div className="flex items-center justify-between text-muted text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Questions Answered</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-heading">
                {questionsAnswered}
              </span>
            </div>
          </Card>

          {/* Average Score */}
          <Card className="p-5 border border-subtle">
            <div className="flex items-center justify-between text-muted text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Average Score</span>
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-heading">
                {averageScore}%
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* 2. PERFORMANCE TREND */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Performance Trend
        </h2>
        <PerformanceTrendChart
          recentPerformance={recentPerformance}
          trend={trend}
        />
      </div>

      {/* 3. TOPICS TO IMPROVE (3-5 highest priority weak topics) */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Topics to Improve
        </h2>

        {prioritizedWeakTopics.length === 0 ? (
          <Card className="p-5 border border-subtle text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-heading">No Weak Topics Identified</p>
            <p className="text-xs text-muted mt-1">
              You are performing solidly across all tested topics!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prioritizedWeakTopics.map((topic, idx) => {
              const accuracy = Math.round(topic.accuracy || 0);

              return (
                <Card
                  key={topic.topic || idx}
                  className="p-4 sm:p-5 border border-subtle hover:border-indigo-500/30 transition flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="rose" size="xs">
                        Needs Focus
                      </Badge>
                      <span className="text-xs font-bold text-rose-400">
                        Accuracy: {accuracy}%
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-heading line-clamp-2">
                      {topic.topic}
                    </h4>

                    <p className="text-xs text-muted">
                      {topic.incorrectCount !== undefined
                        ? `${topic.incorrectCount} missed questions`
                        : `${topic.totalQuestions || 0} questions evaluated`}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-subtle">
                    <Button
                      variant="outline"
                      size="xs"
                      icon={HelpCircle}
                      onClick={() => navigate(`/questions?topic=${encodeURIComponent(topic.topic)}`)}
                      className="w-full justify-center text-indigo-400 hover:text-indigo-300"
                    >
                      Practice
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. QUESTION PERFORMANCE (Easy, Medium, Hard) */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Question Performance
        </h2>
        <DifficultyBreakdown difficultyPerformance={difficultyPerformance} />
      </div>

      {/* 5. RECENT QUIZZES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Recent Quizzes
          </h2>
          <Link
            to="/quiz-history"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
          >
            <span>View Full History</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentPerformance.length === 0 ? (
          <Card className="p-5 text-center border border-subtle">
            <p className="text-xs text-muted">No recent quiz history available.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden border border-subtle">
            <div className="divide-y divide-subtle">
              {recentPerformance.slice(0, 5).map((attempt, idx) => {
                const pct = Math.round(attempt.percentage || attempt.accuracy || 0);

                return (
                  <div
                    key={attempt.attemptId || attempt._id || idx}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-subtle/30 transition"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {attempt.moduleCode && (
                          <Badge variant="indigo" size="xs">
                            {attempt.moduleCode}
                          </Badge>
                        )}
                        <h4 className="text-xs sm:text-sm font-bold text-heading truncate">
                          {attempt.quizTitle || attempt.title || 'Practice Quiz'}
                        </h4>
                      </div>
                      <p className="text-[11px] text-muted flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {attempt.date
                            ? new Date(attempt.date).toLocaleDateString()
                            : 'Completed'}
                        </span>
                        {attempt.totalQuestions && (
                          <span>&bull; {attempt.totalQuestions} questions</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-bold text-heading">
                          {pct}%
                        </span>
                        <p className="text-[10px] text-muted">
                          {attempt.score !== undefined ? `${attempt.score} pts` : 'Score'}
                        </p>
                      </div>

                      {attempt.attemptId && (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => navigate(`/quiz-results/${attempt.attemptId}`)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Award,
  BookOpen,
  Layers,
  ArrowRight,
  RefreshCw,
  Target,
  Brain,
  Lightbulb,
  HelpCircle,
  Zap,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { analyticsService } from '../services/analytics.service.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Skeleton, SkeletonGrid, SkeletonCard } from '../components/ui/Skeleton.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { GroundedBadge } from '../components/ai/index.js';
import {
  AnalyticsHero,
  PerformanceTrendChart,
  WeakTopicCard,
  DifficultyBreakdown,
  QuestionTypeBreakdown,
  AIStudyAdvisorCard
} from '../components/analytics/index.js';

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await analyticsService.getOverview();
      if (res.success) {
        setAnalytics(res.data);
      } else {
        setError(res.error?.message || 'Failed to load analytics.');
      }
    } catch (err) {
      console.error('Analytics load error:', err);
      setError(err.response?.data?.error?.message || 'Failed to connect to analytics service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleGetAiAdvice = async () => {
    if (!analytics || loadingAi) return;
    try {
      setLoadingAi(true);
      const res = await analyticsService.getAIInsight(analytics);
      if (res.success) {
        setAiAdvice(res.data);
      }
    } catch (err) {
      console.warn('AI insight fetch error:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const formatSeconds = (secs) => {
    if (!secs || secs <= 0) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${remM}m`;
  };

  // Loading Skeleton Experience
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
        <div className="p-8 rounded-2xl card-base border border-subtle space-y-4">
          <Skeleton height="h-7" className="w-64" />
          <Skeleton height="h-4" className="w-96" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <SkeletonCard className="h-28" />
          <SkeletonCard className="h-28" />
          <SkeletonCard className="h-28" />
          <SkeletonCard className="h-28" />
          <SkeletonCard className="h-28" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard className="lg:col-span-2 h-72" />
          <SkeletonCard className="h-72" />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
        <Card className="p-8 space-y-4 border border-rose-500/30">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-heading">Unable to Load Analytics</h2>
          <p className="text-muted text-xs leading-relaxed max-w-sm mx-auto">{error}</p>
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
    hasData,
    overview = {},
    trend = {},
    recentPerformance = [],
    modulePerformance = [],
    topicPerformance = [],
    difficultyPerformance = [],
    questionTypePerformance = [],
    weakestQuestionType,
    weakTopics = [],
    frequentlyMissedQuestions = [],
    recommendations = []
  } = analytics || {};

  // Empty State: No completed quizzes
  if (!hasData || overview.totalQuizzesCompleted === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8 animate-fade-in">
        <EmptyState
          icon={BarChart2}
          title="Your Learning Intelligence Is Waiting For Data"
          description="Complete your first practice test to unlock comprehensive accuracy trajectories, weak-topic intelligence, difficulty mastery, and personalized AI study advice."
          actionLabel="Take Your First Practice Quiz"
          onAction={() => navigate('/quizzes')}
        />
      </div>
    );
  }

  const overallAccuracy = Math.round(overview.overallAccuracy || 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* 1. Analytics Hero */}
      <AnalyticsHero
        overallAccuracy={overallAccuracy}
        trend={trend}
        onRefresh={() => fetchAnalytics(true)}
        refreshing={refreshing}
        onStartQuiz={() => navigate('/quizzes')}
      />

      {/* 2. Overview Statistics Grid (5 Responsive Metric Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Overall Accuracy */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between shadow-xs border border-subtle hover:border-indigo-500/30 transition">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Overall Accuracy</span>
            <Target className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-heading">
                {overallAccuracy}%
              </span>
              <Badge
                variant={
                  overallAccuracy >= 80
                    ? 'emerald'
                    : overallAccuracy >= 60
                    ? 'amber'
                    : 'rose'
                }
                size="xs"
              >
                {overallAccuracy >= 80 ? 'Strong' : overallAccuracy >= 60 ? 'Average' : 'Needs Focus'}
              </Badge>
            </div>
            <div className="w-full bg-subtle rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallAccuracy >= 80 ? 'bg-emerald-500' : overallAccuracy >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${overallAccuracy}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Quizzes Completed */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between shadow-xs border border-subtle hover:border-indigo-500/30 transition">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Quizzes Done</span>
            <Award className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-heading">
              {overview.totalQuizzesCompleted}
            </span>
            <p className="text-muted text-[11px] mt-1 truncate">
              Mean score: <strong className="text-heading font-semibold">{overview.averageQuizScore} pts</strong>
            </p>
          </div>
        </Card>

        {/* Questions Solved */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between shadow-xs border border-subtle hover:border-indigo-500/30 transition">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Questions Solved</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-heading">
              {overview.totalQuestionsAttempted}
            </span>
            <p className="text-muted text-[11px] mt-1 truncate">
              <span className="text-emerald-400 font-semibold">{overview.totalCorrect} correct</span> · <span className="text-rose-400 font-semibold">{overview.totalIncorrect} missed</span>
            </p>
          </div>
        </Card>

        {/* Best / Worst Percentage */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between shadow-xs border border-subtle hover:border-indigo-500/30 transition">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Best / Worst</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-extrabold text-heading">
              <span className="text-emerald-400">{overview.bestQuizPercentage}%</span>
              <span className="text-xs text-muted font-normal">/ {overview.worstQuizPercentage}%</span>
            </div>
            <p className="text-muted text-[11px] mt-1 truncate">
              Mean accuracy: <strong className="text-heading font-semibold">{overview.averageQuizPercentage}%</strong>
            </p>
          </div>
        </Card>

        {/* Total Time Spent & Pacing */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between col-span-2 sm:col-span-1 shadow-xs border border-subtle hover:border-indigo-500/30 transition">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Study Time</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-heading font-mono">
              {formatSeconds(overview.totalTimeSpent)}
            </span>
            <p className="text-muted text-[11px] mt-1 truncate">
              Pacing: <strong className="text-heading font-semibold font-mono">~{overview.averageTimePerQuestion}s / Q</strong>
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Performance Trend & AI Study Advisor Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Polyline Chart (2 Columns on Desktop) */}
        <PerformanceTrendChart
          recentPerformance={recentPerformance}
          trend={trend}
          className="lg:col-span-2"
        />

        {/* AI Study Advisor & Strategic Plan (1 Column on Desktop) */}
        <AIStudyAdvisorCard
          recommendations={recommendations}
          aiAdvice={aiAdvice}
          loadingAi={loadingAi}
          onGetAiAdvice={handleGetAiAdvice}
        />
      </div>

      {/* 4. Deep-Dive Section Tabs */}
      <div className="space-y-6">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Weak Topics & Breakdowns' },
            { id: 'modules', label: `Module Performance (${modulePerformance.length})` },
            { id: 'topics', label: `All Topics (${topicPerformance.length})` },
            { id: 'missed', label: `Frequently Missed (${frequentlyMissedQuestions.length})` },
            { id: 'recent', label: `Recent Activity (${recentPerformance.length})` }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* TAB 1: Weak Topics & Diagnostic Breakdowns */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-slide-up">
            {/* Weak Topics Intelligence Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-subtle pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-heading flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    Weak-Topic Intelligence (Priority Ranked)
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Formulated from error rates (50%), mistake volume (30%), and difficulty weights (20%)
                  </p>
                </div>
                <Badge variant="rose" size="xs">
                  {weakTopics.length} Focus {weakTopics.length === 1 ? 'Area' : 'Areas'}
                </Badge>
              </div>

              {weakTopics.length === 0 ? (
                <Card className="p-8 text-center text-muted text-sm shadow-xs border border-subtle">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-heading">No Critical Weak Topics Identified 🎉</h3>
                  <p className="text-xs text-muted max-w-md mx-auto mt-1 leading-relaxed">
                    You are currently maintaining solid accuracy (≥60%) across all tested concepts. Keep taking practice tests to maintain retention!
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weakTopics.map((wt, idx) => (
                    <WeakTopicCard
                      key={idx}
                      topic={wt}
                      onPractice={() => navigate(`/quizzes?module=${wt.moduleId || ''}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Dual Diagnostic Breakdowns: Difficulty & Question Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <DifficultyBreakdown difficultyPerformance={difficultyPerformance} />
              <QuestionTypeBreakdown
                questionTypePerformance={questionTypePerformance}
                weakestQuestionType={weakestQuestionType}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Module Performance */}
        {activeTab === 'modules' && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-heading flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  Course Module Performance
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Accuracy and time spent aggregated across enrolled course modules
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modulePerformance.map((mod) => {
                const accuracy = Math.round(mod.accuracy || 0);

                return (
                  <Card
                    key={mod.moduleId}
                    className="p-5 flex flex-col justify-between shadow-xs border border-subtle hover:border-indigo-500/40 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="indigo" size="xs">
                          {mod.moduleCode}
                        </Badge>
                        <Badge
                          variant={
                            mod.status === 'strong'
                              ? 'emerald'
                              : mod.status === 'average'
                              ? 'amber'
                              : 'rose'
                          }
                          size="xs"
                          className="capitalize"
                        >
                          {mod.status}
                        </Badge>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-heading line-clamp-2">
                        {mod.moduleName}
                      </h3>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-muted">
                          <span>Module Accuracy</span>
                          <span className="font-bold text-heading text-sm">{accuracy}%</span>
                        </div>
                        <div className="w-full bg-subtle rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              accuracy >= 80 ? 'bg-emerald-500' : accuracy >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                            }`}
                            style={{ width: `${accuracy}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-subtle text-[11px]">
                        <div>
                          <span className="text-muted block">Quizzes Completed</span>
                          <span className="font-semibold text-heading">{mod.quizzesCompleted}</span>
                        </div>
                        <div>
                          <span className="text-muted block">Questions Solved</span>
                          <span className="font-semibold text-heading">{mod.questionsAttempted}</span>
                        </div>
                        <div>
                          <span className="text-muted block">Study Time</span>
                          <span className="font-semibold text-heading font-mono">{formatSeconds(mod.totalTimeSpent)}</span>
                        </div>
                        <div>
                          <span className="text-muted block">Mean Score</span>
                          <span className="font-semibold text-heading">{mod.averageScore} pts</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-subtle">
                      <Button
                        variant="outline"
                        size="xs"
                        className="w-full justify-center"
                        onClick={() => navigate(`/quizzes?module=${mod.moduleId}`)}
                      >
                        Practice {mod.moduleCode} Quizzes <ArrowRight className="h-3 w-3 ml-1 inline" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: All Tested Topics */}
        {activeTab === 'topics' && (
          <Card className="overflow-hidden shadow-xs border border-subtle animate-slide-up">
            <div className="p-4 border-b border-subtle flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-heading">
                  All Tested Topics ({topicPerformance.length})
                </h3>
                <p className="text-xs text-muted">
                  Comprehensive topic taxonomy evaluated from Question Bank records
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-body">
                <thead className="bg-subtle/50 text-muted uppercase text-[10px] tracking-wider border-b border-subtle">
                  <tr>
                    <th className="py-3 px-4">Topic</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Solved / Total</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {topicPerformance.map((top, idx) => {
                    const accuracy = Math.round(top.accuracy || 0);

                    return (
                      <tr key={idx} className="hover:bg-subtle/30 transition">
                        <td className="py-3.5 px-4 font-semibold text-heading">
                          {top.topic}
                        </td>
                        <td className="py-3.5 px-4 text-muted">
                          <Badge variant="indigo" size="xs">
                            {top.moduleCode}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-muted font-mono">
                          Level {Math.round(top.averageDifficulty || 3)}
                        </td>
                        <td className="py-3.5 px-4">
                          {top.correct} / {top.totalQuestions}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-heading w-8 font-mono">{accuracy}%</span>
                            <div className="w-20 bg-subtle rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  accuracy >= 80 ? 'bg-emerald-500' : accuracy >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                                }`}
                                style={{ width: `${accuracy}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              top.status === 'STRONG'
                                ? 'emerald'
                                : top.status === 'AVERAGE'
                                ? 'amber'
                                : top.status === 'WEAK'
                                ? 'rose'
                                : 'default'
                            }
                            size="xs"
                          >
                            {top.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 4: Frequently Missed Questions */}
        {activeTab === 'missed' && (
          <div className="space-y-3 animate-slide-up">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-heading flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  Frequently Missed Questions
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Items with highest error frequencies across your test history (correct answers safely masked)
                </p>
              </div>
            </div>

            {frequentlyMissedQuestions.length === 0 ? (
              <Card className="p-8 text-center text-muted text-sm shadow-xs border border-subtle">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <span className="font-bold text-heading text-base block">Zero Recurring Error Questions</span>
                <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                  You currently have no questions with repeated mistake patterns. Outstanding work!
                </p>
              </Card>
            ) : (
              frequentlyMissedQuestions.map((q) => (
                <Card
                  key={q.questionId}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs border border-subtle hover:border-indigo-500/30 transition"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="indigo" size="xs">
                        {q.moduleCode}
                      </Badge>
                      <Badge variant="purple" size="xs">
                        {q.topic}
                      </Badge>
                      <Badge variant="default" size="xs">
                        Level {q.difficulty}
                      </Badge>
                      <Badge variant="cyan" size="xs">
                        {q.questionType}
                      </Badge>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-heading line-clamp-2 leading-relaxed">
                      {q.questionText}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-subtle">
                    <div className="text-right">
                      <div className="font-bold text-rose-400 text-sm">
                        {q.timesIncorrect} Misses
                      </div>
                      <div className="text-[11px] text-muted">
                        {q.timesAttempted} attempts ({q.accuracy}% accuracy)
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="xs"
                      icon={ArrowRight}
                      onClick={() => navigate('/quizzes')}
                      title="Practice this concept in a quiz"
                    >
                      Practice
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* TAB 5: Recent Quiz Activity */}
        {activeTab === 'recent' && (
          <div className="space-y-3 animate-slide-up">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-heading flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  Recent Quiz Attempts
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Chronological test attempts used to compute your current performance trend
                </p>
              </div>
            </div>

            {recentPerformance.map((q, idx) => (
              <Card
                key={q.attemptId || idx}
                hoverable={true}
                onClick={() => q.attemptId && navigate(`/quiz-results/${q.attemptId}`)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs border border-subtle hover:border-indigo-500/40 cursor-pointer transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo" size="xs">
                      {q.moduleCode}
                    </Badge>
                    <span className="text-xs text-muted">
                      {new Date(q.submittedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-heading">
                    {q.quizTitle || 'Practice Quiz'}
                  </h4>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-base font-extrabold ${
                        q.percentage >= 70
                          ? 'text-emerald-500'
                          : q.percentage >= 50
                          ? 'text-indigo-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {q.percentage}%
                    </span>
                    <span className="text-[11px] text-muted block">
                      {q.score}/{q.totalQuestions} points
                    </span>
                  </div>

                  <div className="p-1.5 rounded-lg card-base border border-subtle text-muted hover:text-heading">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

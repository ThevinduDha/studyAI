import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Zap
} from 'lucide-react';
import { analyticsService } from '../services/analytics.service.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Skeleton, SkeletonGrid, SkeletonCard } from '../components/ui/Skeleton.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getOverview();
      if (res.success) {
        setAnalytics(res.data);
      } else {
        setError(res.error?.message || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Analytics load error:', err);
      setError(err.response?.data?.error?.message || 'Failed to connect to analytics service');
    } finally {
      setLoading(false);
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

  // Render Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton height="h-8" className="w-64 mb-2" />
            <Skeleton height="h-4" className="w-96" />
          </div>
        </div>
        <SkeletonGrid count={5} />
        <SkeletonCard />
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <Card className="p-8 space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-heading">Unable to Load Analytics</h2>
          <p className="text-muted text-sm max-w-md mx-auto">{error}</p>
          <Button
            variant="primary"
            size="md"
            icon={RefreshCw}
            onClick={fetchAnalytics}
          >
            Retry
          </Button>
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

  // Render Empty State
  if (!hasData || overview.totalQuizzesCompleted === 0) {
    return (
      <EmptyState
        icon={BarChart2}
        title="No Quiz History Yet"
        description="Complete your first practice quiz to unlock comprehensive performance metrics, weak-topic diagnosis, and personalized revision intelligence."
        actionLabel="Take a Practice Quiz"
        onAction={() => window.location.assign('/quizzes')}
      />
    );
  }

  // SVG Trend Chart Helpers
  const chartWidth = 700;
  const chartHeight = 180;
  const padding = 25;
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;

  const points = recentPerformance.map((q, idx) => {
    const x = recentPerformance.length > 1
      ? padding + (idx / (recentPerformance.length - 1)) * plotWidth
      : chartWidth / 2;
    const y = chartHeight - padding - ((q.percentage || 0) / 100) * plotHeight;
    return { x, y, data: q };
  });

  const pathD = points.length > 1
    ? points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
    : '';

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        badge="Phase 11 Intelligence"
        badgeVariant="indigo"
        title="Performance Analytics"
        icon={BarChart2}
        subtitle="Grounded learning analytics derived from your validated Quiz records."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchAnalytics}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Award}
              onClick={() => window.location.assign('/quizzes')}
            >
              Start Quiz
            </Button>
          </div>
        }
      />

      {/* 1. Overview Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Overall Accuracy */}
        <Card className="p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Overall Accuracy</span>
            <Target className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-heading">
                {overview.overallAccuracy}%
              </span>
              <Badge
                variant={
                  overview.overallAccuracy >= 80
                    ? 'emerald'
                    : overview.overallAccuracy >= 60
                    ? 'amber'
                    : 'rose'
                }
                size="xs"
              >
                {overview.overallAccuracy >= 80 ? 'Strong' : overview.overallAccuracy >= 60 ? 'Average' : 'Needs Focus'}
              </Badge>
            </div>
            <div className="w-full bg-subtle rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overview.overallAccuracy >= 80 ? 'bg-emerald-500' : overview.overallAccuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${overview.overallAccuracy}%` }}
              ></div>
            </div>
          </div>
        </Card>

        {/* Quizzes Completed */}
        <Card className="p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Quizzes Done</span>
            <Award className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-heading">
              {overview.totalQuizzesCompleted}
            </span>
            <p className="text-muted text-[11px] mt-1">
              Avg score: <span className="text-heading font-medium">{overview.averageQuizScore} pts</span>
            </p>
          </div>
        </Card>

        {/* Questions Attempted */}
        <Card className="p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Questions Solved</span>
            <Layers className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-heading">
              {overview.totalQuestionsAttempted}
            </span>
            <p className="text-muted text-[11px] mt-1">
              <span className="text-emerald-500 font-medium">{overview.totalCorrect} correct</span> · <span className="text-rose-500 font-medium">{overview.totalIncorrect} missed</span>
            </p>
          </div>
        </Card>

        {/* Average Score */}
        <Card className="p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Best / Worst</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-extrabold text-heading">
              <span>{overview.bestQuizPercentage}%</span>
              <span className="text-xs text-muted font-normal">/ {overview.worstQuizPercentage}%</span>
            </div>
            <p className="text-muted text-[11px] mt-1">
              Mean: <span className="text-heading font-medium">{overview.averageQuizPercentage}%</span>
            </p>
          </div>
        </Card>

        {/* Total Time Spent */}
        <Card className="p-4 flex flex-col justify-between col-span-2 sm:col-span-1 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Total Study Time</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-heading">
              {formatSeconds(overview.totalTimeSpent)}
            </span>
            <p className="text-muted text-[11px] mt-1">
              Pacing: <span className="text-heading font-medium">~{overview.averageTimePerQuestion}s / question</span>
            </p>
          </div>
        </Card>
      </div>

      {/* 2. Performance Trend & AI Advisor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart (2 Columns) */}
        <Card className="lg:col-span-2 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-heading flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" />
                Performance Trend (Recent Quizzes)
              </h2>
              <p className="text-xs text-muted">
                Tracking accuracy progression across sequential attempts
              </p>
            </div>

            {/* Trend Indicator Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  trend.trend === 'improving'
                    ? 'emerald'
                    : trend.trend === 'declining'
                    ? 'rose'
                    : trend.trend === 'stable'
                    ? 'cyan'
                    : 'amber'
                }
                size="sm"
              >
                {trend.trend === 'improving' && <TrendingUp className="h-3.5 w-3.5 mr-1 inline" />}
                {trend.trend === 'declining' && <TrendingDown className="h-3.5 w-3.5 mr-1 inline" />}
                {trend.trend === 'stable' && <Activity className="h-3.5 w-3.5 mr-1 inline" />}
                {trend.trend === 'insufficient_data' && <HelpCircle className="h-3.5 w-3.5 mr-1 inline" />}
                {trend.trend.replace('_', ' ')}
                {trend.delta !== 0 && ` (${trend.delta > 0 ? '+' : ''}${trend.delta}%)`}
              </Badge>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full relative mt-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((val) => {
                const y = chartHeight - padding - (val / 100) * plotHeight;
                return (
                  <g key={val}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      stroke="var(--color-border)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding - 6}
                      y={y + 3}
                      fill="var(--color-text-muted)"
                      fontSize="9"
                      textAnchor="end"
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {areaD && <path d={areaD} fill="url(#trendGradient)" />}

              {/* Trend Polyline */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points */}
              {points.map((pt, idx) => (
                <g key={idx} className="cursor-pointer">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint === idx ? 6 : 4}
                    fill="var(--color-bg-card)"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <text
                    x={pt.x}
                    y={chartHeight - 8}
                    fill="var(--color-text-muted)"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    #{idx + 1}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint !== null && points[hoveredPoint] && (
              <div
                className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full card-base border border-indigo-500/40 px-3 py-2 rounded-xl shadow-xl text-xs"
                style={{
                  left: `${(points[hoveredPoint].x / chartWidth) * 100}%`,
                  top: `${(points[hoveredPoint].y / chartHeight) * 100 - 8}%`
                }}
              >
                <div className="font-semibold text-heading">
                  {points[hoveredPoint].data.quizTitle}
                </div>
                <div className="text-indigo-500 text-[11px] font-medium mt-0.5">
                  {points[hoveredPoint].data.percentage}% ({points[hoveredPoint].data.score}/{points[hoveredPoint].data.totalQuestions} pts)
                </div>
                <div className="text-muted text-[10px] mt-0.5">
                  Module: {points[hoveredPoint].data.moduleCode} · {new Date(points[hoveredPoint].data.submittedAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          <p className="text-muted text-[11px] mt-4">
            {trend.reason}
          </p>
        </Card>

        {/* AI Study Advice / Strategy Panel (1 Column) */}
        <Card className="p-5 flex flex-col justify-between shadow-sm border-indigo-500/20">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                Study Recommendations
              </span>
              <Button
                variant="outline"
                size="xs"
                icon={loadingAi ? RefreshCw : Brain}
                onClick={handleGetAiAdvice}
                loading={loadingAi}
              >
                {loadingAi ? 'Analyzing...' : 'AI Insights'}
              </Button>
            </div>

            <h3 className="text-base font-bold text-heading mb-2">
              Actionable Study Plan
            </h3>

            {/* Recommendations List */}
            <div className="space-y-2.5 mt-3">
              {(aiAdvice?.advice || recommendations).slice(0, 3).map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl card-base border border-subtle text-xs text-body shadow-sm"
                >
                  <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Quiz CTA */}
          <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between text-xs">
            <span className="text-muted text-[11px]">Ready to improve?</span>
            <Link
              to="/quizzes"
              className="text-indigo-500 hover:opacity-80 font-medium inline-flex items-center gap-1"
            >
              Take practice quiz <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* 3. Navigation Tabs for In-Depth Analytics */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Weak Topics & Breakdowns' },
          { id: 'modules', label: `Module Performance (${modulePerformance.length})` },
          { id: 'topics', label: `All Topics (${topicPerformance.length})` },
          { id: 'missed', label: `Frequently Missed (${frequentlyMissedQuestions.length})` }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB CONTENT 1: Overview, Weak Topics & Breakdowns */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Weak Topics Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  Weak Topic Intelligence
                </h2>
                <p className="text-xs text-muted">
                  Topics prioritized by error rates, mistake volume, and difficulty weights
                </p>
              </div>
            </div>

            {weakTopics.length === 0 ? (
              <Card className="p-6 text-center text-muted text-sm">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <span className="font-semibold text-heading">No Critical Weak Areas Detected</span>
                <p className="text-xs text-muted mt-1">
                  You are maintaining solid accuracy (≥60%) across all tested concepts.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weakTopics.map((wt, idx) => (
                  <Card
                    key={idx}
                    className="p-4 flex flex-col justify-between transition hover:border-indigo-500/40 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-muted">
                          {wt.moduleCode}
                        </span>
                        <Badge
                          variant={wt.priority === 'HIGH' ? 'rose' : 'amber'}
                          size="xs"
                        >
                          {wt.priority} Priority
                        </Badge>
                      </div>

                      <h3 className="text-sm font-bold text-heading mb-2 line-clamp-1">
                        {wt.topic}
                      </h3>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-muted">
                          <span>Accuracy</span>
                          <span className="font-semibold text-rose-500">{wt.accuracy}%</span>
                        </div>
                        <div className="w-full bg-subtle rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full"
                            style={{ width: `${wt.accuracy}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                          <span>{wt.incorrect} mistakes / {wt.totalQuestions} questions</span>
                          <span>Level {Math.round(wt.averageDifficulty)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-subtle">
                      <p className="text-[11px] text-muted italic">
                        "{wt.recommendation}"
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty & Question Type Dual Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Difficulty Breakdown */}
            <Card className="p-5 shadow-sm">
              <h3 className="text-sm font-bold text-heading mb-1 flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-500" />
                Performance by Difficulty Level
              </h3>
              <p className="text-xs text-muted mb-4">
                Identifies whether conceptual challenges concentrate on advanced material
              </p>

              <div className="space-y-3">
                {difficultyPerformance.map((diff) => (
                  <div key={diff.difficulty} className="p-3 rounded-xl card-base border border-subtle shadow-sm">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-heading">{diff.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-heading">{diff.accuracy}%</span>
                        <Badge
                          variant={
                            diff.status === 'strong'
                              ? 'emerald'
                              : diff.status === 'average'
                              ? 'amber'
                              : diff.status === 'weak'
                              ? 'rose'
                              : 'default'
                          }
                          size="xs"
                        >
                          {diff.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-subtle rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          diff.accuracy >= 80 ? 'bg-emerald-500' : diff.accuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${diff.accuracy}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted mt-1">
                      <span>{diff.correct} correct / {diff.total} total</span>
                      <span>{diff.attempted} attempted</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Question Type Breakdown */}
            <Card className="p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-heading flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  Performance by Question Type
                </h3>
                {weakestQuestionType && (
                  <Badge variant="rose" size="xs">
                    Weakest: {weakestQuestionType}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted mb-4">
                Compares factual recall vs scenario-based diagnostic accuracy
              </p>

              <div className="space-y-3">
                {questionTypePerformance.map((item) => (
                  <div key={item.questionType} className="p-3 rounded-xl card-base border border-subtle shadow-sm">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-heading">
                        {item.questionType.replace('_', ' ')}
                      </span>
                      <span className="font-bold text-heading">{item.accuracy}%</span>
                    </div>
                    <div className="w-full bg-subtle rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.accuracy >= 80 ? 'bg-emerald-500' : item.accuracy >= 60 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${item.accuracy}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted mt-1">
                      <span>{item.correct} correct / {item.total} total</span>
                      <span>{item.attempted} answered</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Module Performance */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modulePerformance.map((mod) => (
              <Card
                key={mod.moduleId}
                className="p-5 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="indigo" size="sm">
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
                    >
                      {mod.status}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-heading mb-3">
                    {mod.moduleName}
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted">
                      <span>Module Accuracy</span>
                      <span className="font-bold text-heading">{mod.accuracy}%</span>
                    </div>
                    <div className="w-full bg-subtle rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          mod.accuracy >= 80 ? 'bg-emerald-500' : mod.accuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${mod.accuracy}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-subtle text-[11px]">
                    <div>
                      <span className="text-muted block">Quizzes Done</span>
                      <span className="font-semibold text-heading">{mod.quizzesCompleted}</span>
                    </div>
                    <div>
                      <span className="text-muted block">Questions Solved</span>
                      <span className="font-semibold text-heading">{mod.questionsAttempted}</span>
                    </div>
                    <div>
                      <span className="text-muted block">Total Study Time</span>
                      <span className="font-semibold text-heading">{formatSeconds(mod.totalTimeSpent)}</span>
                    </div>
                    <div>
                      <span className="text-muted block">Mean Score</span>
                      <span className="font-semibold text-heading">{mod.averageScore} pts</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-subtle">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => window.location.assign(`/quizzes?module=${mod.moduleId}`)}
                  >
                    Practice {mod.moduleCode} Quizzes <ArrowRight className="h-3 w-3 ml-1 inline" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: All Topics */}
      {activeTab === 'topics' && (
        <Card className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-body">
              <thead className="bg-subtle text-muted uppercase text-[10px] tracking-wider border-b border-subtle">
                <tr>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Solved / Total</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {topicPerformance.map((top, idx) => (
                  <tr key={idx} className="hover:bg-subtle transition">
                    <td className="py-3 px-4 font-semibold text-heading">
                      {top.topic}
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {top.moduleCode}
                    </td>
                    <td className="py-3 px-4 text-muted">
                      Level {Math.round(top.averageDifficulty)}
                    </td>
                    <td className="py-3 px-4">
                      {top.correct} / {top.totalQuestions}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-heading w-8">{top.accuracy}%</span>
                        <div className="w-20 bg-subtle rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              top.accuracy >= 80 ? 'bg-emerald-500' : top.accuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${top.accuracy}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
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
                        {top.status.replace('_', ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT 4: Frequently Missed Questions */}
      {activeTab === 'missed' && (
        <div className="space-y-3">
          {frequentlyMissedQuestions.length === 0 ? (
            <Card className="p-6 text-center text-muted text-sm shadow-sm">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <span className="font-semibold text-heading">No Problem Questions</span>
              <p className="text-xs text-muted mt-1">
                You currently have zero questions with repeated errors.
              </p>
            </Card>
          ) : (
            frequentlyMissedQuestions.map((q) => (
              <Card
                key={q.questionId}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm hover:border-indigo-500/30 transition"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="indigo" size="xs">
                      {q.moduleCode}
                    </Badge>
                    <span className="text-muted">·</span>
                    <span className="text-muted">{q.topic}</span>
                    <span className="text-muted">·</span>
                    <Badge variant="default" size="xs">
                      Level {q.difficulty}
                    </Badge>
                    <Badge variant="default" size="xs">
                      {q.questionType}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-heading line-clamp-2">
                    {q.questionText}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs flex-shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-rose-500">
                      {q.timesIncorrect} Misses
                    </div>
                    <div className="text-[11px] text-muted">
                      {q.timesAttempted} attempts ({q.accuracy}%)
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    icon={ArrowRight}
                    onClick={() => window.location.assign('/quizzes')}
                    title="Practice again"
                  />
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

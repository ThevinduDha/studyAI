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

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, topics, modules, missed
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-64 bg-slate-800 animate-pulse rounded-lg mb-2"></div>
            <div className="h-4 w-96 bg-slate-800/60 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 border border-slate-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="h-72 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Unable to Load Analytics</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-6 shadow-inner shadow-indigo-500/10">
          <BarChart2 className="h-10 w-10" />
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-950/60 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
          Phase 11 Intelligence
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-3 mb-2">No Quiz History Yet</h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto mb-8">
          Complete your first practice quiz to unlock comprehensive performance metrics, weak-topic diagnosis, and personalized revision intelligence.
        </p>
        <Link
          to="/quizzes"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 transition transform hover:-translate-y-0.5"
        >
          <Award className="h-4 w-4" />
          Take a Practice Quiz
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Performance Analytics
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
              Phase 11
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Grounded learning analytics derived from your validated Quiz records.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <Link
            to="/quizzes"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition"
          >
            <Award className="h-3.5 w-3.5" />
            Start Quiz
          </Link>
        </div>
      </div>

      {/* 1. Overview Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        {/* Overall Accuracy */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Overall Accuracy</span>
            <Target className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {overview.overallAccuracy}%
              </span>
              <span
                className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                  overview.overallAccuracy >= 80
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : overview.overallAccuracy >= 60
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {overview.overallAccuracy >= 80 ? 'Strong' : overview.overallAccuracy >= 60 ? 'Average' : 'Needs Focus'}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overview.overallAccuracy >= 80 ? 'bg-emerald-500' : overview.overallAccuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${overview.overallAccuracy}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quizzes Completed */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Quizzes Done</span>
            <Award className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {overview.totalQuizzesCompleted}
            </span>
            <p className="text-slate-500 text-[11px] mt-1">
              Avg score: <span className="text-slate-300 font-medium">{overview.averageQuizScore} pts</span>
            </p>
          </div>
        </div>

        {/* Questions Attempted */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Questions Solved</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {overview.totalQuestionsAttempted}
            </span>
            <p className="text-slate-500 text-[11px] mt-1">
              <span className="text-emerald-400 font-medium">{overview.totalCorrect} correct</span> · <span className="text-rose-400 font-medium">{overview.totalIncorrect} missed</span>
            </p>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Best / Worst</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-extrabold text-white">
              <span>{overview.bestQuizPercentage}%</span>
              <span className="text-xs text-slate-500 font-normal">/ {overview.worstQuizPercentage}%</span>
            </div>
            <p className="text-slate-500 text-[11px] mt-1">
              Mean: <span className="text-slate-300 font-medium">{overview.averageQuizPercentage}%</span>
            </p>
          </div>
        </div>

        {/* Total Time Spent */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Study Time</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {formatSeconds(overview.totalTimeSpent)}
            </span>
            <p className="text-slate-500 text-[11px] mt-1">
              Pacing: <span className="text-slate-300 font-medium">~{overview.averageTimePerQuestion}s / question</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Performance Trend & AI Advisor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Trend Line Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-400" />
                Performance Trend (Recent Quizzes)
              </h2>
              <p className="text-xs text-slate-400">
                Tracking accuracy progression across sequential attempts
              </p>
            </div>

            {/* Trend Indicator Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  trend.trend === 'improving'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : trend.trend === 'declining'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : trend.trend === 'stable'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {trend.trend === 'improving' && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
                {trend.trend === 'declining' && <TrendingDown className="h-3.5 w-3.5 text-rose-400" />}
                {trend.trend === 'stable' && <Activity className="h-3.5 w-3.5 text-blue-400" />}
                {trend.trend === 'insufficient_data' && <HelpCircle className="h-3.5 w-3.5 text-amber-400" />}
                {trend.trend.replace('_', ' ')}
                {trend.delta !== 0 && ` (${trend.delta > 0 ? '+' : ''}${trend.delta}%)`}
              </span>
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
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding - 6}
                      y={y + 3}
                      fill="#64748b"
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
                  stroke="#818cf8"
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
                    fill="#0f172a"
                    stroke="#a5b4fc"
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <text
                    x={pt.x}
                    y={chartHeight - 8}
                    fill="#64748b"
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
                className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900/95 border border-indigo-500/40 px-3 py-2 rounded-lg shadow-xl text-xs"
                style={{
                  left: `${(points[hoveredPoint].x / chartWidth) * 100}%`,
                  top: `${(points[hoveredPoint].y / chartHeight) * 100 - 8}%`
                }}
              >
                <div className="font-semibold text-white">
                  {points[hoveredPoint].data.quizTitle}
                </div>
                <div className="text-indigo-300 text-[11px] font-medium mt-0.5">
                  {points[hoveredPoint].data.percentage}% ({points[hoveredPoint].data.score}/{points[hoveredPoint].data.totalQuestions} pts)
                </div>
                <div className="text-slate-400 text-[10px] mt-0.5">
                  Module: {points[hoveredPoint].data.moduleCode} · {new Date(points[hoveredPoint].data.submittedAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          <p className="text-slate-500 text-[11px] mt-4">
            {trend.reason}
          </p>
        </div>

        {/* AI Study Advice / Strategy Panel (1 Column) */}
        <div className="bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Study Recommendations
              </span>
              <button
                onClick={handleGetAiAdvice}
                disabled={loadingAi}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition"
              >
                {loadingAi ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-3 w-3" />
                    AI Insights
                  </>
                )}
              </button>
            </div>

            <h3 className="text-base font-bold text-white mb-2">
              Actionable Study Plan
            </h3>

            {/* Recommendations List */}
            <div className="space-y-2.5 mt-3">
              {(aiAdvice?.advice || recommendations).slice(0, 3).map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300"
                >
                  <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Quiz CTA */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Ready to improve?</span>
            <Link
              to="/quizzes"
              className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              Take practice quiz <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs for In-Depth Analytics */}
      <div className="border-b border-slate-800 mb-6 flex items-center gap-4">
        {[
          { id: 'overview', label: 'Weak Topics & Breakdowns' },
          { id: 'modules', label: `Module Performance (${modulePerformance.length})` },
          { id: 'topics', label: `All Topics (${topicPerformance.length})` },
          { id: 'missed', label: `Frequently Missed (${frequentlyMissedQuestions.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT 1: Overview, Weak Topics & Breakdowns */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Weak Topics Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  Weak Topic Intelligence
                </h2>
                <p className="text-xs text-slate-400">
                  Topics prioritized by error rates, mistake volume, and difficulty weights
                </p>
              </div>
            </div>

            {weakTopics.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <span className="font-semibold text-white">No Critical Weak Areas Detected</span>
                <p className="text-xs text-slate-400 mt-1">
                  You are maintaining solid accuracy (≥60%) across all tested concepts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weakTopics.map((wt, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-slate-400">
                          {wt.moduleCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            wt.priority === 'HIGH'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {wt.priority} Priority
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-2 line-clamp-1">
                        {wt.topic}
                      </h3>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Accuracy</span>
                          <span className="font-semibold text-rose-400">{wt.accuracy}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full"
                            style={{ width: `${wt.accuracy}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>{wt.incorrect} mistakes / {wt.totalQuestions} questions</span>
                          <span>Level {Math.round(wt.averageDifficulty)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <p className="text-[11px] text-slate-400 italic">
                        "{wt.recommendation}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty & Question Type Dual Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Difficulty Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-400" />
                Performance by Difficulty Level
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Identifies whether conceptual challenges concentrate on advanced material
              </p>

              <div className="space-y-3">
                {difficultyPerformance.map((diff) => (
                  <div key={diff.difficulty} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-200">{diff.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{diff.accuracy}%</span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                            diff.status === 'strong'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : diff.status === 'average'
                              ? 'bg-amber-500/10 text-amber-400'
                              : diff.status === 'weak'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {diff.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          diff.accuracy >= 80 ? 'bg-emerald-500' : diff.accuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${diff.accuracy}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>{diff.correct} correct / {diff.total} total</span>
                      <span>{diff.attempted} attempted</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Type Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-400" />
                  Performance by Question Type
                </h3>
                {weakestQuestionType && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Weakest: {weakestQuestionType}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Compares factual recall vs scenario-based diagnostic accuracy
              </p>

              <div className="space-y-3">
                {questionTypePerformance.map((item) => (
                  <div key={item.questionType} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-200">
                        {item.questionType.replace('_', ' ')}
                      </span>
                      <span className="font-bold text-white">{item.accuracy}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.accuracy >= 80 ? 'bg-emerald-500' : item.accuracy >= 60 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${item.accuracy}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>{item.correct} correct / {item.total} total</span>
                      <span>{item.attempted} answered</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Module Performance */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modulePerformance.map((mod) => (
              <div
                key={mod.moduleId}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
                      {mod.moduleCode}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        mod.status === 'strong'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : mod.status === 'average'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {mod.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-3">
                    {mod.moduleName}
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Module Accuracy</span>
                      <span className="font-bold text-white">{mod.accuracy}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          mod.accuracy >= 80 ? 'bg-emerald-500' : mod.accuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${mod.accuracy}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Quizzes Done</span>
                      <span className="font-semibold text-slate-200">{mod.quizzesCompleted}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Questions Solved</span>
                      <span className="font-semibold text-slate-200">{mod.questionsAttempted}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Study Time</span>
                      <span className="font-semibold text-slate-200">{formatSeconds(mod.totalTimeSpent)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Mean Score</span>
                      <span className="font-semibold text-slate-200">{mod.averageScore} pts</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <Link
                    to={`/quizzes?module=${mod.moduleId}`}
                    className="w-full py-1.5 px-3 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 text-xs font-medium flex items-center justify-center gap-1 transition"
                  >
                    Practice {mod.moduleCode} Quizzes <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: All Topics */}
      {activeTab === 'topics' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Solved / Total</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topicPerformance.map((top, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-white">
                      {top.topic}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {top.moduleCode}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      Level {Math.round(top.averageDifficulty)}
                    </td>
                    <td className="py-3 px-4">
                      {top.correct} / {top.totalQuestions}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white w-8">{top.accuracy}%</span>
                        <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
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
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          top.status === 'STRONG'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : top.status === 'AVERAGE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : top.status === 'WEAK'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {top.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: Frequently Missed Questions */}
      {activeTab === 'missed' && (
        <div className="space-y-3">
          {frequentlyMissedQuestions.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <span className="font-semibold text-white">No Problem Questions</span>
              <p className="text-xs text-slate-400 mt-1">
                You currently have zero questions with repeated errors.
              </p>
            </div>
          ) : (
            frequentlyMissedQuestions.map((q) => (
              <div
                key={q.questionId}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-indigo-400">{q.moduleCode}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{q.topic}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      Level {q.difficulty}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {q.questionType}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white line-clamp-2">
                    {q.questionText}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs flex-shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-rose-400">
                      {q.timesIncorrect} Misses
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {q.timesAttempted} attempts ({q.accuracy}%)
                    </div>
                  </div>
                  <Link
                    to="/quizzes"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Practice again"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

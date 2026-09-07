import { Link } from 'react-router-dom';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  ArrowRight,
  HelpCircle,
  Zap
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';

export default function PerformanceOverview({ analytics = null }) {
  const overview = analytics?.overview || {};
  const trend = analytics?.trend || {};
  const difficultyPerformance = analytics?.difficultyPerformance || [];
  const questionTypePerformance = analytics?.questionTypePerformance || [];

  const hasData = analytics?.hasData && overview.totalQuizzesCompleted > 0;

  if (!hasData) {
    return (
      <Card className="p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-heading flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-indigo-500" />
              Performance Overview
            </h2>
            <Badge variant="default" size="xs">
              No Data Yet
            </Badge>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Take practice quizzes to build your personalized accuracy trajectory, difficulty breakdown, and weak-topic intelligence.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-subtle flex items-center justify-between">
          <span className="text-xs text-muted">Ready to begin?</span>
          <Link to="/quizzes">
            <Button variant="primary" size="xs">
              Start Quiz
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const accuracy = overview.overallAccuracy || 0;

  return (
    <Card className="p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-heading flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-500" />
            Performance Snapshot
          </h2>
          <p className="text-xs text-muted">Real-time mastery metrics from completed tests</p>
        </div>

        <Link
          to="/analytics"
          className="text-xs text-indigo-500 hover:opacity-80 font-medium inline-flex items-center gap-1 transition"
        >
          Full Analytics <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Accuracy & Trend Header */}
      <div className="p-4 rounded-xl card-base border border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-muted block mb-1">Overall Accuracy</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-heading">
              {accuracy}%
            </span>
            <Badge
              variant={
                accuracy >= 80 ? 'emerald' : accuracy >= 60 ? 'amber' : 'rose'
              }
              size="xs"
            >
              {accuracy >= 80 ? 'Strong' : accuracy >= 60 ? 'Average' : 'Needs Focus'}
            </Badge>
          </div>
        </div>

        {/* Trend badge */}
        {trend.trend && (
          <div className="text-left sm:text-right">
            <span className="text-xs text-muted block mb-1">Recent Trajectory</span>
            <Badge
              variant={
                trend.trend === 'improving'
                  ? 'emerald'
                  : trend.trend === 'declining'
                  ? 'rose'
                  : trend.trend === 'stable'
                  ? 'cyan'
                  : 'default'
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
        )}
      </div>

      {/* Difficulty Mastery Bars */}
      {difficultyPerformance.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
            Difficulty Mastery
          </span>
          <div className="space-y-2">
            {difficultyPerformance.map((diff) => (
              <div key={diff.difficulty} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-heading font-medium">{diff.label}</span>
                  <span className="font-semibold text-heading">{diff.accuracy}%</span>
                </div>
                <div className="w-full bg-subtle rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      diff.accuracy >= 80
                        ? 'bg-emerald-500'
                        : diff.accuracy >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${diff.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Type Snapshot */}
      {questionTypePerformance.length > 0 && (
        <div className="pt-3 border-t border-subtle">
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span className="font-semibold uppercase tracking-wider">Format Breakdown</span>
            {analytics?.weakestQuestionType && (
              <span className="text-rose-500 text-[11px]">
                Weakest: {analytics.weakestQuestionType}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {questionTypePerformance.map((qt) => (
              <div
                key={qt.questionType}
                className="p-2 rounded-lg card-base border border-subtle text-center"
              >
                <span className="text-[10px] text-muted block truncate">
                  {qt.questionType.replace('_', ' ')}
                </span>
                <span className="font-bold text-heading text-xs">
                  {qt.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

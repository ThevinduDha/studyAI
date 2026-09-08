import React from 'react';
import {
  BarChart2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  HelpCircle,
  Award,
  RefreshCw
} from 'lucide-react';
import { PageHeader } from '../ui/PageHeader.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { GroundedBadge } from '../ai/index.js';

/**
 * AnalyticsHero
 *
 * Header for Student Performance Intelligence with ambient glow,
 * trend trajectory indicator, and quick actions.
 */
export function AnalyticsHero({
  overallAccuracy = 0,
  trend = {},
  onRefresh,
  refreshing = false,
  onStartQuiz
}) {
  const trendType = trend.trend || 'insufficient_data';
  const delta = trend.delta || 0;

  const trendBadgeConfig = {
    improving: {
      label: `Improving (+${delta}%)`,
      variant: 'emerald',
      icon: TrendingUp
    },
    declining: {
      label: `Declining (${delta}%)`,
      variant: 'rose',
      icon: TrendingDown
    },
    stable: {
      label: delta !== 0 ? `Stable (${delta > 0 ? '+' : ''}${delta}%)` : 'Stable',
      variant: 'cyan',
      icon: Activity
    },
    insufficient_data: {
      label: 'Trend Unlocking',
      variant: 'amber',
      icon: HelpCircle
    }
  };

  const currentTrend = trendBadgeConfig[trendType] || trendBadgeConfig.insufficient_data;
  const TrendIcon = currentTrend.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl card-base border border-subtle p-6 sm:p-8 shadow-sm">
      {/* Subtle Ambient Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <GroundedBadge label="Phase 11 Intelligence" size="xs" variant="indigo" />
            <Badge variant={currentTrend.variant} size="xs" className="inline-flex items-center gap-1 font-semibold">
              <TrendIcon className="h-3 w-3" />
              <span>{currentTrend.label}</span>
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">
            Performance Intelligence
          </h1>

          <p className="text-xs sm:text-sm text-secondary leading-relaxed">
            Personalized diagnostic analytics, weak-topic intelligence, and exam pacing derived strictly from your verified quiz history.
          </p>
        </div>

        {/* Hero Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={onRefresh}
            loading={refreshing}
            title="Refresh analytics from server"
          >
            Refresh
          </Button>

          {onStartQuiz && (
            <Button
              variant="primary"
              size="sm"
              icon={Award}
              onClick={onStartQuiz}
            >
              Start Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsHero;

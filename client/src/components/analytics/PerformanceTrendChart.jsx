import React, { useState } from 'react';
import { Activity, TrendingUp, TrendingDown, HelpCircle, Sparkles, Clock, Calendar } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

/**
 * PerformanceTrendChart
 *
 * Lightweight, zero-dependency SVG line chart tracking chronological quiz accuracy.
 * Handles insufficient data states gracefully without misleading empty lines.
 */
export function PerformanceTrendChart({
  recentPerformance = [],
  trend = {},
  className = ''
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const hasEnoughData = recentPerformance.length >= 3 && trend.trend !== 'insufficient_data';

  const chartWidth = 700;
  const chartHeight = 190;
  const padding = 28;
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;

  // Calculate coordinates
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

  const trendBadgeConfig = {
    improving: {
      label: `Improving (+${trend.delta || 0}%)`,
      variant: 'emerald',
      icon: TrendingUp
    },
    declining: {
      label: `Declining (${trend.delta || 0}%)`,
      variant: 'rose',
      icon: TrendingDown
    },
    stable: {
      label: trend.delta ? `Stable (${trend.delta > 0 ? '+' : ''}${trend.delta}%)` : 'Stable',
      variant: 'cyan',
      icon: Activity
    },
    insufficient_data: {
      label: 'Trend Unlocking',
      variant: 'amber',
      icon: HelpCircle
    }
  };

  const currentTrend = trendBadgeConfig[trend.trend] || trendBadgeConfig.insufficient_data;
  const TrendIcon = currentTrend.icon;

  return (
    <Card className={`p-5 sm:p-6 flex flex-col justify-between shadow-sm border border-subtle ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-heading flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            Performance Trend Trajectory
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Chronological quiz accuracy progression across completed attempts
          </p>
        </div>

        <Badge variant={currentTrend.variant} size="xs" className="inline-flex items-center gap-1 font-semibold">
          <TrendIcon className="h-3 w-3" />
          <span>{currentTrend.label}</span>
        </Badge>
      </div>

      {/* Insufficient Data State */}
      {!hasEnoughData ? (
        <div className="my-6 p-6 rounded-2xl card-base border border-dashed border-subtle text-center space-y-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-heading">
            Trend Trajectory Unlocking
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
            {trend.reason || 'Complete at least 3 practice quizzes to establish a baseline and unlock your performance trend.'}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-subtle text-[11px] text-muted font-medium">
            <span>{recentPerformance.length} of 3 baseline quizzes completed</span>
          </div>
        </div>
      ) : (
        /* SVG Line Chart */
        <div className="w-full relative mt-2">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible select-none"
            aria-label="Performance trend chart over time"
          >
            <defs>
              <linearGradient id="chartTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = chartHeight - padding - (val / 100) * plotHeight;
              return (
                <g key={val}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="var(--border-subtle, #1e293b)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding - 6}
                    y={y + 3}
                    fill="var(--text-muted, #64748b)"
                    fontSize="9"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Gradient Area Fill */}
            {areaD && <path d={areaD} fill="url(#chartTrendGrad)" />}

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
                  fill="var(--bg-card, #111a2e)"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="transition-all duration-150"
                />
                <text
                  x={pt.x}
                  y={chartHeight - 8}
                  fill="var(--text-muted, #64748b)"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  #{idx + 1}
                </text>
              </g>
            ))}
          </svg>

          {/* Interactive Tooltip on Hover */}
          {hoveredPoint !== null && points[hoveredPoint] && (
            <div
              className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full card-base border border-indigo-500/40 px-3.5 py-2.5 rounded-xl shadow-xl text-xs animate-fade-in"
              style={{
                left: `${(points[hoveredPoint].x / chartWidth) * 100}%`,
                top: `${(points[hoveredPoint].y / chartHeight) * 100 - 10}%`
              }}
            >
              <div className="font-semibold text-heading truncate max-w-[200px]">
                {points[hoveredPoint].data.quizTitle || 'Practice Test'}
              </div>
              <div className="text-indigo-400 text-xs font-bold mt-0.5">
                {points[hoveredPoint].data.percentage}% Accuracy ({points[hoveredPoint].data.score}/{points[hoveredPoint].data.totalQuestions} pts)
              </div>
              <div className="text-muted text-[10px] mt-0.5 flex items-center gap-1.5">
                <span>{points[hoveredPoint].data.moduleCode}</span>
                <span>•</span>
                <span>{new Date(points[hoveredPoint].data.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trajectory Reason Footer */}
      <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between text-xs text-muted">
        <span className="text-[11px] leading-relaxed">
          {trend.reason || 'Calculated deterministically from recent chronological attempts.'}
        </span>
        {hasEnoughData && (
          <span className="text-[10px] text-muted shrink-0 font-mono">
            Last {recentPerformance.length} tests
          </span>
        )}
      </div>
    </Card>
  );
}

export default PerformanceTrendChart;

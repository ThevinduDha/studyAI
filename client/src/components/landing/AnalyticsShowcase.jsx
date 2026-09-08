import {
  BarChart2,
  TrendingUp,
  Target,
  Award,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

export default function AnalyticsShowcase() {
  const trendPoints = [
    { label: 'Test 1', val: 62 },
    { label: 'Test 2', val: 68 },
    { label: 'Test 3', val: 74 },
    { label: 'Test 4', val: 79 },
    { label: 'Test 5', val: 82 },
    { label: 'Test 6', val: 86 }
  ];

  return (
    <section id="analytics" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 light:bg-emerald-50 light:text-emerald-700 text-xs font-semibold">
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Learning Intelligence</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white light:text-slate-900 tracking-tight">
            Know exactly what to study next.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 light:text-slate-600 leading-relaxed">
            Stop guessing which chapters need review. StudyAI continuously diagnoses your strengths and surfaces high-priority weak topics before exam day.
          </p>
        </div>

        {/* Analytics Presentation Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 light:bg-white border border-slate-800 light:border-slate-200 shadow-2xl shadow-black/30 backdrop-blur-xl space-y-6 max-w-5xl mx-auto">
          {/* Top Bar with Demo Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 light:border-slate-200">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white light:text-slate-900 flex items-center gap-2">
                Student Mastery Dashboard
                <Badge variant="indigo" size="xs">
                  Sample Progress Preview
                </Badge>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tracking powered by your quiz and exam drill attempts
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 self-start sm:self-auto">
              <TrendingUp className="h-4 w-4" />
              <span>Overall Accuracy +8% this month</span>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/60 light:border-slate-200">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Overall Accuracy
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900">82%</span>
                <span className="text-[11px] text-emerald-400 font-bold">Strong</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/60 light:border-slate-200">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quizzes Completed
              </span>
              <div className="mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900">14</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/60 light:border-slate-200">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Questions Answered
              </span>
              <div className="mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900">180</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 light:bg-slate-50 border border-slate-700/60 light:border-slate-200">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Average Score
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900">84%</span>
                <span className="text-[11px] text-indigo-400 font-bold">Passing</span>
              </div>
            </div>
          </div>

          {/* Lower Grid: Trend Chart + Weak Topics + Difficulty */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Performance Trend Chart (7 cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/60 light:border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white light:text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                    Accuracy Trajectory
                  </h4>
                  <p className="text-[11px] text-slate-400">Continuous scoring across last 6 practice quizzes</p>
                </div>
                <Badge variant="emerald" size="xs">
                  Improving Trend
                </Badge>
              </div>

              {/* Responsive SVG Line Chart */}
              <div className="h-40 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 130" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="landingChartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid guide lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="currentColor" className="text-slate-800 light:text-slate-200" strokeDasharray="3 3" />
                  <line x1="0" y1="65" x2="500" y2="65" stroke="currentColor" className="text-slate-800 light:text-slate-200" strokeDasharray="3 3" />
                  <line x1="0" y1="110" x2="500" y2="110" stroke="currentColor" className="text-slate-800 light:text-slate-200" strokeDasharray="3 3" />

                  {/* Area fill */}
                  <polygon
                    points="0,130 0,90 100,75 200,60 300,45 400,38 500,26 500,130"
                    fill="url(#landingChartGlow)"
                  />

                  {/* Line */}
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,90 100,75 200,60 300,45 400,38 500,26"
                  />

                  {/* Coordinate Points */}
                  {[
                    { cx: 0, cy: 90, label: '62%' },
                    { cx: 100, cy: 75, label: '68%' },
                    { cx: 200, cy: 60, label: '74%' },
                    { cx: 300, cy: 45, label: '79%' },
                    { cx: 400, cy: 38, label: '82%' },
                    { cx: 500, cy: 26, label: '86%' }
                  ].map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.cx}
                      cy={pt.cy}
                      r="4.5"
                      className="fill-indigo-400 stroke-white light:stroke-slate-900 stroke-2"
                    />
                  ))}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/40 light:border-slate-200">
                <span>Quiz 01 &bull; 62%</span>
                <span>Quiz 03 &bull; 74%</span>
                <span className="font-bold text-indigo-400">Quiz 06 &bull; 86%</span>
              </div>
            </div>

            {/* Right: Weak Topics & Difficulty (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Weak Topics */}
              <div className="p-4 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/60 light:border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-white light:text-slate-900 flex items-center justify-between">
                  <span>Priority Focus Areas</span>
                  <span className="text-[10px] text-rose-400 font-semibold">Needs Review</span>
                </h4>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 light:bg-white border border-rose-500/25 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white light:text-slate-900">Database Normalization (BCNF)</div>
                      <div className="text-[10px] text-slate-400">3 missed exam questions</div>
                    </div>
                    <span className="text-xs font-bold text-rose-400">54% Acc</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 light:bg-white border border-amber-500/25 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white light:text-slate-900">Virtual Memory & Paging</div>
                      <div className="text-[10px] text-slate-400">2 missed scenario drills</div>
                    </div>
                    <span className="text-xs font-bold text-amber-400">62% Acc</span>
                  </div>
                </div>
              </div>

              {/* Difficulty Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-800/40 light:bg-slate-50 border border-slate-700/60 light:border-slate-200 space-y-2.5">
                <h4 className="text-xs font-bold text-white light:text-slate-900">
                  Performance by Difficulty
                </h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 light:text-slate-700 mb-1">
                      <span>Foundational (Easy)</span>
                      <span className="font-bold text-emerald-400">94%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-700 light:bg-slate-200 overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: '94%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 light:text-slate-700 mb-1">
                      <span>Application (Medium)</span>
                      <span className="font-bold text-indigo-400">81%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-700 light:bg-slate-200 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '81%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 light:text-slate-700 mb-1">
                      <span>Scenario Synthesis (Hard)</span>
                      <span className="font-bold text-amber-400">65%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-700 light:bg-slate-200 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

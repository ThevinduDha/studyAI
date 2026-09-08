import {
  FileText,
  Sparkles,
  HelpCircle,
  Award,
  TrendingUp,
  ArrowRight,
  ArrowDown,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

export default function StudyWorkflow() {
  const stages = [
    {
      step: '1',
      title: 'Lecture PDF',
      badge: 'Input',
      icon: FileText,
      color: 'indigo',
      desc: 'Raw course slides & reading materials.',
      snippet: 'CS301 &bull; 32 Pages'
    },
    {
      step: '2',
      title: 'AI Summary',
      badge: 'Synthesize',
      icon: Sparkles,
      color: 'purple',
      desc: 'Structured high-yield lecture points.',
      snippet: 'Key concepts & formulas'
    },
    {
      step: '3',
      title: 'Exam Practice',
      badge: 'Drill',
      icon: HelpCircle,
      color: 'cyan',
      desc: 'Topic-level exam questions & explanations.',
      snippet: 'MCQ & Scenario Drills'
    },
    {
      step: '4',
      title: 'Active Quiz',
      badge: 'Evaluate',
      icon: Award,
      color: 'amber',
      desc: 'Timed practice exams under realistic conditions.',
      snippet: 'Instant automated grading'
    },
    {
      step: '5',
      title: 'Analytics',
      badge: 'Master',
      icon: TrendingUp,
      color: 'emerald',
      desc: 'Identify weak topics before exam day.',
      snippet: 'Targeted focus areas'
    }
  ];

  return (
    <section className="py-20 md:py-28 relative bg-slate-950/40 light:bg-slate-50/50 border-y border-slate-800/80 light:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 light:bg-cyan-50 light:text-cyan-700 text-xs font-semibold">
            <span>Visual Learning Flow</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white light:text-slate-900 tracking-tight">
            The complete transformation in 5 steps.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 light:text-slate-600 leading-relaxed">
            See how StudyAI connects raw lecture PDFs into structured study materials, active practice, and mastery tracking.
          </p>
        </div>

        {/* 5-Stage Desktop Pipeline */}
        <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
          {stages.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div key={st.step} className="flex items-center">
                <div className="flex-1 p-5 rounded-2xl bg-slate-900/90 light:bg-white border border-slate-800 light:border-slate-200 hover:border-indigo-500/40 transition-all duration-200 group flex flex-col justify-between h-[210px]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 light:bg-slate-100 text-slate-400">
                        Step 0{st.step}
                      </span>
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 light:text-indigo-600 group-hover:scale-110 transition-transform">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white light:text-slate-900">
                        {st.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 light:text-slate-600 mt-1 leading-relaxed line-clamp-2">
                        {st.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 light:border-slate-100 flex items-center justify-between text-[10px] text-indigo-400 light:text-indigo-600 font-semibold">
                    <span>{st.snippet}</span>
                  </div>
                </div>

                {/* Arrow connector */}
                {idx < stages.length - 1 && (
                  <div className="px-1 text-slate-600 light:text-slate-400 shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Vertical Flow */}
        <div className="lg:hidden space-y-3 max-w-md mx-auto">
          {stages.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div key={st.step} className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900/90 light:bg-white border border-slate-800 light:border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 light:text-indigo-600 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500">0{st.step}</span>
                        <h4 className="text-xs font-bold text-white light:text-slate-900">{st.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{st.desc}</p>
                    </div>
                  </div>
                  <Badge variant="indigo" size="xs">
                    {st.badge}
                  </Badge>
                </div>

                {idx < stages.length - 1 && (
                  <div className="flex justify-center text-slate-600 light:text-slate-400">
                    <ArrowDown className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

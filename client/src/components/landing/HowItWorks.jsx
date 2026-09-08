import {
  UploadCloud,
  Sparkles,
  BookOpen,
  TrendingUp,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Upload your lectures',
      subtitle: 'Add course materials',
      description: 'Upload your professor’s lecture slides, class notes, or textbook chapters in PDF format.',
      icon: UploadCloud,
      color: 'indigo'
    },
    {
      num: '02',
      title: 'StudyAI organizes concepts',
      subtitle: 'Instant comprehension',
      description: 'The system parses and connects technical definitions, formulas, and high-yield topics.',
      icon: Sparkles,
      color: 'purple'
    },
    {
      num: '03',
      title: 'Ask, summarize & practice',
      subtitle: 'Active learning loop',
      description: 'Chat with your AI tutor, read structured lecture notes, and drill exam-style questions.',
      icon: BookOpen,
      color: 'cyan'
    },
    {
      num: '04',
      title: 'Track your progress',
      subtitle: 'Targeted revision',
      description: 'See your accuracy trends, discover priority weak spots, and walk into exams with confidence.',
      icon: TrendingUp,
      color: 'emerald'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative bg-slate-950/40 light:bg-slate-50/50 border-y border-slate-800/80 light:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 light:bg-purple-50 light:text-purple-700 text-xs font-semibold">
            <span>How It Works</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white light:text-slate-900 tracking-tight">
            From lecture material to confident understanding.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 light:text-slate-600 leading-relaxed">
            Four simple steps to transform raw course documents into higher exam scores.
          </p>
        </div>

        {/* Desktop Horizontal Workflow */}
        <div className="hidden lg:grid grid-cols-4 gap-6 relative">
          {/* Subtle connecting track line behind the steps */}
          <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-emerald-500/30 -translate-y-12 -z-0" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative z-10 p-6 rounded-2xl bg-slate-900/90 light:bg-white border border-slate-800 light:border-slate-200 hover:border-indigo-500/50 transition-all duration-200 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Step number badge & icon */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-slate-500 light:text-slate-400 group-hover:text-indigo-400 transition-colors">
                      {step.num}
                    </span>
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 light:text-indigo-600 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-indigo-400 light:text-indigo-600 uppercase tracking-wider block">
                      {step.subtitle}
                    </span>
                    <h3 className="text-base font-bold text-white light:text-slate-900 mt-1">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile & Tablet Vertical Timeline */}
        <div className="lg:hidden space-y-4 max-w-lg mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-5 rounded-2xl bg-slate-900/90 light:bg-white border border-slate-800 light:border-slate-200 flex items-start gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-xl bg-indigo-600/20 text-indigo-400 light:text-indigo-600 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-sm shrink-0">
                    {step.num}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="w-0.5 h-10 bg-slate-800 light:bg-slate-200 mt-2" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-semibold text-indigo-400 light:text-indigo-600 uppercase tracking-wider block">
                    {step.subtitle}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white light:text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed pt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

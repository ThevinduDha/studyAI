import {
  BookOpen,
  Sparkles,
  HelpCircle,
  Target,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';

export default function WhyStudyAI() {
  const benefits = [
    {
      title: 'Learn from your own materials',
      description: 'Grounded directly in your university syllabus and professor’s slides. You study the exact concepts you will be tested on.',
      icon: BookOpen,
      color: 'indigo'
    },
    {
      title: 'Ask questions naturally',
      description: 'No rigid prompt engineering required. Ask for everyday analogies, quick summaries, or rigorous derivations anytime.',
      icon: Sparkles,
      color: 'purple'
    },
    {
      title: 'Practice before exams',
      description: 'Test yourself under realistic timed exam conditions with automated grading, explanations, and common trap warnings.',
      icon: HelpCircle,
      color: 'cyan'
    },
    {
      title: 'Understand your weak areas',
      description: 'Automated diagnostic metrics highlight priority topics where your accuracy drops, directing revision where it counts.',
      icon: Target,
      color: 'rose'
    },
    {
      title: 'Keep everything in one place',
      description: 'Course PDFs, synthesized lecture notes, practice history, and AI tutor conversations organized seamlessly by course.',
      icon: Layers,
      color: 'emerald'
    }
  ];

  return (
    <section className="py-20 md:py-28 relative bg-slate-950/40 light:bg-slate-50/50 border-t border-slate-800/80 light:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 light:bg-indigo-50 light:text-indigo-700 text-xs font-semibold">
            <span>Student Benefits</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white light:text-slate-900 tracking-tight">
            Built around the way students actually study.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 light:text-slate-600 leading-relaxed">
            Eliminate fragmented notes, disconnected flashcards, and last-minute panic with an integrated learning platform.
          </p>
        </div>

        {/* 5 Benefit Cards in a 3 + 2 balanced grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.slice(0, 3).map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="p-6 rounded-2xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 hover:border-indigo-500/40 transition-all duration-200 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 light:text-indigo-600 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white light:text-slate-900 group-hover:text-indigo-400 transition-colors">
                      {b.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 leading-relaxed mt-2">
                      {b.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-4xl mx-auto">
          {benefits.slice(3).map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="p-6 rounded-2xl bg-slate-900/80 light:bg-white border border-slate-800 light:border-slate-200 hover:border-indigo-500/40 transition-all duration-200 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 light:text-indigo-600 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white light:text-slate-900 group-hover:text-indigo-400 transition-colors">
                      {b.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 leading-relaxed mt-2">
                      {b.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

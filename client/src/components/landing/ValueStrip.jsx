import {
  BookOpen,
  Bot,
  HelpCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';

export default function ValueStrip() {
  const values = [
    {
      icon: BookOpen,
      color: 'indigo',
      title: 'Lecture-Based Learning',
      description: 'Your uploaded slides and textbooks become your primary source of truth without hallucinated content.'
    },
    {
      icon: Bot,
      color: 'purple',
      title: 'AI Tutor',
      description: 'Ask questions in plain English and receive instant, step-by-step conceptual explanations.'
    },
    {
      icon: HelpCircle,
      color: 'amber',
      title: 'Exam Practice',
      description: 'Master course topics with exam-grade practice questions and interactive timed quizzes.'
    },
    {
      icon: TrendingUp,
      color: 'emerald',
      title: 'Performance Insights',
      description: 'Pinpoint weak topics before exam day with automated difficulty tracking and analytics.'
    }
  ];

  return (
    <section className="py-12 border-y border-slate-800/80 light:border-slate-200/80 bg-slate-950/40 light:bg-slate-50/60 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-1.5 mb-8">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 light:text-indigo-600">
            Integrated Learning System
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white light:text-slate-900">
            Everything you need to study smarter
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="p-5 rounded-2xl bg-slate-900/60 light:bg-white border border-slate-800/80 light:border-slate-200 hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-200 group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
                    v.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 light:text-indigo-600' :
                    v.color === 'purple' ? 'bg-purple-500/10 text-purple-400 light:text-purple-600' :
                    v.color === 'amber' ? 'bg-amber-500/10 text-amber-400 light:text-amber-600' :
                    'bg-emerald-500/10 text-emerald-400 light:text-emerald-600'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-sm font-bold text-white light:text-slate-900 group-hover:text-indigo-400 transition-colors">
                    {v.title}
                  </h3>

                  <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
                    {v.description}
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

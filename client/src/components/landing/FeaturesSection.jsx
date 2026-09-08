import {
  Sparkles,
  FileText,
  HelpCircle,
  Award,
  BarChart3,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

export default function FeaturesSection() {
  const features = [
    {
      id: 'ai-tutor',
      icon: Sparkles,
      color: 'indigo',
      title: 'AI Tutor',
      description: 'Ask questions and get grounded answers from your lecture materials.',
      pill: 'Verifiable Citations',
      detail: 'Conversational assistant tailored to your specific professor’s slides and syllabus.'
    },
    {
      id: 'lecture-summaries',
      icon: FileText,
      color: 'purple',
      title: 'Lecture Summaries',
      description: 'Turn lengthy lecture documents into structured study notes.',
      pill: 'High-Yield Takeaways',
      detail: 'Extract core definitions, key formulas, and exam focus points in seconds.'
    },
    {
      id: 'exam-questions',
      icon: HelpCircle,
      color: 'cyan',
      title: 'Exam Questions',
      description: 'Practice with exam-focused questions generated from your learning material.',
      pill: 'MCQ & Scenario Drills',
      detail: 'Step-by-step reasoning and trap warnings for university exam prep.'
    },
    {
      id: 'ai-quizzes',
      icon: Award,
      color: 'amber',
      title: 'AI Quizzes',
      description: 'Test yourself with interactive quizzes and instant results.',
      pill: 'Timed Test Mode',
      detail: 'Simulate realistic exam pressure with instant scoring and explanation review.'
    },
    {
      id: 'performance-analytics',
      icon: BarChart3,
      color: 'emerald',
      title: 'Performance Analytics',
      description: 'Understand your strengths and discover where you need more practice.',
      pill: 'Priority Weak Topics',
      detail: 'Diagnose whether mistakes stem from foundational recall or advanced applications.'
    },
    {
      id: 'knowledge-search',
      icon: Search,
      color: 'rose',
      title: 'Knowledge Search',
      description: 'Find relevant information across your learning materials.',
      pill: 'Instant Keyword Discovery',
      detail: 'Locate specific lecture paragraphs, figures, and definitions across all semesters.'
    }
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 light:bg-indigo-50 light:text-indigo-700 text-xs font-semibold">
            <span>Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white light:text-slate-900 tracking-tight">
            One workspace for your entire study journey.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 light:text-slate-600 leading-relaxed">
            Everything you need to comprehend coursework, test your mastery, and walk into exams prepared.
          </p>
        </div>

        {/* Features 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="p-6 rounded-2xl bg-slate-900/60 light:bg-white border border-slate-800 light:border-slate-200 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
                      feat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 light:text-indigo-600 border border-indigo-500/20' :
                      feat.color === 'purple' ? 'bg-purple-500/10 text-purple-400 light:text-purple-600 border border-purple-500/20' :
                      feat.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400 light:text-cyan-600 border border-cyan-500/20' :
                      feat.color === 'amber' ? 'bg-amber-500/10 text-amber-400 light:text-amber-600 border border-amber-500/20' :
                      feat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 light:text-emerald-600 border border-emerald-500/20' :
                      'bg-rose-500/10 text-rose-400 light:text-rose-600 border border-rose-500/20'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="default" size="xs" className="text-[10px]">
                      {feat.pill}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white light:text-slate-900 group-hover:text-indigo-400 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 light:text-slate-700 font-medium mt-1 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed pt-2 border-t border-slate-800/80 light:border-slate-200">
                    {feat.detail}
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

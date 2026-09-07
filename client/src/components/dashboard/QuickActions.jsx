import { Link } from 'react-router-dom';
import {
  Sparkles,
  HelpCircle,
  Award,
  FileText,
  BarChart2,
  Search,
  ArrowRight
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

const actions = [
  {
    title: 'AI Study Assistant',
    description: 'Ask questions strictly grounded in your lecture materials with verified citations.',
    icon: Sparkles,
    colorClass: 'bg-indigo-500/10 text-indigo-500',
    path: '/assistant',
    badge: 'Grounded'
  },
  {
    title: 'Exam Question Generator',
    description: 'Practice high-yield exam questions, analyze clues, and reveal test traps.',
    icon: HelpCircle,
    colorClass: 'bg-purple-500/10 text-purple-500',
    path: '/questions',
    badge: 'Phase 9'
  },
  {
    title: 'Interactive AI Quiz',
    description: 'Take timed practice tests evaluated server-side to benchmark conceptual mastery.',
    icon: Award,
    colorClass: 'bg-emerald-500/10 text-emerald-500',
    path: '/quizzes',
    badge: 'Scored'
  },
  {
    title: 'Lecture Summaries',
    description: 'Synthesize executive overviews, key concepts, and exam takeaways from course slides.',
    icon: FileText,
    colorClass: 'bg-amber-500/10 text-amber-500',
    path: '/summaries',
    badge: 'Phase 8'
  },
  {
    title: 'Learning Analytics',
    description: 'Deep weak-topic diagnosis, accuracy trends, and personalized study recommendations.',
    icon: BarChart2,
    colorClass: 'bg-cyan-500/10 text-cyan-500',
    path: '/analytics',
    badge: 'Intelligence'
  },
  {
    title: 'Knowledge Search',
    description: 'Search lecture chunks via 768-dimensional Gemini embeddings and Atlas Vector Search.',
    icon: Search,
    colorClass: 'bg-rose-500/10 text-rose-500',
    path: '/search',
    badge: 'Semantic'
  }
];

export default function QuickActions() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-heading">Quick Actions</h2>
          <p className="text-xs text-muted">Direct access to StudyAI's AI-powered study tools</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link key={idx} to={action.path} className="group">
              <Card
                hoverable
                className="p-5 h-full flex flex-col justify-between transition hover:border-indigo-500/40 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${action.colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {action.badge && (
                      <Badge variant="default" size="xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-heading mb-1.5 group-hover:text-indigo-500 transition">
                    {action.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {action.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between text-xs text-muted group-hover:text-indigo-500 transition">
                  <span className="font-medium text-[11px]">Launch tool</span>
                  <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

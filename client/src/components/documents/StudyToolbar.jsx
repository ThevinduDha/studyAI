import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  HelpCircle,
  Award,
  Search,
  BookOpen
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';

/**
 * StudyToolbar
 * Shared learning actions linking a document/module to StudyAI tools.
 */
export function StudyToolbar({
  moduleId,
  documentId,
  variant = 'compact', // 'compact' | 'full'
  className = ''
}) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    const params = new URLSearchParams();
    if (moduleId) params.set('module', moduleId);
    if (documentId) params.set('document', documentId);
    const queryString = params.toString();
    navigate(queryString ? `${path}?${queryString}` : path);
  };

  const actions = [
    {
      id: 'summary',
      label: 'AI Summary',
      shortLabel: 'Summary',
      icon: Sparkles,
      path: '/summaries',
      title: 'Synthesize or view high-yield lecture summary'
    },
    {
      id: 'assistant',
      label: 'Ask AI',
      shortLabel: 'Ask AI',
      icon: Bot,
      path: '/assistant',
      title: 'Ask questions grounded in this lecture'
    },
    {
      id: 'questions',
      label: 'Questions',
      shortLabel: 'Questions',
      icon: HelpCircle,
      path: '/questions',
      title: 'Practice exam questions from this lecture'
    },
    {
      id: 'quiz',
      label: 'Quiz',
      shortLabel: 'Quiz',
      icon: Award,
      path: '/quizzes',
      title: 'Launch a timed practice test'
    },
    {
      id: 'search',
      label: 'Search',
      shortLabel: 'Search',
      icon: Search,
      path: '/search',
      title: 'Search dense vector chunks from this material'
    }
  ];

  const displayedActions = variant === 'compact' ? actions.filter((a) => a.id !== 'search') : actions;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
        {displayedActions.map((act) => {
          const Icon = act.icon;
          return (
            <Button
              key={act.id}
              variant="outline"
              size="xs"
              icon={Icon}
              onClick={() => handleNavigate(act.path)}
              title={act.title}
              className="hover:border-indigo-500/50 hover:text-indigo-400 transition"
            >
              <span>{act.shortLabel}</span>
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-5 gap-2 ${className}`}>
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            type="button"
            onClick={() => handleNavigate(act.path)}
            title={act.title}
            className="p-3 rounded-xl card-base border border-subtle hover:border-indigo-500/50 hover:bg-subtle/50 transition flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-heading group-hover:text-indigo-400 transition">
              {act.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default StudyToolbar;

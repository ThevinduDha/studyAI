import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  GraduationCap,
  Brain
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

export default function DashboardHero({ user, moduleCount = 0, quizCount = 0, accuracy = 0 }) {
  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = user?.name ? user.name.split(' ')[0] : 'Student';

  return (
    <div className="relative overflow-hidden rounded-3xl card-base border border-subtle p-6 sm:p-8 lg:p-10 shadow-sm animate-fade-in">
      {/* Decorative ambient gradients */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          {/* Status badge pill */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="indigo" size="sm">
              <Sparkles className="h-3 w-3 mr-1 inline" />
              AI Learning Platform
            </Badge>
            <span className="text-xs text-muted">
              {moduleCount > 0 ? (
                <span>
                  Enrolled in <strong className="text-heading font-medium">{moduleCount}</strong> {moduleCount === 1 ? 'module' : 'modules'}
                </span>
              ) : (
                'Ready to begin'
              )}
            </span>
            {quizCount > 0 && (
              <>
                <span className="text-muted text-xs">&bull;</span>
                <span className="text-xs text-muted">
                  <strong className="text-heading font-medium">{quizCount}</strong> {quizCount === 1 ? 'quiz' : 'quizzes'} completed
                </span>
              </>
            )}
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-heading">
            {greeting}, <span className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 bg-clip-text text-transparent">{displayName}</span> 👋
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Welcome to your intelligent study hub. Review lecture materials, practice exam-focused questions, or ask the AI assistant questions grounded in your course documents.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link to="/assistant">
            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              className="shadow-md shadow-indigo-600/20"
            >
              Ask AI Assistant
            </Button>
          </Link>

          <Link to="/quizzes">
            <Button
              variant="outline"
              size="md"
              icon={Award}
            >
              Practice Quiz
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

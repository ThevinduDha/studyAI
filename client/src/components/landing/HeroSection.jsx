import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';
import HeroStudyMockup from './HeroStudyMockup.jsx';

export default function HeroSection() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleExploreClick = (e) => {
    e.preventDefault();
    const target = document.querySelector('#how-it-works');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[850px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/15 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Value Proposition & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 light:bg-indigo-50 light:text-indigo-700 text-xs font-semibold animate-fade-in shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Generation AI Study Companion</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white light:text-slate-900 leading-tight">
              Study Smarter.{' '}
              <span className="block sm:inline bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 light:from-indigo-600 light:via-purple-600 light:to-cyan-600 bg-clip-text text-transparent">
                Understand Faster.
              </span>
            </h1>

            {/* Supporting Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 light:text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              StudyAI transforms your lecture materials into intelligent summaries, AI-powered explanations, exam questions, quizzes, and personalized learning insights.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              {isAuthenticated ? (
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                  className="w-full sm:w-auto shadow-lg shadow-indigo-600/30 text-sm font-bold"
                >
                  {isAdmin ? 'Open Admin Portal' : 'Open Dashboard'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto shadow-lg shadow-indigo-600/30 text-sm font-bold"
                >
                  Start Learning Free
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                onClick={handleExploreClick}
                className="w-full sm:w-auto text-sm font-semibold hover:border-indigo-500/50"
              >
                Explore StudyAI
              </Button>
            </div>

            {/* Trust and Feature Bullets */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-5 text-xs text-slate-400 light:text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Grounded in lectures
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                Direct citations
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-purple-400" />
                Real exam practice
              </span>
            </div>
          </div>

          {/* Right Column: Hero Workspace Mockup */}
          <div className="lg:col-span-6 animate-slide-up">
            <HeroStudyMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  BarChart2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle.jsx';

/**
 * AuthLayout
 * Premium split-screen layout for StudyAI authentication (Login & Registration).
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  mode = 'login' // 'login' | 'register'
}) {
  const valueProps = [
    {
      icon: BookOpen,
      title: 'Course-Grounded AI',
      desc: 'Synthesize summaries and ask questions cited directly from your university slides.'
    },
    {
      icon: Award,
      title: 'Adaptive Exam Practice',
      desc: 'Test your knowledge with scenario questions and instant model explanations.'
    },
    {
      icon: BarChart2,
      title: 'Performance Intelligence',
      desc: 'Identify weak topics and optimize your study sessions with data-driven analytics.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 light:bg-slate-50 light:text-slate-900 flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-200 relative overflow-hidden">
      {/* Ambient background glows */}
      <div
        className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Bar with Brand & Theme Toggle */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white light:text-slate-900 group-hover:text-indigo-400 transition">
              StudyAI
            </span>
            <span className="ml-2 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 light:bg-indigo-50 light:text-indigo-700">
              Academic Platform
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/system-status"
            className="text-xs text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 hidden sm:inline transition"
          >
            System Status
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area: Responsive Split Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 flex items-center justify-center z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          {/* Left / Branding Hero Column (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-4">
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full card-base border border-indigo-500/30 text-xs text-indigo-400 font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-Generation Academic Learning System</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white light:text-slate-900 leading-[1.15]">
                Your Intelligent <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Academic Study Workspace
                </span>
              </h1>
              <p className="text-sm text-slate-400 light:text-slate-600 max-w-md leading-relaxed">
                Transform university course literature into high-yield summaries, grounded AI discussions, exam-grade questions, and continuous performance intelligence.
              </p>
            </div>

            {/* Value Proposition Cards */}
            <div className="space-y-3.5">
              {valueProps.map((vp, idx) => {
                const Icon = vp.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl card-base border border-subtle flex items-start gap-3.5 hover:border-indigo-500/30 transition group"
                  >
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition shrink-0 mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-heading group-hover:text-indigo-400 transition">
                        {vp.title}
                      </h3>
                      <p className="text-[11px] text-muted leading-relaxed">
                        {vp.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Academic Guarantee Badge */}
            <div className="flex items-center gap-2 text-xs text-muted pt-2 border-t border-subtle">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Grounded in university course documents &bull; Zero external hallucinations</span>
            </div>
          </div>

          {/* Right / Form Column */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center w-full">
            <div className="max-w-md w-full space-y-6 animate-fade-in">
              {/* Mobile Header Branding */}
              <div className="text-center lg:hidden space-y-2 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/25">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-heading">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-muted max-w-xs mx-auto">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Form Card Container */}
              <div className="card-base p-6 sm:p-8 rounded-3xl border border-subtle shadow-xl space-y-6">
                <div className="hidden lg:block space-y-1 pb-1 border-b border-subtle">
                  <h2 className="text-xl font-bold text-heading">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-muted">
                      {subtitle}
                    </p>
                  )}
                </div>

                {children}
              </div>

              {/* Security & Platform Notice */}
              <p className="text-center text-[11px] text-muted">
                Protected by university SSO &bull; Strict academic integrity enforced
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-slate-800/60 light:border-slate-200 text-center text-xs text-slate-500 light:text-slate-400 z-10">
        StudyAI &bull; Modern AI-Powered University Learning Platform
      </footer>
    </div>
  );
}

export default AuthLayout;

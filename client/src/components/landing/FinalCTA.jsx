import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  LayoutDashboard,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';

export default function FinalCTA() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-slate-900/60 light:from-indigo-50 light:via-purple-50 light:to-slate-100 border border-indigo-500/30 light:border-indigo-200 shadow-2xl shadow-black/40 overflow-hidden text-center space-y-6">
          {/* Ambient center blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-500/15 blur-[100px] pointer-events-none -z-0 rounded-full" />

          {/* Badge */}
          <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 light:bg-indigo-50 light:text-indigo-700 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ready for Exam Success?</span>
          </div>

          {/* Headline */}
          <h2 className="relative z-10 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white light:text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">
            Your smarter study journey starts here.
          </h2>

          {/* Subtext */}
          <p className="relative z-10 text-sm sm:text-base md:text-lg text-slate-300 light:text-slate-600 max-w-xl mx-auto leading-relaxed">
            Turn your lectures into understanding, practice, and progress. Join students studying smarter with grounded AI.
          </p>

          {/* CTA Buttons */}
          <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-sm mx-auto">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="lg"
                icon={isAdmin ? Shield : LayoutDashboard}
                onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                className="w-full justify-center shadow-lg shadow-indigo-600/30 text-sm font-bold"
              >
                {isAdmin ? 'Open Admin Portal' : 'Open Dashboard'}
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  onClick={() => navigate('/register')}
                  className="w-full justify-center shadow-lg shadow-indigo-600/30 text-sm font-bold"
                >
                  Get Started Free
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="w-full justify-center text-sm font-semibold"
                >
                  Log In
                </Button>
              </>
            )}
          </div>

          {/* Footer reassuring note */}
          <div className="relative z-10 pt-4 flex items-center justify-center gap-6 text-xs text-slate-400 light:text-slate-500 flex-wrap">
            <span>✓ Free university access</span>
            <span>✓ Grounded in lecture materials</span>
            <span>✓ Instant setup</span>
          </div>
        </div>
      </div>
    </section>
  );
}

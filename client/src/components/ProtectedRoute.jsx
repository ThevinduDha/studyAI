import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { GraduationCap, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import AppShell from '../layouts/AppShell.jsx';
import { Button } from './ui/Button.jsx';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Polished Authentication Workspace Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 light:bg-slate-50 light:text-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-200">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center animate-fade-in">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 animate-pulse">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-md -z-10 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-heading">
              StudyAI Academic Workspace
            </h2>
            <p className="text-xs text-muted flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              <span>Verifying authentication session...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated user to Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Access Restricted for non-admins on adminOnly routes
  if (adminOnly && !isAdmin) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto my-20 p-4 animate-fade-in">
          <Card className="p-8 text-center space-y-4 border border-rose-500/30 shadow-xl">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-heading">Access Restricted</h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                This administrative console requires verified staff privileges. Your current account role is{' '}
                <Badge variant="emerald" size="xs" className="uppercase font-semibold">
                  {user?.role || 'student'}
                </Badge>
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate('/dashboard')}
              >
                Return to Student Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}

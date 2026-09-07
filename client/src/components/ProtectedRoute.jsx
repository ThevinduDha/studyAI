import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader2, ShieldAlert } from 'lucide-react';
import AppShell from '../layouts/AppShell.jsx';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] light:bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
        <span className="text-xs font-medium">Verifying authentication session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto my-20 p-6 rounded-2xl border border-rose-900/40 bg-[#0e1526] text-center light:bg-white light:border-rose-200">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-white light:text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-xs text-slate-400 light:text-slate-600 mb-6 leading-relaxed">
            This area requires administrative privileges. Your current account role is{' '}
            <span className="font-semibold text-emerald-400 uppercase">{user?.role}</span>.
          </p>
          <Navigate to="/modules" replace />
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}

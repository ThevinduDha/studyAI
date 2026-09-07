import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LogOut,
  Shield,
  BookOpen,
  Activity,
  User,
  Search,
  Sparkles,
  FileText,
  HelpCircle,
  Award,
  BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur sticky top-0 z-50 light:bg-white/90 light:border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-300 transition light:text-slate-900 light:group-hover:text-indigo-600">
                StudyAI
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 light:bg-indigo-50 light:text-indigo-700">
                SaaS Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links for Authenticated Users */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                to="/modules"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive('/modules')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 light:bg-indigo-50 light:text-indigo-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Modules
              </Link>

              <Link
                to="/assistant"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive('/assistant')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 light:bg-indigo-50 light:text-indigo-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Assistant
              </Link>

              <Link
                to="/quizzes"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive('/quizzes')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 light:bg-indigo-50 light:text-indigo-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
                }`}
              >
                <Award className="h-3.5 w-3.5 text-indigo-400" />
                Quizzes
              </Link>

              <Link
                to="/analytics"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive('/analytics')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 light:bg-indigo-50 light:text-indigo-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5 text-indigo-400" />
                Analytics
              </Link>
            </nav>
          )}
        </div>

        {/* Right action area */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              {/* User badge */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs light:bg-slate-100 light:border-slate-200">
                <div className="h-6 w-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block">
                  <span className="font-medium text-slate-200 light:text-slate-800">{user?.name}</span>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                    isAdmin
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 light:bg-purple-100 light:text-purple-700'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 light:bg-emerald-100 light:text-emerald-700'
                  }`}
                >
                  {user?.role}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 border border-slate-700/80 hover:border-rose-900/50 light:bg-slate-100 light:text-slate-700 light:border-slate-200 light:hover:bg-rose-50 light:hover:text-rose-600 transition cursor-pointer"
                title="Log out of account"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/system-status"
                className="text-xs text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 px-2 py-1"
              >
                Status
              </Link>
              <Link
                to="/login"
                className="text-xs font-medium px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700 light:text-slate-700 light:border-slate-300 light:hover:bg-slate-100 transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white transition shadow-sm shadow-indigo-600/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

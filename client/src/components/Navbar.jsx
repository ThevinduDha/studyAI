import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Shield, BookOpen, Layers, Activity, User, Search, Sparkles, FileText, HelpCircle, Award, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

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
    <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:bg-indigo-500 transition">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight text-white group-hover:text-indigo-300 transition">
                StudyAI
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-indigo-500/30">
                Phase 11
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/assistant"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive('/assistant')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Study Assistant
              </Link>

              <Link
                to="/summaries"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive('/summaries')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-indigo-400" />
                Lecture Summaries
              </Link>

              <Link
                to="/questions"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive('/questions')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                Exam Questions
              </Link>

              <Link
                to="/quizzes"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive('/quizzes') || isActive('/quiz-history')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Award className="h-3.5 w-3.5 text-indigo-400" />
                AI Quiz
              </Link>

              <Link
                to="/analytics"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive('/analytics')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5 text-indigo-400" />
                Analytics
              </Link>

              <Link
                to="/modules"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive('/modules')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Course Modules
              </Link>

              <Link
                to="/search"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive('/search')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Search className="h-3.5 w-3.5" />
                Knowledge Search
              </Link>


              {isAdmin && (
                <Link
                  to="/admin/modules"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    isActive('/admin/modules')
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin Management
                </Link>
              )}

              <Link
                to="/system-status"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive('/system-status')
                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                System Status
              </Link>
            </nav>
          )}
        </div>

        {/* Right action area */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* User badge */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="hidden sm:block">
                  <span className="font-medium text-slate-200">{user?.name}</span>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                    isAdmin
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {user?.role}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-red-950/40 hover:text-red-300 text-slate-300 border border-slate-700/80 hover:border-red-900/50 transition cursor-pointer"
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
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 mr-1"
              >
                Status
              </Link>
              <Link
                to="/login"
                className="text-xs font-medium px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700 transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/20"
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

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  Award,
  BarChart2,
  Search,
  Shield,
  Activity,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function AppShell({ children }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('studyai-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('studyai-sidebar-collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/quizzes') {
      return location.pathname.startsWith('/quizzes') || location.pathname.startsWith('/quiz-results');
    }
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  // Grouped Navigation Structure
  const navSections = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Learning',
      items: [
        { label: 'Course Modules', path: '/modules', icon: BookOpen },
        { label: 'Study Assistant', path: '/assistant', icon: Sparkles },
        { label: 'Lecture Summaries', path: '/summaries', icon: FileText }
      ]
    },
    {
      title: 'Practice & Testing',
      items: [
        { label: 'Exam Questions', path: '/questions', icon: HelpCircle },
        { label: 'AI Quiz', path: '/quizzes', icon: Award },
        { label: 'Quiz History', path: '/quiz-history', icon: Clock }
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { label: 'Analytics', path: '/analytics', icon: BarChart2, badge: 'New' },
        { label: 'Knowledge Search', path: '/search', icon: Search }
      ]
    }
  ];

  // Admin Section
  if (isAdmin) {
    navSections.push({
      title: 'Management',
      items: [
        { label: 'Module Admin', path: '/admin/modules', icon: Shield }
      ]
    });
  }

  // System Section
  navSections.push({
    title: 'System',
    items: [
      { label: 'System Status', path: '/system-status', icon: Activity }
    ]
  });

  // Determine current page title for breadcrumbs
  const getCurrentPageTitle = () => {
    for (const section of navSections) {
      for (const item of section.items) {
        if (isActive(item.path)) return { section: section.title, title: item.label };
      }
    }
    return { section: 'Platform', title: 'StudyAI' };
  };

  const currentNav = getCurrentPageTitle();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 light:bg-slate-50 light:text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0e1526] border-r border-slate-800 p-5 flex flex-col justify-between transform transition-transform duration-250 ease-out lg:hidden light:bg-white light:border-slate-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 light:border-slate-200">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white light:text-slate-900">
                  StudyAI
                </span>
                <span className="block text-[10px] text-slate-400 light:text-slate-500">
                  University Learning Platform
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 light:hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-6 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 light:text-slate-500 px-3 mb-2">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          active
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Footer in Mobile Drawer */}
        <div className="pt-4 border-t border-slate-800/80 light:border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-left">
              <span className="block text-xs font-semibold text-white light:text-slate-900 truncate max-w-[110px]">
                {user?.name || 'Student'}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">{user?.role}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 light:hover:bg-rose-50 transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Layout Container */}
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden lg:flex flex-col justify-between border-r border-slate-800/80 bg-[#0e1526]/95 backdrop-blur sticky top-0 h-screen z-40 transition-all duration-250 ease-in-out light:bg-white light:border-slate-200 ${
            collapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Top Section */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Sidebar Brand Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 light:border-slate-200">
              <Link to="/" className="flex items-center gap-3 overflow-hidden group">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0 group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-5 w-5" />
                </div>
                {!collapsed && (
                  <div className="overflow-hidden">
                    <span className="font-bold text-base tracking-tight text-white light:text-slate-900 block truncate">
                      StudyAI
                    </span>
                    <span className="block text-[10px] text-slate-400 light:text-slate-500 truncate">
                      SaaS Learning Platform
                    </span>
                  </div>
                )}
              </Link>

              {/* Collapse Toggle */}
              <button
                onClick={toggleCollapsed}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 light:hover:bg-slate-100 light:hover:text-slate-700 transition cursor-pointer"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {navSections.map((section) => (
                <div key={section.title}>
                  {!collapsed && (
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 light:text-slate-500 px-3 mb-2">
                      {section.title}
                    </p>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(item.path);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={collapsed ? item.label : undefined}
                          className={`flex items-center ${
                            collapsed ? 'justify-center px-2.5 py-2.5' : 'justify-between px-3 py-2'
                          } rounded-xl text-xs font-medium transition-all group relative ${
                            active
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Icon
                              className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                                active ? 'text-white' : 'text-slate-400'
                              }`}
                            />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </div>
                          {!collapsed && item.badge && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                              {item.badge}
                            </span>
                          )}

                          {/* Hover Tooltip when collapsed */}
                          {collapsed && (
                            <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50 light:bg-white light:border-slate-300 light:text-slate-900">
                              {item.label}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer User Card */}
          <div className="p-3 border-t border-slate-800/80 light:border-slate-200">
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 light:bg-slate-100 light:border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-8 w-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                {!collapsed && (
                  <div className="overflow-hidden text-left">
                    <span className="block text-xs font-semibold text-white light:text-slate-900 truncate">
                      {user?.name || 'Student'}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize truncate block">
                      {user?.role}
                    </span>
                  </div>
                )}
              </div>

              {!collapsed && (
                <div className="flex items-center gap-1 shrink-0">
                  <ThemeToggle />
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 light:hover:bg-rose-50 transition cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar Header */}
          <header className="h-16 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 light:bg-white/80 light:border-slate-200 transition-colors">
            {/* Left: Mobile trigger & Breadcrumbs */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 light:hover:bg-slate-100 light:hover:text-slate-900 lg:hidden cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-slate-500 hidden sm:inline">{currentNav.section}</span>
                <span className="text-slate-600 hidden sm:inline">/</span>
                <span className="font-semibold text-white light:text-slate-900">{currentNav.title}</span>
              </div>
            </div>

            {/* Right: Quick actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle showLabel={false} />

              {/* User badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800 light:border-slate-200">
                <div className="h-7 w-7 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-medium text-slate-200 light:text-slate-800 hidden md:inline">
                  {user?.name?.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 light:hover:bg-rose-50 transition cursor-pointer lg:hidden"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Viewport */}
          <main className="flex-1 animate-fade-in">
            {children}
          </main>

          {/* SaaS Footer */}
          <footer className="border-t border-slate-800/60 light:border-slate-200 py-6 px-4 sm:px-8 text-center text-xs text-slate-500 light:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>StudyAI &bull; Modern AI-Powered University Learning Platform</span>
            <div className="flex items-center gap-4 text-[11px]">
              <Link to="/system-status" className="hover:text-slate-300 light:hover:text-slate-600 transition">
                System Health
              </Link>
              <Link to="/modules" className="hover:text-slate-300 light:hover:text-slate-600 transition">
                Modules
              </Link>
              <Link to="/analytics" className="hover:text-slate-300 light:hover:text-slate-600 transition">
                Analytics
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

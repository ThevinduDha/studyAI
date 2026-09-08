import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from '../ThemeToggle.jsx';
import { Button } from '../ui/Button.jsx';

export default function LandingNavbar() {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'AI Tutor', href: '#ai-tutor' },
    { label: 'Analytics', href: '#analytics' },
  ];

  const handleScrollTo = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-[#090d16]/85 light:bg-white/85 backdrop-blur-md border-b border-slate-800/80 light:border-slate-200/80 shadow-xs'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-indigo-500/20 blur-sm -z-10 group-hover:bg-indigo-500/35 transition-colors" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-300 transition-colors light:text-slate-900 light:group-hover:text-indigo-600">
              StudyAI
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 light:bg-indigo-50 light:text-indigo-700">
              AI Learning
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleScrollTo(e, link.href)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/50 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA / Controls */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <Button
              variant="primary"
              size="sm"
              icon={isAdmin ? Shield : LayoutDashboard}
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              className="shadow-sm shadow-indigo-600/25"
            >
              {isAdmin ? 'Admin Portal' : 'Dashboard'}
            </Button>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="text-xs font-semibold px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition light:text-slate-700 light:hover:text-slate-900 light:hover:bg-slate-100"
              >
                Log In
              </Link>
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate('/register')}
                className="shadow-sm shadow-indigo-600/25"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white light:bg-slate-100 light:border-slate-200 light:text-slate-700 transition"
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 bg-[#090d16]/95 light:bg-white/95 backdrop-blur-xl border-b border-slate-800 light:border-slate-200 animate-fade-in space-y-4">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:text-indigo-400 hover:bg-slate-800/40 rounded-xl light:text-slate-800 light:hover:bg-slate-100 transition"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-800 light:border-slate-200 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="md"
                icon={isAdmin ? Shield : LayoutDashboard}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(isAdmin ? '/admin' : '/dashboard');
                }}
                className="w-full justify-center"
              >
                {isAdmin ? 'Open Admin Portal' : 'Open Dashboard'}
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-semibold text-slate-200 hover:text-white rounded-xl bg-slate-800/50 light:bg-slate-100 light:text-slate-800 transition"
                >
                  Log In
                </Link>
                <Button
                  variant="primary"
                  size="md"
                  icon={ArrowRight}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                  className="w-full justify-center"
                >
                  Start Learning Free
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

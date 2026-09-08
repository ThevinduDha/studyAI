import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function LandingFooter() {
  const scrollToSection = (e, id) => {
    e.preventDefault();
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-slate-800/80 light:border-slate-200 bg-slate-950/60 light:bg-slate-50/80 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col (2 cols on md) */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg text-white light:text-slate-900 tracking-tight">
                StudyAI
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 max-w-sm leading-relaxed">
              AI-powered learning for smarter studying. Transform your lecture materials into intelligent summaries, exam practice, and progress insights.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white light:text-slate-900 uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 light:text-slate-600">
              <li>
                <a
                  href="#features"
                  onClick={(e) => scrollToSection(e, '#features')}
                  className="hover:text-indigo-400 light:hover:text-indigo-600 transition"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => scrollToSection(e, '#how-it-works')}
                  className="hover:text-indigo-400 light:hover:text-indigo-600 transition"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#ai-tutor"
                  onClick={(e) => scrollToSection(e, '#ai-tutor')}
                  className="hover:text-indigo-400 light:hover:text-indigo-600 transition"
                >
                  AI Tutor
                </a>
              </li>
              <li>
                <a
                  href="#analytics"
                  onClick={(e) => scrollToSection(e, '#analytics')}
                  className="hover:text-indigo-400 light:hover:text-indigo-600 transition"
                >
                  Analytics
                </a>
              </li>
            </ul>
          </div>

          {/* Account & Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white light:text-slate-900 uppercase tracking-wider">
              Account
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 light:text-slate-600">
              <li>
                <Link to="/login" className="hover:text-indigo-400 light:hover:text-indigo-600 transition">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-indigo-400 light:hover:text-indigo-600 transition">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/system-status" className="hover:text-indigo-400 light:hover:text-indigo-600 transition">
                  System Status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 light:border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 light:text-slate-400 text-center sm:text-left">
          <p>&copy; {new Date().getFullYear()} StudyAI. All rights reserved.</p>
          <p>StudyAI &bull; AI-Powered University Learning Platform</p>
        </div>
      </div>
    </footer>
  );
}

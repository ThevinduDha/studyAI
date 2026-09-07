import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export function ThemeToggle({ className = '', showLabel = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 p-2 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300 hover:text-white light:bg-slate-100 light:border-slate-200 light:text-slate-700 light:hover:bg-slate-200/80 light:hover:text-slate-900 transition cursor-pointer select-none ${className}`}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
    >
      <div className="relative h-4 w-4">
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-600 transition-transform duration-200 -rotate-12" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-medium capitalize">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;

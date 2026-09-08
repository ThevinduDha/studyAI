import { useState } from 'react';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';

/**
 * Calculate local visual password strength without backend impact
 */
const evaluateStrength = (password) => {
  if (!password) return { score: 0, label: '', bars: 0, color: '' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', bars: 1, color: 'bg-rose-500' };
  if (score <= 3) return { score: 2, label: 'Good', bars: 2, color: 'bg-amber-400' };
  return { score: 3, label: 'Strong', bars: 3, color: 'bg-emerald-500' };
};

/**
 * PasswordInput
 * Accessible password field with show/hide toggle and optional strength indicator.
 */
export function PasswordInput({
  id = 'password',
  label = 'Password',
  value,
  onChange,
  placeholder = '••••••••',
  required = true,
  minLength = 6,
  autoComplete = 'current-password',
  showStrength = false,
  error = null,
  className = ''
}) {
  const [showPassword, setShowPassword] = useState(false);

  const strength = showStrength ? evaluateStrength(value) : null;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label htmlFor={id} className="block text-xs font-semibold text-heading">
            {label}
          </label>
          {showStrength && value && (
            <span className="text-[11px] font-medium text-muted">
              Strength: <strong className={strength.color.replace('bg-', 'text-')}>{strength.label}</strong>
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
          <Lock className="h-4 w-4" />
        </div>

        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`w-full pl-10 pr-11 py-2.5 rounded-xl input-base text-xs sm:text-sm font-sans tracking-normal transition ${
            error ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20' : ''
          }`}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-heading transition cursor-pointer"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Visual Strength Meter (for Registration) */}
      {showStrength && value && (
        <div className="space-y-1 pt-1 animate-fade-in">
          <div className="grid grid-cols-3 gap-1.5 h-1.5">
            <div className={`h-full rounded-full transition-all duration-300 ${strength.bars >= 1 ? strength.color : 'bg-subtle'}`} />
            <div className={`h-full rounded-full transition-all duration-300 ${strength.bars >= 2 ? strength.color : 'bg-subtle'}`} />
            <div className={`h-full rounded-full transition-all duration-300 ${strength.bars >= 3 ? strength.color : 'bg-subtle'}`} />
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted pt-0.5">
            <span className={`flex items-center gap-1 ${value.length >= 6 ? 'text-emerald-400' : ''}`}>
              {value.length >= 6 ? <Check className="h-3 w-3" /> : <span className="w-3" />}
              6+ characters
            </span>
            <span className={`flex items-center gap-1 ${/[0-9]/.test(value) ? 'text-emerald-400' : ''}`}>
              {/[0-9]/.test(value) ? <Check className="h-3 w-3" /> : <span className="w-3" />}
              Contains number
            </span>
            <span className={`flex items-center gap-1 ${/[A-Z]/.test(value) ? 'text-emerald-400' : ''}`}>
              {/[A-Z]/.test(value) ? <Check className="h-3 w-3" /> : <span className="w-3" />}
              Uppercase letter
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PasswordInput;

import { AlertCircle, X } from 'lucide-react';

/**
 * Sanitize error message to prevent raw network or database errors from leaking to students
 */
const sanitizeAuthError = (err) => {
  if (!err) return null;
  const str = typeof err === 'string' ? err : err.message || '';

  if (str.includes('ECONNREFUSED') || str.includes('Network Error') || str.includes('Failed to fetch')) {
    return 'Unable to connect to the StudyAI server. Please verify your connection or try again shortly.';
  }
  if (str.includes('jwt') || str.includes('token') || str.includes('Token')) {
    return 'Your authentication session is invalid or has expired. Please sign in again.';
  }
  return str;
};

/**
 * AuthError
 * Accessible, semantic error banner for authentication and registration pages.
 */
export function AuthError({ error, onDismiss, className = '' }) {
  const message = sanitizeAuthError(error);
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center justify-between gap-3 animate-fade-in ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
        <span className="font-medium leading-relaxed">{message}</span>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="p-1 text-rose-400 hover:text-rose-300 transition cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default AuthError;

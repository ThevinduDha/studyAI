import { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    rightElement,
    className = '',
    id,
    disabled = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`block w-full text-xs sm:text-sm bg-slate-900/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 light:bg-white light:border-slate-300 light:text-slate-900 light:placeholder-slate-400 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            Icon ? 'pl-9.5' : 'pl-3.5'
          } ${rightElement ? 'pr-10' : 'pr-3.5'} ${
            error ? 'border-rose-500 focus:ring-rose-500/40 focus:border-rose-500' : ''
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-400 light:text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500 light:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;

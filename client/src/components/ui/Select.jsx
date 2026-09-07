import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = '',
    id,
    disabled = false,
    options = [],
    placeholder = 'Select an option...',
    children,
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 light:text-slate-400 z-10">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`block w-full text-xs sm:text-sm bg-slate-900/90 border border-slate-800 rounded-xl text-white light:bg-white light:border-slate-300 light:text-slate-900 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            Icon ? 'pl-9.5' : 'pl-3.5'
          } pr-9 ${
            error ? 'border-rose-500 focus:ring-rose-500/40 focus:border-rose-500' : ''
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="" className="bg-slate-900 text-slate-400 light:bg-white light:text-slate-500">{placeholder}</option>}
          {children
            ? children
            : options.map((opt) => {
                const value = typeof opt === 'object' ? opt.value : opt;
                const label = typeof opt === 'object' ? opt.label : opt;
                return (
                  <option
                    key={value}
                    value={value}
                    className="bg-slate-900 text-white light:bg-white light:text-slate-900"
                  >
                    {label}
                  </option>
                );
              })}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500 light:text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-400 light:text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500 light:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:
    'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-sm shadow-indigo-500/25 border border-indigo-400/20',
  secondary:
    'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 light:bg-white light:hover:bg-slate-100 light:text-slate-800 light:border-slate-200',
  outline:
    'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 light:text-slate-700 light:border-slate-300 light:hover:bg-slate-100',
  ghost:
    'bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:bg-slate-100',
  danger:
    'bg-rose-600/90 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/20 border border-rose-500/30',
  dangerOutline:
    'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 hover:border-rose-700',
  success:
    'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 border border-emerald-500/30'
};

const sizeClasses = {
  xs: 'px-2 py-1 text-[11px] rounded-md gap-1',
  sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-3.5 py-2 text-xs sm:text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-sm sm:text-base rounded-xl gap-2.5'
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    rightIcon: RightIcon,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;
  const variantStyle = variantClasses[variant] || variantClasses.primary;
  const sizeStyle = sizeClasses[size] || sizeClasses.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-1 focus:ring-offset-[#090d16] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      {children}
      {!loading && RightIcon ? <RightIcon className="h-4 w-4 shrink-0" /> : null}
    </button>
  );
});

export default Button;

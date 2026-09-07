const variantClasses = {
  default:
    'bg-slate-800 text-slate-300 border border-slate-700/60 light:bg-slate-100 light:text-slate-700 light:border-slate-200',
  indigo:
    'bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 light:bg-indigo-50 light:text-indigo-700 light:border-indigo-200',
  emerald:
    'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 light:bg-emerald-50 light:text-emerald-700 light:border-emerald-200',
  amber:
    'bg-amber-950/60 text-amber-300 border border-amber-500/30 light:bg-amber-50 light:text-amber-700 light:border-amber-200',
  rose:
    'bg-rose-950/60 text-rose-300 border border-rose-500/30 light:bg-rose-50 light:text-rose-700 light:border-rose-200',
  purple:
    'bg-purple-950/60 text-purple-300 border border-purple-500/30 light:bg-purple-50 light:text-purple-700 light:border-purple-200',
  cyan:
    'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 light:bg-cyan-50 light:text-cyan-700 light:border-cyan-200',
  outline:
    'bg-transparent text-slate-400 border border-slate-700/80 light:text-slate-600 light:border-slate-300'
};

const sizeClasses = {
  xs: 'text-[10px] font-semibold px-1.5 py-0.5 rounded',
  sm: 'text-xs font-medium px-2.5 py-0.5 rounded-full',
  md: 'text-xs font-medium px-3 py-1 rounded-full'
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  icon: Icon,
  className = '',
  ...props
}) {
  const variantStyle = variantClasses[variant] || variantClasses.default;
  const sizeStyle = sizeClasses[size] || sizeClasses.sm;

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-colors ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {children}
    </span>
  );
}

export default Badge;

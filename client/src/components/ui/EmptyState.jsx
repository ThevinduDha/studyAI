export function EmptyState({
  icon: Icon,
  title,
  description,
  badge,
  action,
  secondaryAction,
  className = ''
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-[#0e1526]/50 light:bg-slate-50 light:border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto flex flex-col items-center justify-center animate-fade-in ${className}`}
    >
      {Icon && (
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 shadow-inner shadow-indigo-500/10">
          <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>
      )}

      {badge && <div className="mb-2.5">{badge}</div>}

      <h3 className="text-lg sm:text-xl font-bold text-white light:text-slate-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export default EmptyState;

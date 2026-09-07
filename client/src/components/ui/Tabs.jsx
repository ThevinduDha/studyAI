export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'pills',
  className = ''
}) {
  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-6 border-b border-slate-800 light:border-slate-200 overflow-x-auto ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`pb-3 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-indigo-500 text-indigo-400 light:text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700 light:text-slate-600 light:hover:text-slate-900'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-300 light:bg-indigo-100 light:text-indigo-700'
                      : 'bg-slate-800 text-slate-400 light:bg-slate-200 light:text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default pills variant
  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800/80 light:bg-slate-100 light:border-slate-200 overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-200/60'
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-indigo-950/60 text-indigo-300'
                    : 'bg-slate-800 text-slate-400 light:bg-slate-200 light:text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;

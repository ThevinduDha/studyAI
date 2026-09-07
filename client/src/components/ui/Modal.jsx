import { useEffect } from 'react';
import { X } from 'lucide-react';

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl'
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
  className = ''
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyle = maxWidthClasses[maxWidth] || maxWidthClasses.lg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidthStyle} rounded-2xl border border-slate-800 bg-[#0e1526] text-white shadow-2xl z-10 animate-slide-up light:bg-white light:border-slate-200 light:text-slate-900 ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-slate-800/80 light:border-slate-100">
          <div>
            {title && (
              <h3 className="text-lg font-semibold tracking-tight text-white light:text-slate-900">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-xs sm:text-sm text-slate-400 light:text-slate-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 light:hover:bg-slate-100 light:hover:text-slate-700 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-6 pt-3 border-t border-slate-800/80 light:border-slate-100 bg-slate-950/40 light:bg-slate-50 rounded-b-2xl flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;

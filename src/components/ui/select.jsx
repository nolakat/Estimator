
export function Select({ children, value, onValueChange, ...props }) {
  return (
    <div className="relative" {...props}>
      {children}
    </div>
  );
}

export function SelectTrigger({ children, className = '', onClick, ...props }) {
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 ring-offset-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-slate-300 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder, children, ...props }) {
  return (
    <span className={children ? 'text-slate-800' : 'text-slate-400'} {...props}>
      {children || placeholder}
    </span>
  );
}

export function SelectContent({ children, isOpen, onClose, ...props }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop to catch clicks outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        className="absolute z-50 w-full mt-2 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-lg top-full ring-1 ring-slate-900/5"
        style={{
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
        {...props}
      >
        <div className="overflow-auto max-h-60 py-1">
          {children}
        </div>
      </div>
    </>
  );
}

export function SelectItem({ children, value, onClick, isSelected, ...props }) {
  return (
    <div
      className={`relative flex cursor-pointer select-none items-center px-4 py-2.5 text-sm outline-none transition-colors duration-150 ${
        isSelected
          ? 'bg-amber-50 text-amber-700 font-medium'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
      onClick={() => onClick?.(value)}
      {...props}
    >
      {children}
      {isSelected && (
        <svg className="w-4 h-4 ml-auto text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

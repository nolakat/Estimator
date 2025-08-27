
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
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
      <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder, children, ...props }) {
  return (
    <span {...props}>
      {children || placeholder}
    </span>
  );
}

export function SelectContent({ children, isOpen, onClose, ...props }) {
  if (!isOpen) return null;

  return (
    <div className="absolute z-50 w-full mt-1 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg top-full max-h-60" {...props}>
      {children}
      <div className="absolute inset-0 pointer-events-none" onClick={onClose}></div>
    </div>
  );
}

export function SelectItem({ children, value, onClick, ...props }) {
  return (
    <div
      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
      onClick={() => onClick?.(value)}
      {...props}
    >
      {children}
    </div>
  );
}

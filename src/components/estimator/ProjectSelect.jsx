import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, FolderOpen, Check } from 'lucide-react';

export function ProjectSelect({ value, onValueChange, projects }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedProject = projects.find(p => p.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative flex-1" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-800 transition-all duration-200 ${
          isOpen
            ? 'border-amber-500 ring-2 ring-amber-500/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <FolderOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className={selectedProject ? 'text-slate-800 font-medium' : 'text-slate-400'}>
            {selectedProject?.name || 'Select project'}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
          style={{
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="overflow-auto max-h-60 py-1">
            {projects.map((p) => {
              const isSelected = p.id === value;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onValueChange(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-150 ${
                    isSelected
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className={`flex-1 truncate ${isSelected ? 'font-medium' : ''}`}>
                    {p.name}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

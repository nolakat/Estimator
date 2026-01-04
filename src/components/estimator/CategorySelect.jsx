import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Package, Wrench, Users, MoreHorizontal } from 'lucide-react';

const categories = [
  { value: "materials", label: "Materials", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
  { value: "labor", label: "Labor", icon: Wrench, color: "text-amber-600", bg: "bg-amber-50" },
  { value: "subcontract", label: "Subcontract", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "text-slate-600", bg: "bg-slate-100" }
];

export function CategorySelect({ value, onValueChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedCategory = categories.find(c => c.value === value);

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

  const SelectedIcon = selectedCategory?.icon || Package;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-200 ${
          isOpen
            ? 'border-amber-500 ring-2 ring-amber-500/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <span className={`flex items-center justify-center w-5 h-5 rounded ${selectedCategory?.bg || 'bg-slate-100'}`}>
            <SelectedIcon className={`w-3 h-3 ${selectedCategory?.color || 'text-slate-500'}`} />
          </span>
          <span className="text-slate-800">
            {selectedCategory?.label || 'Select'}
          </span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
          style={{
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            minWidth: '140px'
          }}
        >
          <div className="py-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = cat.value === value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    onValueChange(cat.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-150 ${
                    isSelected
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`flex items-center justify-center w-5 h-5 rounded ${cat.bg}`}>
                    <Icon className={`w-3 h-3 ${cat.color}`} />
                  </span>
                  <span className={`flex-1 ${isSelected ? 'font-medium' : ''}`}>
                    {cat.label}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
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

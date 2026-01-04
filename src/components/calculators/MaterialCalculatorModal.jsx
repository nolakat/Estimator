import React, { useState, useEffect } from 'react';
import { X, Calculator, Grid3X3, Paintbrush, LayoutGrid } from 'lucide-react';
import { DrywallCalculator } from './DrywallCalculator';
import { PaintCalculator } from './PaintCalculator';
import { FlooringCalculator } from './FlooringCalculator';

const calculators = [
  { id: 'drywall', name: 'Drywall', icon: Grid3X3 },
  { id: 'paint', name: 'Paint', icon: Paintbrush },
  { id: 'flooring', name: 'Flooring', icon: LayoutGrid },
];

export function MaterialCalculatorModal({
  isOpen,
  onClose,
  sections,
  onAddItems,
}) {
  const [activeCalculator, setActiveCalculator] = useState('drywall');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItems = (items, sectionId) => {
    onAddItems(items, sectionId);
  };

  const ActiveIcon = calculators.find(c => c.id === activeCalculator)?.icon || Calculator;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none md:inset-8">
        <div
          className="relative w-full max-w-3xl max-h-full bg-white rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Material Calculators</h2>
                <p className="text-sm text-slate-500">Calculate materials and add to your estimate</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute p-2 transition-all duration-200 rounded-full top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            {calculators.map((calc) => {
              const Icon = calc.icon;
              const isActive = activeCalculator === calc.id;
              return (
                <button
                  key={calc.id}
                  onClick={() => setActiveCalculator(calc.id)}
                  className={`relative flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-amber-700 bg-white'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : ''}`} />
                  {calc.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calculator Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-white to-slate-50/50">
            {activeCalculator === 'drywall' && (
              <DrywallCalculator sections={sections} onAddItems={handleAddItems} />
            )}
            {activeCalculator === 'paint' && (
              <PaintCalculator sections={sections} onAddItems={handleAddItems} />
            )}
            {activeCalculator === 'flooring' && (
              <FlooringCalculator sections={sections} onAddItems={handleAddItems} />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50/80">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium transition-all duration-200 border rounded-xl text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

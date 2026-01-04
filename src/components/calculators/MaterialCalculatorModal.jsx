import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import { Button } from '../ui/button';
import { DrywallCalculator } from './DrywallCalculator';
import { PaintCalculator } from './PaintCalculator';
import { FlooringCalculator } from './FlooringCalculator';

const calculators = [
  { id: 'drywall', name: 'Drywall', icon: '🧱' },
  { id: 'paint', name: 'Paint', icon: '🎨' },
  { id: 'flooring', name: 'Flooring', icon: '🪵' },
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Material Calculators</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {calculators.map((calc) => (
            <button
              key={calc.id}
              onClick={() => setActiveCalculator(calc.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeCalculator === calc.id
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{calc.icon}</span>
              {calc.name}
            </button>
          ))}
        </div>

        {/* Calculator Content */}
        <div className="flex-1 p-6 overflow-y-auto">
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
        <div className="flex items-center justify-end p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

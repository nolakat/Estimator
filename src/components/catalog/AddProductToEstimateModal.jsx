import React, { useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { money } from '../../utils/estimator';

export function AddProductToEstimateModal({
  isOpen,
  onClose,
  product,
  sections,
  onConfirm,
}) {
  const [qty, setQty] = useState('1');
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setQty('1');
      setSelectedSection(sections[0]?.id || '');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, sections]);

  if (!isOpen || !product) return null;

  const quantity = parseFloat(qty) || 0;
  const lineTotal = quantity * (product.unitPrice || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quantity <= 0 || !selectedSection) return;
    onConfirm(product, quantity, selectedSection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-sm bg-white rounded-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Add to Estimate</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="font-medium text-gray-900">{product.name}</div>
            <div className="text-sm text-gray-600">
              {money(product.unitPrice)} per {product.unit}
            </div>
          </div>

          <div>
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              step="any"
              min="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="section">Add to Section</Label>
            <select
              id="section"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 text-right border-t bg-gray-50">
            <span className="text-gray-600">Line Total: </span>
            <span className="text-lg font-bold text-gray-900">{money(lineTotal)}</span>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={quantity <= 0}>
              Add to Estimate
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

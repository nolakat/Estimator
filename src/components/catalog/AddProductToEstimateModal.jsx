import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Package, Hash, Layers } from 'lucide-react';
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

  const inputClasses = "w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-slate-400";
  const labelClasses = "block mb-1.5 text-sm font-medium text-slate-700";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-[70] flex items-center justify-center pointer-events-none">
        <div
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                  Add to Estimate
                </h2>
                <p className="text-sm text-slate-500">
                  Choose quantity and destination
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute p-2 transition-all duration-200 rounded-full top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              {/* Product Info Card */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <Package className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-800 truncate">
                    {product.name}
                  </h3>
                  {product.brand && (
                    <span className="inline-flex px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-slate-200 text-slate-600">
                      {product.brand}
                    </span>
                  )}
                  <div className="mt-2 text-sm">
                    <span className="font-semibold text-amber-600">{money(product.unitPrice)}</span>
                    <span className="text-slate-400"> / {product.unit}</span>
                  </div>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label htmlFor="qty" className={labelClasses}>
                  <span className="inline-flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    Quantity
                  </span>
                </label>
                <input
                  id="qty"
                  type="number"
                  step="any"
                  min="0"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className={inputClasses}
                  autoFocus
                />
              </div>

              {/* Section Selector */}
              <div>
                <label htmlFor="section" className={labelClasses}>
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Add to Section
                  </span>
                </label>
                <select
                  id="section"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className={`${inputClasses} cursor-pointer`}
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Total */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-800">Line Total</span>
                  <span className="text-xl font-bold text-amber-700">{money(lineTotal)}</span>
                </div>
                <div className="mt-1 text-xs text-amber-600/70">
                  {quantity} {product.unit} x {money(product.unitPrice)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium transition-all duration-200 border rounded-xl text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={quantity <= 0}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Add to Estimate
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

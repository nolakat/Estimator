import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Package, DollarSign, Calendar, Link2 } from 'lucide-react';
import { PRODUCT_CATEGORIES, ITEM_CATEGORIES } from '../../constants/products';

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  product,
}) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [productCategory, setProductCategory] = useState('lumber');
  const [category, setCategory] = useState('materials');
  const [unit, setUnit] = useState('ea');
  const [unitPrice, setUnitPrice] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (product) {
        setName(product.name || '');
        setBrand(product.brand || '');
        setProductCategory(product.productCategory || 'lumber');
        setCategory(product.category || 'materials');
        setUnit(product.unit || 'ea');
        setUnitPrice(product.unitPrice?.toString() || '');
        setUrl(product.url || '');
        setNotes(product.notes || '');
      } else {
        setName('');
        setBrand('');
        setProductCategory('lumber');
        setCategory('materials');
        setUnit('ea');
        setUnitPrice('');
        setUrl('');
        setNotes('');
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...(product || {}),
      name: name.trim(),
      brand: brand.trim(),
      productCategory,
      category,
      unit,
      unitPrice: parseFloat(unitPrice) || 0,
      url: url.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  const inputClasses = "w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-slate-400";
  const labelClasses = "block mb-1.5 text-sm font-medium text-slate-700";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-[60] flex items-center justify-center pointer-events-none">
        <div
          className="relative w-full max-w-lg max-h-full bg-white rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg ${
                product
                  ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-500/25'
                  : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25'
              }`}>
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                  {product ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-sm text-slate-500">
                  {product ? 'Update product details' : 'Add a product to your catalog'}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Product Name */}
              <div>
                <label htmlFor="name" className={labelClasses}>
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., 4x8 Drywall Sheet 1/2 inch"
                  className={inputClasses}
                  autoFocus
                />
              </div>

              {/* Brand */}
              <div>
                <label htmlFor="brand" className={labelClasses}>
                  Brand <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  id="brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., USG, Behr, DeWalt"
                  className={inputClasses}
                />
              </div>

              {/* Categories Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="productCategory" className={labelClasses}>
                    Product Category
                  </label>
                  <select
                    id="productCategory"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className={`${inputClasses} cursor-pointer`}
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="category" className={labelClasses}>
                    Estimate Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`${inputClasses} cursor-pointer`}
                  >
                    {ITEM_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-100">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Pricing</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="unitPrice" className="block mb-1.5 text-sm font-medium text-amber-800">
                      Unit Price ($)
                    </label>
                    <input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-amber-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="unit" className="block mb-1.5 text-sm font-medium text-amber-800">
                      Unit
                    </label>
                    <input
                      id="unit"
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="ea, sq ft, gallon"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-amber-300"
                    />
                  </div>
                </div>
              </div>

              {/* URL */}
              <div>
                <label htmlFor="url" className={labelClasses}>
                  <span className="inline-flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    Product URL
                  </span>
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.homedepot.com/p/..."
                    className={`${inputClasses} flex-1`}
                  />
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-2.5 text-slate-500 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 hover:text-slate-700 transition-colors duration-150"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className={labelClasses}>
                  Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this product, such as specifications, where to find it, alternatives..."
                  rows={3}
                  className={`${inputClasses} resize-none`}
                />
              </div>

              {/* Timestamps (Edit mode only) */}
              {product && (product.createdAt || product.updatedAt) && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-500 space-y-1">
                    {product.createdAt && (
                      <div>Created: <span className="text-slate-600">{formatDate(product.createdAt)}</span></div>
                    )}
                    {product.updatedAt && (
                      <div>Last updated: <span className="text-slate-600">{formatDate(product.updatedAt)}</span></div>
                    )}
                  </div>
                </div>
              )}
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
                disabled={!name.trim()}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {product ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 4x8 Drywall Sheet"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="brand">Brand (optional)</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., USG, Behr, Home Depot"
            />
          </div>

          <div>
            <Label htmlFor="productCategory">Product Category</Label>
            <select
              id="productCategory"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="category">Estimate Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="ea, sq ft, gallon"
              />
            </div>
            <div>
              <Label htmlFor="unitPrice">Unit Price ($)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="url">Product URL (optional)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.homedepot.com/p/..."
                className="flex-1"
              />
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-3 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this product..."
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md min-h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {product && (product.createdAt || product.updatedAt) && (
            <div className="p-3 text-sm text-gray-500 rounded-lg bg-gray-50">
              {product.createdAt && (
                <div>Created: {formatDate(product.createdAt)}</div>
              )}
              {product.updatedAt && (
                <div>Last updated: {formatDate(product.updatedAt)}</div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {product ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Edit2, Trash2, ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { productService } from '../../services/productService';
import { PRODUCT_CATEGORIES } from '../../constants/products';
import { defaultProduct } from '../../constants/products';
import { money } from '../../utils/estimator';
import { ProductFormModal } from './ProductFormModal';
import { AddProductToEstimateModal } from './AddProductToEstimateModal';

export function ProductCatalogModal({
  isOpen,
  onClose,
  userId,
  sections,
  onAddToEstimate,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [addingProduct, setAddingProduct] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadProducts();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, userId]);

  const loadProducts = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await productService.getProducts(userId);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
    setLoading(false);
  };

  const handleSaveProduct = async (productData) => {
    try {
      const product = {
        ...defaultProduct(),
        ...productData,
        userId,
      };
      await productService.saveProduct(product);
      loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product from your catalog?')) return;
    try {
      await productService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productCategory?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || p.productCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Product Catalog</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 rounded-full hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-4 p-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <Button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>

          {/* Product List */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-blue-600" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                {products.length === 0 ? (
                  <div>
                    <p className="mb-2">No products in your catalog yet.</p>
                    <Button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} variant="outline">
                      Add Your First Product
                    </Button>
                  </div>
                ) : (
                  <p>No products match your search.</p>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredProducts.map((product) => {
                  const updatedDate = product.updatedAt
                    ? new Date(typeof product.updatedAt === 'number' ? product.updatedAt : product.updatedAt.toDate?.() || product.updatedAt)
                    : null;
                  return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {product.name}
                        {product.brand && (
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({product.brand})
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {PRODUCT_CATEGORIES.find((c) => c.value === product.productCategory)?.label || product.productCategory}
                        {' '}&bull;{' '}
                        {money(product.unitPrice)} / {product.unit}
                        {updatedDate && (
                          <>
                            {' '}&bull;{' '}
                            Updated {updatedDate.toLocaleDateString()}
                          </>
                        )}
                      </div>
                      {product.notes && (
                        <div className="mt-1 text-sm text-gray-400 truncate italic">
                          {product.notes.length > 60 ? product.notes.slice(0, 60) + '...' : product.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddingProduct(product)}
                        className="gap-1"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add
                      </Button>
                      {product.url && (
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-10 h-10 text-blue-600 rounded-md hover:bg-blue-50"
                          title="View product page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingProduct(product); setShowProductForm(true); }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <span className="text-sm text-gray-500">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </span>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={showProductForm}
        onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
        onSave={handleSaveProduct}
        product={editingProduct}
      />

      {/* Add to Estimate Modal */}
      <AddProductToEstimateModal
        isOpen={!!addingProduct}
        onClose={() => setAddingProduct(null)}
        product={addingProduct}
        sections={sections}
        onConfirm={onAddToEstimate}
      />
    </>
  );
}

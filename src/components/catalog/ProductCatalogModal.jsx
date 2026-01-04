import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Edit2, Trash2, ShoppingCart, ExternalLink, Package, Tag } from 'lucide-react';
import { Button } from '../ui/button';
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
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.name?.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term) ||
      p.productCategory?.toLowerCase().includes(term);
    const matchesCategory =
      categoryFilter === 'all' || p.productCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

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
          className="relative w-full max-w-4xl max-h-full bg-white rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Product Catalog</h2>
                <p className="text-sm text-slate-500">Manage your saved products and pricing</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute p-2 transition-all duration-200 rounded-full top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute w-4 h-4 text-slate-400 -translate-y-1/2 left-4 top-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, brand, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2.5 pl-11 pr-4 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 placeholder:text-slate-400"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Product</span>
                </button>
              </div>
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-white to-slate-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"
                     style={{ borderWidth: '3px' }} />
                <span className="text-sm text-slate-500">Loading products...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                {products.length === 0 ? (
                  <>
                    <div>
                      <p className="font-medium text-slate-700">No products yet</p>
                      <p className="text-sm text-slate-500">Start building your product catalog</p>
                    </div>
                    <button
                      onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 border rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      <Plus className="w-4 h-4" />
                      Add Your First Product
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-slate-700">No matching products</p>
                    <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredProducts.map((product, index) => {
                  const updatedDate = product.updatedAt
                    ? new Date(typeof product.updatedAt === 'number' ? product.updatedAt : product.updatedAt.toDate?.() || product.updatedAt)
                    : null;
                  return (
                    <div
                      key={product.id}
                      className="group relative flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200"
                      style={{
                        animationDelay: `${index * 30}ms`,
                      }}
                    >
                      {/* Product Icon */}
                      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 group-hover:border-slate-300 transition-colors">
                        <Tag className="w-5 h-5 text-slate-500" />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-slate-800 truncate">
                            {product.name}
                          </h3>
                          {product.brand && (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 truncate max-w-24">
                              {product.brand}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {PRODUCT_CATEGORIES.find((c) => c.value === product.productCategory)?.label || product.productCategory}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {money(product.unitPrice)} <span className="font-normal text-slate-400">/ {product.unit}</span>
                          </span>
                          {updatedDate && (
                            <span className="text-slate-400">
                              Updated {updatedDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {product.notes && (
                          <p className="mt-1.5 text-sm text-slate-400 italic truncate">
                            {product.notes.length > 80 ? product.notes.slice(0, 80) + '...' : product.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => setAddingProduct(product)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors duration-150"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span className="hidden lg:inline">Add</span>
                        </button>
                        {product.url && (
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                            title="View product page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => { setEditingProduct(product); setShowProductForm(true); }}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors duration-150"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80">
            <span className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
              {searchTerm || categoryFilter !== 'all' ? ' found' : ' in catalog'}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium transition-all duration-200 border rounded-xl text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
            >
              Close
            </button>
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

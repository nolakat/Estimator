import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'products';
const STORAGE_KEY = 'contractor_estimator_products';

// localStorage helpers
const getLocalProducts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalProducts = (products) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Failed to save products to localStorage:', error);
  }
};

export const productService = {
  // Get all products for a user
  async getProducts(userId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sync to localStorage as backup
      if (products.length > 0) {
        saveLocalProducts(products);
      }
      return products;
    } catch (error) {
      console.warn('Firebase failed, using localStorage for products:', error.message);
      // Fallback to localStorage
      return getLocalProducts().filter(p => p.userId === userId);
    }
  },

  // Save/update a product
  async saveProduct(product) {
    // Always save to localStorage first
    const localProducts = getLocalProducts();

    if (product.id) {
      // Update existing
      const idx = localProducts.findIndex(p => p.id === product.id);
      const updatedProduct = { ...product, updatedAt: Date.now() };
      if (idx >= 0) {
        localProducts[idx] = updatedProduct;
      } else {
        localProducts.push(updatedProduct);
      }
      saveLocalProducts(localProducts);

      // Try Firebase
      try {
        const docRef = doc(db, COLLECTION_NAME, product.id);
        await setDoc(docRef, {
          ...product,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.warn('Firebase save failed, using localStorage:', error.message);
      }
      return product.id;
    } else {
      // Create new
      const newId = `product-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newProduct = {
        ...product,
        id: newId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      localProducts.push(newProduct);
      saveLocalProducts(localProducts);

      // Try Firebase
      try {
        const docRef = doc(db, COLLECTION_NAME, newId);
        await setDoc(docRef, {
          ...newProduct,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.warn('Firebase save failed, using localStorage:', error.message);
      }
      return newId;
    }
  },

  // Delete a product
  async deleteProduct(productId) {
    // Always delete from localStorage first
    const localProducts = getLocalProducts();
    const filtered = localProducts.filter(p => p.id !== productId);
    saveLocalProducts(filtered);

    // Try Firebase
    try {
      const docRef = doc(db, COLLECTION_NAME, productId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('Firebase delete failed, using localStorage:', error.message);
    }
  }
};

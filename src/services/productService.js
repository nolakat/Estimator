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
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  },

  // Save/update a product
  async saveProduct(product) {
    try {
      if (product.id) {
        const docRef = doc(db, COLLECTION_NAME, product.id);
        await setDoc(docRef, {
          ...product,
          updatedAt: serverTimestamp()
        }, { merge: true });
        return product.id;
      } else {
        const docRef = doc(collection(db, COLLECTION_NAME));
        const newProduct = {
          ...product,
          id: docRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(docRef, newProduct);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  },

  // Delete a product
  async deleteProduct(productId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, productId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
};

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'estimates';

export const estimatorService = {
  // Get all estimates for a user
  async getEstimates(userId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting estimates:', error);
      // Don't throw - let the calling code handle it
      throw error;
    }
  },

  // Get a single estimate
  async getEstimate(estimateId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, estimateId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting estimate:', error);
      throw error;
    }
  },

  // Save/update an estimate
  async saveEstimate(estimate) {
    try {
      if (estimate.id) {
        // Update existing or create if doesn't exist
        const docRef = doc(db, COLLECTION_NAME, estimate.id);
        await setDoc(docRef, {
          ...estimate,
          updatedAt: serverTimestamp()
        }, { merge: true });
        return estimate.id;
      } else {
        // Create new
        const docRef = doc(collection(db, COLLECTION_NAME));
        const newEstimate = {
          ...estimate,
          id: docRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(docRef, newEstimate);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving estimate:', error);
      throw error;
    }
  },

  // Delete an estimate
  async deleteEstimate(estimateId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, estimateId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting estimate:', error);
      throw error;
    }
  }
};

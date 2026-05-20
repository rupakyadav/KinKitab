import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Toggle a book in the user's favorites.
 */
export async function toggleFavorite(uid, bookId, isFavorite) {
  const ref = doc(db, 'users', uid, 'favorites', bookId);
  if (isFavorite) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, {
      bookId,
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Subscribe to the user's favorites list (ids only).
 */
export function subscribeToFavorites(uid, onChange) {
  const q = query(collection(db, 'users', uid, 'favorites'));
  return onSnapshot(q, (snap) => {
    const ids = snap.docs.map((d) => d.id);
    onChange(ids);
  });
}

/**
 * Fetch all favorite book IDs for a user.
 */
export async function getFavoriteIds(uid) {
  const q = query(collection(db, 'users', uid, 'favorites'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

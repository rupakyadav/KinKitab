import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';

const userRef = (uid) => doc(db, 'users', uid);

/**
 * Fetch a user profile from Firestore.
 * Returns null if no profile exists yet.
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Create or update a user profile.
 * Uses setDoc with merge so this works for both new and returning users.
 */
export async function saveUserProfile(user, fields) {
  const ref = userRef(user.uid);
  const existing = await getDoc(ref);

  const payload = {
    // Identity from Google (kept in sync on every save)
    email: user.email,
    googleName: user.displayName || '',
    photoURL: user.photoURL || '',
    // User-controlled fields
    username: fields.username.trim(),
    phone: fields.phone.trim(),
    location: fields.location.trim(),
    // Bookkeeping
    updatedAt: serverTimestamp(),
    ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
  };

  await setDoc(ref, payload, { merge: true });
  return payload;
}

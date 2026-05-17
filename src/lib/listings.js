import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import { db, storage } from './firebase.js';

const listingsCol = collection(db, 'listings');

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'used', label: 'Used' },
  { value: 'well_loved', label: 'Well-loved' },
];

export const conditionLabel = (v) =>
  CONDITIONS.find((c) => c.value === v)?.label || v;

/**
 * Upload an image to Storage under listings/{uid}/{timestamp}-{name}.
 * Returns { url, path } so we can delete it later.
 */
export async function uploadListingImage(uid, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `listings/${uid}/${Date.now()}-${safeName}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file, { contentType: file.type });
  const url = await getDownloadURL(ref);
  return { url, path };
}

export async function deleteStorageObject(path) {
  if (!path) return;
  try {
    await deleteObject(storageRef(storage, path));
  } catch (err) {
    // Object may already be gone; log but don't fail the whole delete.
    console.warn('Storage delete failed for', path, err?.code || err);
  }
}

/**
 * Create a new listing. `data` is the form fields; image upload is the caller's job
 * so the UI can show progress without coupling concerns.
 */
export async function createListing(user, data, image) {
  const payload = {
    sellerId: user.uid,
    sellerName: data.sellerName || user.displayName || '',
    title: data.title.trim(),
    author: data.author.trim(),
    price: Number(data.price),
    condition: data.condition,
    description: data.description.trim(),
    imageUrl: image?.url || '',
    imagePath: image?.path || '',
    status: 'available',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(listingsCol, payload);
  return { id: ref.id, ...payload };
}

export async function updateListing(id, data, image) {
  const ref = doc(db, 'listings', id);
  const patch = {
    title: data.title.trim(),
    author: data.author.trim(),
    price: Number(data.price),
    condition: data.condition,
    description: data.description.trim(),
    updatedAt: serverTimestamp(),
  };
  if (image) {
    patch.imageUrl = image.url;
    patch.imagePath = image.path;
  }
  await updateDoc(ref, patch);
}

export async function deleteListing(listing) {
  await deleteStorageObject(listing.imagePath);
  await deleteDoc(doc(db, 'listings', listing.id));
}

/**
 * Toggle a listing's status between 'available' and 'sold'.
 * Used for "Mark as sold" and "Relist" controls.
 */
export async function setListingStatus(id, status) {
  if (status !== 'available' && status !== 'sold') {
    throw new Error(`Invalid status: ${status}`);
  }
  await updateDoc(doc(db, 'listings', id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Subscribe to a user's listings in real time.
 * Returns the unsubscribe function.
 */
export function subscribeToUserListings(uid, onChange, onError) {
  const q = query(
    listingsCol,
    where('sellerId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(items);
    },
    (err) => {
      console.error('Listings subscription error:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribe to all available listings (public feed).
 */
export function subscribeToAvailableListings(onChange, onError) {
  const q = query(
    listingsCol,
    where('status', '==', 'available'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(items);
    },
    (err) => {
      console.error('Public listings subscription error:', err);
      onError?.(err);
    }
  );
}

/**
 * Fetch a single listing by id.
 */
export async function getListing(id) {
  const snap = await getDoc(doc(db, 'listings', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

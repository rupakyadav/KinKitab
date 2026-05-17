import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase.js';

const chatsCol = collection(db, 'chats');

/**
 * Deterministic chat id so each (book, buyer) pair has exactly one chat
 * regardless of who opens it first. Lets us verify uniqueness with a single
 * getDoc and lets security rules validate the id shape.
 */
export function chatIdFor(bookId, buyerId) {
  return `${bookId}_${buyerId}`;
}

const chatRef = (id) => doc(db, 'chats', id);
const messagesCol = (id) => collection(db, 'chats', id, 'messages');

/**
 * Open the chat between this buyer and the seller of the given listing,
 * creating it if it doesn't exist. Returns the chat document data + id.
 */
export async function getOrCreateChatForListing(listing, buyer) {
  if (!listing || !buyer) throw new Error('Listing and buyer are required.');
  if (listing.sellerId === buyer.uid) {
    throw new Error('You cannot start a chat about your own listing.');
  }

  const id = chatIdFor(listing.id, buyer.uid);
  const ref = chatRef(id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id, ...snap.data() };
  }

  const payload = {
    bookId: listing.id,
    bookTitle: listing.title || '',
    bookImageUrl: listing.imageUrl || '',
    buyerId: buyer.uid,
    sellerId: listing.sellerId,
    participants: [buyer.uid, listing.sellerId],
    lastMessage: '',
    lastMessageAt: null,
    lastMessageSenderId: '',
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return { id, ...payload };
}

/**
 * Send a message in the chat. Updates the parent chat doc with denormalized
 * "last message" fields so the inbox list can render without extra reads.
 */
export async function sendMessage(chatId, senderId, text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  if (trimmed.length > 2000) {
    throw new Error('Message is too long (max 2000 characters).');
  }

  const messageRef = await addDoc(messagesCol(chatId), {
    text: trimmed,
    senderId,
    createdAt: serverTimestamp(),
  });

  await updateDoc(chatRef(chatId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
  });

  return messageRef.id;
}

/**
 * Subscribe to all chats the user participates in, ordered by most recent
 * message activity (with newly created chats falling back to createdAt).
 */
export function subscribeToUserChats(uid, onChange, onError) {
  const q = query(
    chatsCol,
    where('participants', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(items);
    },
    (err) => {
      console.error('Chats subscription error:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribe to a single chat's messages in chronological order.
 */
export function subscribeToMessages(chatId, onChange, onError) {
  const q = query(messagesCol(chatId), orderBy('createdAt', 'asc'), limit(500));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(items);
    },
    (err) => {
      console.error('Messages subscription error:', err);
      onError?.(err);
    }
  );
}

/**
 * Fetch a single chat document (used when navigating directly to /inbox/:id).
 */
export async function getChat(id) {
  const snap = await getDoc(chatRef(id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

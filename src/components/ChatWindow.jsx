import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2, Send } from 'lucide-react';
import { sendMessage, subscribeToMessages } from '../lib/chat.js';
import { getUserProfile } from '../lib/userProfile.js';

function formatTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDay(date) {
  if (!date) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ChatWindow({ chat, currentUid, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [counterparty, setCounterparty] = useState(null);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const counterpartyId = useMemo(
    () => (chat ? (chat.buyerId === currentUid ? chat.sellerId : chat.buyerId) : null),
    [chat, currentUid]
  );
  const role = chat?.sellerId === currentUid ? 'seller' : 'buyer';

  // Subscribe to messages for the active chat.
  useEffect(() => {
    if (!chat?.id) return;
    setLoading(true);
    const unsub = subscribeToMessages(
      chat.id,
      (items) => {
        setMessages(items);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || 'Could not load messages.');
        setLoading(false);
      }
    );
    return unsub;
  }, [chat?.id]);

  // Resolve the other person's profile so we can show their name + avatar.
  useEffect(() => {
    if (!counterpartyId) return;
    let cancelled = false;
    getUserProfile(counterpartyId)
      .then((p) => !cancelled && setCounterparty(p))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [counterpartyId]);

  // Auto-scroll to the bottom whenever new messages arrive.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // Focus the input when the chat changes.
  useEffect(() => {
    inputRef.current?.focus();
  }, [chat?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      await sendMessage(chat.id, currentUid, text);
      setDraft('');
    } catch (err) {
      console.error('Send message failed:', err);
      setError(err?.message || 'Could not send. Try again.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Group messages with day separators.
  const grouped = useMemo(() => {
    const out = [];
    let lastDay = '';
    for (const m of messages) {
      const date = m.createdAt?.toDate?.();
      const dayKey = date ? formatDay(date) : '';
      if (dayKey && dayKey !== lastDay) {
        out.push({ type: 'day', key: `day-${out.length}`, label: dayKey });
        lastDay = dayKey;
      }
      out.push({ type: 'message', key: m.id, message: m, date });
    }
    return out;
  }, [messages]);

  if (!chat) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        {onBack && (
          <button
            onClick={onBack}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Link
          to={`/book/${chat.bookId}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-slate-800">
            {chat.bookImageUrl ? (
              <img src={chat.bookImageUrl} alt={chat.bookTitle} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-400 dark:text-slate-500">
                <BookOpen className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900 dark:text-slate-100">
              {chat.bookTitle || 'Untitled book'}
            </p>
            <p className="truncate text-xs text-stone-500 dark:text-slate-400">
              {role === 'buyer' ? 'Seller' : 'Buyer'}:{' '}
              {counterparty?.username || 'KinKitab user'}
              {counterparty?.location ? ` · ${counterparty.location}` : ''}
            </p>
          </div>
        </Link>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-stone-50 px-4 py-4 dark:bg-slate-950"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-stone-500 dark:text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading messages…
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm font-semibold text-stone-700 dark:text-slate-200">
                Say hello!
              </p>
              <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
                {role === 'buyer'
                  ? 'Ask the seller about condition, pickup, or anything else.'
                  : 'A buyer is interested in your book. Reply to coordinate the handoff.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {grouped.map((row) =>
              row.type === 'day' ? (
                <div key={row.key} className="my-4 flex justify-center">
                  <span className="rounded-full bg-stone-200/70 px-3 py-1 text-xs font-medium text-stone-600 dark:bg-slate-800 dark:text-slate-400">
                    {row.label}
                  </span>
                </div>
              ) : (
                <Bubble
                  key={row.key}
                  message={row.message}
                  date={row.date}
                  isMine={row.message.senderId === currentUid}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-stone-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
      >
        {error && (
          <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            placeholder="Type a message…"
            className="max-h-32 flex-1 resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-brand-500/30"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-stone-400 dark:text-slate-500">
          Press Enter to send, Shift+Enter for a new line.
        </p>
      </form>
    </div>
  );
}

function Bubble({ message, date, isMine }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
          isMine
            ? 'rounded-br-sm bg-brand-600 text-white'
            : 'rounded-bl-sm bg-white text-stone-800 ring-1 ring-stone-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700'
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
        {date && (
          <p
            className={`mt-1 text-right text-[10px] ${
              isMine ? 'text-white/70' : 'text-stone-400 dark:text-slate-500'
            }`}
          >
            {formatTime(date)}
          </p>
        )}
      </div>
    </div>
  );
}

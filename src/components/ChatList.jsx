import { Link } from 'react-router-dom';
import { BookOpen, MessageSquare } from 'lucide-react';

function timeAgo(date) {
  if (!date) return '';
  const now = Date.now();
  const diff = (now - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function ChatList({ chats, currentUid, activeChatId }) {
  if (!chats || chats.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-stone-900 dark:text-slate-100">
          No conversations yet
        </h3>
        <p className="mt-1 max-w-xs text-sm text-stone-500 dark:text-slate-400">
          Browse the marketplace and tap "Chat with Seller" to start a conversation.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 dark:divide-slate-800">
      {chats.map((chat) => {
        const lastAt = chat.lastMessageAt?.toDate?.() || chat.createdAt?.toDate?.() || null;
        const youSentLast = chat.lastMessageSenderId === currentUid;
        const role = chat.sellerId === currentUid ? 'buyer' : 'seller';
        const counterpartyLabel = role === 'buyer' ? 'Buyer' : 'Seller';
        const isActive = chat.id === activeChatId;

        return (
          <li key={chat.id}>
            <Link
              to={`/inbox/${chat.id}`}
              className={`flex items-start gap-3 px-4 py-3 transition ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-500/10'
                  : 'hover:bg-stone-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-slate-800">
                {chat.bookImageUrl ? (
                  <img
                    src={chat.bookImageUrl}
                    alt={chat.bookTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-400 dark:text-slate-500">
                    <BookOpen className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-semibold text-stone-900 dark:text-slate-100">
                    {chat.bookTitle || 'Untitled book'}
                  </p>
                  {lastAt && (
                    <span className="shrink-0 text-xs text-stone-400 dark:text-slate-500">
                      {timeAgo(lastAt)}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-stone-400 dark:text-slate-500">
                  {counterpartyLabel}
                </p>
                <p className="mt-1 line-clamp-1 text-sm text-stone-600 dark:text-slate-300">
                  {chat.lastMessage ? (
                    <>
                      {youSentLast && <span className="text-stone-400 dark:text-slate-500">You: </span>}
                      {chat.lastMessage}
                    </>
                  ) : (
                    <span className="italic text-stone-400 dark:text-slate-500">
                      No messages yet — say hi!
                    </span>
                  )}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

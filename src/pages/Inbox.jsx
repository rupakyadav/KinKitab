import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { subscribeToUserChats } from '../lib/chat.js';
import ChatList from '../components/ChatList.jsx';
import ChatWindow from '../components/ChatWindow.jsx';

export default function Inbox() {
  const { user } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToUserChats(
      user.uid,
      (items) => {
        setChats(items);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || 'Could not load your conversations.');
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  const activeChat = useMemo(
    () => (chatId ? chats.find((c) => c.id === chatId) || null : null),
    [chats, chatId]
  );

  // If we routed to a specific id but it isn't (yet) in our list, the
  // subscription may still be loading or the user isn't a participant.
  const showActiveOnMobile = Boolean(chatId);

  return (
    <div className="mx-auto h-[calc(100vh-4rem)] max-w-6xl px-0 sm:px-6 sm:py-6">
      <div className="flex h-full overflow-hidden border-y border-stone-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl sm:border">
        {/* List pane */}
        <aside
          className={`w-full border-stone-200 dark:border-slate-800 lg:w-80 lg:shrink-0 lg:border-r ${
            showActiveOnMobile ? 'hidden lg:block' : 'block'
          }`}
        >
          <header className="flex items-center gap-2 border-b border-stone-200 px-4 py-4 dark:border-slate-800">
            <MessageSquare className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h1 className="text-lg font-bold text-stone-900 dark:text-slate-100">Inbox</h1>
            <span className="ml-auto text-xs text-stone-500 dark:text-slate-400">
              {chats.length} {chats.length === 1 ? 'chat' : 'chats'}
            </span>
          </header>

          <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-stone-500 dark:text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : error ? (
              <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            ) : (
              <ChatList chats={chats} currentUid={user?.uid} activeChatId={chatId} />
            )}
          </div>
        </aside>

        {/* Conversation pane */}
        <section
          className={`flex-1 ${showActiveOnMobile ? 'block' : 'hidden lg:block'}`}
        >
          {activeChat ? (
            <ChatWindow
              chat={activeChat}
              currentUid={user?.uid}
              onBack={() => navigate('/inbox')}
            />
          ) : chatId && !loading ? (
            <EmptyPane
              title="Conversation not found"
              body="This chat may have been removed, or you're not a participant."
            />
          ) : (
            <EmptyPane
              title="Pick a conversation"
              body="Select a chat from the list to start messaging."
            />
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyPane({ title, body }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400">
        <MessageSquare className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-stone-900 dark:text-slate-100">
        {title}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-stone-500 dark:text-slate-400">{body}</p>
    </div>
  );
}

import { useState } from 'react';
import { PlusCircle, Sparkles, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ListingFormModal from '../components/ListingFormModal.jsx';
import MarketplaceFeed from '../components/MarketplaceFeed.jsx';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const name = profile?.username || user?.displayName?.split(' ')[0] || 'reader';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Hero */}
      <section className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          <Sparkles className="h-3.5 w-3.5" />
          You're signed in
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Welcome, {name}!
        </h1>
        <p className="mt-2 max-w-xl text-stone-600">
          Discover great reads from sellers near you, or list a book of your own.
        </p>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          tone="indigo"
          icon={<Store className="h-6 w-6" />}
          title="Browse the Marketplace"
          body="Scroll the feed below to find your next read."
          onClick={() =>
            document
              .getElementById('marketplace')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          cta="Jump to feed"
        />
        <ActionCard
          tone="brand"
          icon={<PlusCircle className="h-6 w-6" />}
          title="List a Book for Sale"
          body="Snap a photo, set a price, find a new home for your book."
          onClick={() => setCreateOpen(true)}
          cta="Create a listing"
        />
      </section>

      {/* Public marketplace feed */}
      <section id="marketplace" className="mt-10 scroll-mt-20">
        <header className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900 sm:text-2xl">
              The Marketplace
            </h2>
            <p className="text-sm text-stone-500">
              Books available right now from KinKitab sellers.
            </p>
          </div>
        </header>
        <MarketplaceFeed excludeSellerId={user?.uid} />
      </section>

      <ListingFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function ActionCard({ icon, title, body, cta, tone = 'brand', onClick }) {
  const tones = {
    brand: {
      ring: 'group-hover:ring-brand-200',
      iconBg: 'bg-brand-50 text-brand-700',
      cta: 'text-brand-700',
    },
    indigo: {
      ring: 'group-hover:ring-indigo-200',
      iconBg: 'bg-indigo-50 text-indigo-700',
      cta: 'text-indigo-700',
    },
  };
  const t = tones[tone] || tones.brand;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group h-full rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm ring-1 ring-transparent transition hover:-translate-y-0.5 hover:shadow-md ${t.ring}`}
    >
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${t.iconBg}`}>
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-stone-900">{title}</h2>
      <p className="mt-1 text-sm text-stone-600">{body}</p>
      <div className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${t.cta}`}>
        {cta}
        <span aria-hidden>→</span>
      </div>
    </button>
  );
}

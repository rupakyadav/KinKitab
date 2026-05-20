import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, SlidersHorizontal, X, BookOpen, Barcode } from 'lucide-react';
import { CONDITIONS, subscribeToAvailableListings } from '../lib/listings.js';
import { getUserProfile } from '../lib/userProfile.js';
import { looksLikeIsbnSearch, normalizeIsbn } from '../lib/isbn.js';
import PublicBookCard from './PublicBookCard.jsx';

const PRICE_RANGES = [
  { id: 'any', label: 'Any price', min: 0, max: Infinity },
  { id: 'under10', label: 'Under ₹10', min: 0, max: 10 },
  { id: '10to20', label: '₹10 – ₹20', min: 10, max: 20 },
  { id: 'over20', label: '₹20 +', min: 20, max: Infinity },
];

export default function MarketplaceFeed({ excludeSellerId, hideSold = true }) {
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('any');
  const [priceRange, setPriceRange] = useState('any');

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToAvailableListings(
      (items) => {
        setAllListings(items);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || 'Could not load the marketplace.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const [sellerProfiles, setSellerProfiles] = useState({});
  useEffect(() => {
    const uniqueIds = [...new Set(allListings.map((l) => l.sellerId))];
    const missing = uniqueIds.filter((id) => !(id in sellerProfiles));
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(missing.map((id) => getUserProfile(id).catch(() => null))).then(
      (profiles) => {
        if (cancelled) return;
        setSellerProfiles((prev) => {
          const next = { ...prev };
          missing.forEach((id, i) => {
            next[id] = profiles[i] || null;
          });
          return next;
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [allListings, sellerProfiles]);

  // subscribeToAvailableListings already filters by status == 'available'
  // at the query level; the hideSold guard below is a safety net.
  const isIsbnSearch = looksLikeIsbnSearch(search);
  const normalizedIsbnSearch = isIsbnSearch ? normalizeIsbn(search) : '';

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const range = PRICE_RANGES.find((r) => r.id === priceRange) || PRICE_RANGES[0];

    return allListings.filter((l) => {
      if (excludeSellerId && l.sellerId === excludeSellerId) return false;
      if (hideSold && l.status === 'sold') return false;
      if (condition !== 'any' && l.condition !== condition) return false;
      const price = Number(l.price);
      if (price < range.min || price > range.max) return false;

      if (term) {
        if (isIsbnSearch) {
          // Strict ISBN match: only listings whose stored ISBN equals the
          // normalized input pass through.
          if (normalizeIsbn(l.isbn) !== normalizedIsbnSearch) return false;
        } else {
          const haystack = `${l.title} ${l.author}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
      }
      return true;
    });
  }, [
    allListings,
    search,
    condition,
    priceRange,
    excludeSellerId,
    hideSold,
    isIsbnSearch,
    normalizedIsbnSearch,
  ]);

  const hasActiveFilters =
    search || condition !== 'any' || priceRange !== 'any';

  const clearFilters = () => {
    setSearch('');
    setCondition('any');
    setPriceRange('any');
  };

  const selectCls =
    'rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-brand-500/30';

  return (
    <section>
      {/* Search + filters */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or ISBN…"
              className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-9 text-stone-900 placeholder-stone-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-brand-500/30"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={selectCls}
            >
              <option value="any">Any condition</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className={selectCls}
            >
              {PRICE_RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
            {isIsbnSearch ? (
              <>
                <Barcode className="h-3.5 w-3.5" />
                <span>
                  ISBN match · {normalizedIsbnSearch}
                </span>
              </>
            ) : (
              <>
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters active</span>
              </>
            )}
            <button
              onClick={clearFilters}
              className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-stone-500 dark:text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading the marketplace…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            isIsbnSearch={isIsbnSearch}
            isbnValue={normalizedIsbnSearch}
            onClear={clearFilters}
          />
        ) : (
          <>
            <div className="mb-3 text-sm text-stone-500 dark:text-slate-400">
              {filtered.length} {filtered.length === 1 ? 'book' : 'books'} found
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((l) => (
                <PublicBookCard
                  key={l.id}
                  listing={l}
                  sellerLocation={sellerProfiles[l.sellerId]?.location}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function EmptyState({ hasActiveFilters, isIsbnSearch, isbnValue, onClear }) {
  const title = isIsbnSearch
    ? 'No copies of this ISBN are listed yet'
    : hasActiveFilters
      ? 'No books found matching your search'
      : 'The shelves are empty';

  const body = isIsbnSearch
    ? `Nobody has listed ISBN ${isbnValue} for sale right now. Try a title or author search instead.`
    : hasActiveFilters
      ? 'Try a different keyword or loosen your filters to discover more reads.'
      : 'No one has listed a book yet. Be the first — it only takes a minute.';

  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400">
        {isIsbnSearch ? (
          <Barcode className="h-7 w-7" />
        ) : hasActiveFilters ? (
          <Search className="h-7 w-7" />
        ) : (
          <BookOpen className="h-7 w-7" />
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-stone-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500 dark:text-slate-400">
        {body}
      </p>
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

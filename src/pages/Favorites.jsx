import { useEffect, useState } from 'react';
import { Heart, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { getListing } from '../lib/listings.js';
import { getUserProfile } from '../lib/userProfile.js';
import PublicBookCard from '../components/PublicBookCard.jsx';
import Seo from '../components/Seo.jsx';

export default function Favorites() {
  const { favorites } = useFavorites();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellerProfiles, setSellerProfiles] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Fetch all favorite listings in parallel
        const results = await Promise.all(
          favorites.map((id) => getListing(id).catch(() => null))
        );
        if (cancelled) return;

        // Filter out any that were deleted/not found
        const validItems = results.filter(Boolean);
        setItems(validItems);

        // Fetch seller profiles for the location badge
        const sellerIds = [...new Set(validItems.map((i) => i.sellerId))];
        const profiles = await Promise.all(
          sellerIds.map((id) => getUserProfile(id).catch(() => null))
        );
        if (cancelled) return;

        const profileMap = {};
        sellerIds.forEach((id, index) => {
          profileMap[id] = profiles[index];
        });
        setSellerProfiles(profileMap);
      } catch (err) {
        console.error('Failed to load favorite items:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [favorites]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Seo title="My Favorites" noIndex />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-slate-100 sm:text-3xl">
            My Favorites
          </h1>
          <p className="mt-1 text-stone-600 dark:text-slate-300">
            Books you've saved to check out later.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-500 dark:text-slate-400">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Loading your favorites…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-stone-900 dark:text-slate-100">
            No favorites yet
          </h3>
          <p className="mt-2 text-stone-600 dark:text-slate-400">
            Browse the marketplace and tap the heart icon on books you're interested in.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Go to Marketplace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <PublicBookCard
              key={item.id}
              listing={item}
              sellerLocation={sellerProfiles[item.sellerId]?.location}
            />
          ))}
        </div>
      )}
    </div>
  );
}

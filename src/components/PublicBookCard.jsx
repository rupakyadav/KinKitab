import { Link } from 'react-router-dom';
import { BookOpen, MapPin, Heart } from 'lucide-react';
import { conditionLabel } from '../lib/listings.js';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { formatPrice } from '../lib/money.js';

export default function PublicBookCard({ listing, sellerLocation }) {
  const isSold = listing.status === 'sold';
  const { isFavorite, toggle } = useFavorites();
  const liked = isFavorite(listing.id);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(listing.id);
  };

  return (
    <Link
      to={`/book/${listing.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${
        isSold ? 'opacity-75' : ''
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-slate-800">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400 dark:text-slate-500">
            <BookOpen className="h-10 w-10" />
          </div>
        )}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/45 dark:bg-black/60">
            <span className="rounded-md bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-stone-800 dark:bg-slate-100/95 dark:text-slate-900">
              Sold
            </span>
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-md bg-white/95 px-2 py-0.5 text-xs font-medium text-stone-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-200">
          {conditionLabel(listing.condition)}
        </span>

        {!isSold && (
          <button
            onClick={handleFavorite}
            className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all ${
              liked
                ? 'bg-red-50 text-red-500 opacity-100 dark:bg-red-500/20'
                : 'bg-white/90 text-stone-400 opacity-0 group-hover:opacity-100 dark:bg-slate-900/80'
            } hover:scale-110`}
            aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-stone-900 dark:text-slate-100">
          {listing.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-sm text-stone-500 dark:text-slate-400">
          {listing.author}
        </p>

        <div className="mt-3 flex items-end justify-between">
          <span className="text-lg font-bold text-stone-900 dark:text-slate-100">
            {formatPrice(listing.price)}
          </span>
          {sellerLocation && (
            <span className="inline-flex max-w-[55%] items-center gap-1 truncate text-xs text-stone-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{sellerLocation}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

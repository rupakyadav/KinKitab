import { CheckCircle2, Pencil, RotateCcw, Trash2, BookOpen } from 'lucide-react';
import { conditionLabel } from '../lib/listings.js';
import { formatPrice } from '../lib/money.js';

export default function BookCard({ listing, onEdit, onDelete, onToggleSold }) {
  const isSold = listing.status === 'sold';

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
        isSold
          ? 'border-stone-300 dark:border-slate-700'
          : 'border-stone-200 dark:border-slate-800'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-slate-800">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] ${
              isSold ? 'grayscale' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400 dark:text-slate-500">
            <BookOpen className="h-10 w-10" />
          </div>
        )}

        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/40 dark:bg-black/55">
            <span className="rounded-md bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-stone-800 shadow dark:bg-slate-100/95 dark:text-slate-900">
              Sold
            </span>
          </div>
        )}

        {!isSold && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30">
            Available
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3
          className={`line-clamp-2 font-semibold ${
            isSold
              ? 'text-stone-500 line-through decoration-stone-300 dark:text-slate-500 dark:decoration-slate-600'
              : 'text-stone-900 dark:text-slate-100'
          }`}
        >
          {listing.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-sm text-stone-500 dark:text-slate-400">
          {listing.author}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span
            className={`text-lg font-bold ${
              isSold
                ? 'text-stone-500 dark:text-slate-500'
                : 'text-stone-900 dark:text-slate-100'
            }`}
          >
            {formatPrice(listing.price)}
          </span>
          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600 dark:bg-slate-800 dark:text-slate-300">
            {conditionLabel(listing.condition)}
          </span>
        </div>

        <div className="mt-4 border-t border-stone-100 pt-3 dark:border-slate-800">
          {isSold ? (
            <button
              onClick={() => onToggleSold?.(listing)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
            >
              <RotateCcw className="h-4 w-4" />
              Relist Book
            </button>
          ) : (
            <button
              onClick={() => onToggleSold?.(listing)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark as Sold
            </button>
          )}

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onEdit?.(listing)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete?.(listing)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A base Skeleton component that provides a pulsing animation.
 * Use it to build specific skeletons for different parts of the UI.
 */
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-stone-200 dark:bg-slate-800 ${className}`}
    />
  );
}

/**
 * A skeleton loader that matches the layout of PublicBookCard.
 */
export function BookCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Aspect ratio box for the image */}
      <Skeleton className="aspect-[4/3] rounded-none" />

      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Author */}
        <Skeleton className="mt-2 h-4 w-1/2" />

        <div className="mt-4 flex items-end justify-between">
          {/* Price */}
          <Skeleton className="h-6 w-16" />
          {/* Location */}
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * A skeleton for the BookDetail page.
 */
export function BookDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 h-4 w-32 animate-pulse rounded bg-stone-200 dark:bg-slate-800" />

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Image */}
        <div className="lg:col-span-3">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl sm:aspect-[3/2]" />
        </div>

        {/* Info */}
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="mt-4 h-10 w-24" />
          </div>

          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Seller Card */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <Skeleton className="h-4 w-16 mb-4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="mt-6 h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

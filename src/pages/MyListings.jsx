import { useEffect, useMemo, useState } from 'react';
import { Plus, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  deleteListing,
  setListingStatus,
  subscribeToUserListings,
} from '../lib/listings.js';
import BookCard from '../components/BookCard.jsx';
import ListingFormModal from '../components/ListingFormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'sold', label: 'Sold' },
];

export default function MyListings() {
  const { user } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [pendingStatus, setPendingStatus] = useState(null); // { listing, nextStatus }
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Real-time subscription to this user's listings.
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToUserListings(
      user.uid,
      (items) => {
        setListings(items);
        setLoading(false);
      },
      (err) => {
        setLoadError(err?.message || 'Could not load your listings.');
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  const counts = useMemo(() => {
    const c = { all: listings.length, available: 0, sold: 0 };
    listings.forEach((l) => {
      if (l.status === 'sold') c.sold += 1;
      else c.available += 1;
    });
    return c;
  }, [listings]);

  const visible = useMemo(() => {
    if (statusFilter === 'all') return listings;
    return listings.filter((l) =>
      statusFilter === 'sold' ? l.status === 'sold' : l.status !== 'sold'
    );
  }, [listings, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (listing) => {
    setEditing(listing);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteListing(pendingDelete);
      setPendingDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err?.message || 'Could not delete the listing.');
    } finally {
      setDeleting(false);
    }
  };

  const requestToggleSold = (listing) => {
    const nextStatus = listing.status === 'sold' ? 'available' : 'sold';
    setPendingStatus({ listing, nextStatus });
  };

  const confirmToggleSold = async () => {
    if (!pendingStatus) return;
    setUpdatingStatus(true);
    try {
      await setListingStatus(pendingStatus.listing.id, pendingStatus.nextStatus);
      setPendingStatus(null);
    } catch (err) {
      console.error('Status update failed:', err);
      alert(err?.message || 'Could not update the listing status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">My Listings</h1>
          <p className="mt-1 text-stone-600">
            Manage the books you've put up for sale.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          New listing
        </button>
      </header>

      {/* Status filter pills (only show when there are listings) */}
      {!loading && listings.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'border-brand-200 bg-brand-50 text-brand-700'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    active ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {counts[f.id]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-stone-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading your listings…
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : listings.length === 0 ? (
          <FirstListingEmptyState onCreate={openCreate} />
        ) : visible.length === 0 ? (
          <FilteredEmptyState
            statusFilter={statusFilter}
            onShowAll={() => setStatusFilter('all')}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((l) => (
              <BookCard
                key={l.id}
                listing={l}
                onEdit={openEdit}
                onDelete={(item) => setPendingDelete(item)}
                onToggleSold={requestToggleSold}
              />
            ))}
          </div>
        )}
      </div>

      <ListingFormModal open={formOpen} onClose={closeForm} listing={editing} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this listing?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed permanently. This can't be undone.`
            : ''
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        destructive
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={
          pendingStatus?.nextStatus === 'sold'
            ? 'Mark this book as sold?'
            : 'Relist this book?'
        }
        message={
          pendingStatus
            ? pendingStatus.nextStatus === 'sold'
              ? `"${pendingStatus.listing.title}" will be hidden from the public marketplace. You can relist it any time.`
              : `"${pendingStatus.listing.title}" will go back on the marketplace as available.`
            : ''
        }
        confirmLabel={
          updatingStatus
            ? 'Saving…'
            : pendingStatus?.nextStatus === 'sold'
              ? 'Mark as Sold'
              : 'Relist'
        }
        cancelLabel="Cancel"
        busy={updatingStatus}
        onConfirm={confirmToggleSold}
        onCancel={() => !updatingStatus && setPendingStatus(null)}
      />
    </div>
  );
}

function FirstListingEmptyState({ onCreate }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <BookOpen className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-stone-900">
        You haven't listed any books yet
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">
        Got a book gathering dust? Snap a photo, set a price, and find it a new
        home in minutes.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" />
        Create your first listing
      </button>
    </div>
  );
}

function FilteredEmptyState({ statusFilter, onShowAll }) {
  const copy =
    statusFilter === 'sold'
      ? {
          title: 'No sold books yet',
          body: 'Once you mark a listing as sold, it will appear here.',
        }
      : {
          title: 'Nothing available right now',
          body: 'All your books are sold. Time to list something new!',
        };

  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-semibold text-stone-900">{copy.title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">{copy.body}</p>
      <button
        onClick={onShowAll}
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        Show all listings
      </button>
    </div>
  );
}

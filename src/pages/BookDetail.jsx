import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Mail,
  MapPin,
  Phone,
  Loader2,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { getListing, conditionLabel } from '../lib/listings.js';
import { getUserProfile } from '../lib/userProfile.js';
import { formatPrice } from '../lib/money.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const item = await getListing(id);
        if (cancelled) return;
        if (!item) {
          setError('This listing could not be found. It may have been removed.');
          setListing(null);
          return;
        }
        setListing(item);
        const profile = await getUserProfile(item.sellerId).catch(() => null);
        if (!cancelled) setSeller(profile);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load this listing.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-stone-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-10 text-center">
          <h1 className="text-lg font-semibold text-stone-900">
            {error || 'Listing not found'}
          </h1>
          <Link
            to="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  const isOwnListing = user?.uid === listing.sellerId;
  const isSold = listing.status === 'sold';

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to marketplace
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Image */}
        <div className="lg:col-span-3">
          <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
            {listing.imageUrl ? (
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className="aspect-[4/3] w-full object-cover sm:aspect-[3/2]"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center text-stone-400 sm:aspect-[3/2]">
                <BookOpen className="h-16 w-16" />
              </div>
            )}
            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-900/40">
                <span className="rounded-lg bg-white/95 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-stone-800">
                  Sold
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info + seller */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {conditionLabel(listing.condition)}
              </span>
              {isSold ? (
                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                  Sold
                </span>
              ) : (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Available
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {listing.title}
            </h1>
            <p className="mt-1 text-stone-600">by {listing.author}</p>
            <p className="mt-4 text-3xl font-extrabold text-stone-900">
              {formatPrice(listing.price)}
            </p>
          </div>

          {listing.description && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                Description
              </h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-stone-700">
                {listing.description}
              </p>
            </div>
          )}

          {/* Seller */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Seller
            </h2>
            <div className="mt-3 flex items-center gap-3">
              {seller?.photoURL ? (
                <img
                  src={seller.photoURL}
                  alt={seller.username || 'Seller'}
                  className="h-12 w-12 rounded-full ring-2 ring-brand-100"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <UserIcon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-900">
                  {seller?.username || listing.sellerName || 'A KinKitab seller'}
                </p>
                {seller?.location && (
                  <p className="flex items-center gap-1 truncate text-sm text-stone-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {seller.location}
                  </p>
                )}
              </div>
            </div>

            {/* Contact for COD */}
            <ContactSection
              isOwnListing={isOwnListing}
              isSold={isSold}
              isAuthed={Boolean(user)}
              seller={seller}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactSection({ isOwnListing, isSold, isAuthed, seller }) {
  if (isOwnListing) {
    return (
      <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        This is your listing. Manage it from{' '}
        <Link to="/my-listings" className="font-medium text-brand-700 hover:underline">
          My Listings
        </Link>
        .
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        Sign in to see the seller's contact details.
      </div>
    );
  }

  if (isSold) {
    return (
      <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        This book is sold. Browse the marketplace for similar reads.
      </div>
    );
  }

  const phone = seller?.phone;
  const email = seller?.email;

  return (
    <div className="mt-5 border-t border-stone-100 pt-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        Contact for Cash on Delivery
      </h3>
      <p className="mt-1 text-xs text-stone-500">
        Use these details to coordinate a local handoff. Be courteous and meet in
        a public place.
      </p>

      <div className="mt-3 space-y-2">
        {phone ? (
          <ContactRow
            href={`tel:${phone}`}
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={phone}
          />
        ) : (
          <div className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-500">
            Seller hasn't added a phone number.
          </div>
        )}
        {email && (
          <ContactRow
            href={`mailto:${email}`}
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={email}
          />
        )}
      </div>
    </div>
  );
}

function ContactRow({ href, icon, label, value }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm transition hover:border-brand-300 hover:bg-brand-50/40"
    >
      <span className="flex items-center gap-2 text-stone-500">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </span>
      <span className="ml-3 truncate font-medium text-stone-900">{value}</span>
    </a>
  );
}

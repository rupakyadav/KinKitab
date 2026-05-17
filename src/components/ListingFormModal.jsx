import { useEffect, useRef, useState } from 'react';
import {
  Barcode,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CONDITIONS,
  createListing,
  updateListing,
  uploadListingImage,
} from '../lib/listings.js';
import { CURRENCY_SYMBOL } from '../lib/money.js';
import { lookupByIsbn } from '../lib/googleBooks.js';
import { parseIsbn } from '../lib/isbn.js';
import { useAuth } from '../context/AuthContext.jsx';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const emptyForm = {
  title: '',
  author: '',
  isbn: '',
  price: '',
  condition: 'used',
  description: '',
};

export default function ListingFormModal({ open, onClose, listing }) {
  const { user, profile } = useAuth();
  const isEdit = Boolean(listing);

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // ISBN autofill state — separate from the form so an unsuccessful lookup
  // doesn't leave stale text in the saved listing.
  const [isbnInput, setIsbnInput] = useState('');
  const [autofillState, setAutofillState] = useState({
    status: 'idle', // 'idle' | 'loading' | 'found' | 'not_found' | 'error'
    message: '',
  });

  useEffect(() => {
    if (!open) return;
    setError('');
    setImageFile(null);
    setAutofillState({ status: 'idle', message: '' });
    if (listing) {
      setForm({
        title: listing.title || '',
        author: listing.author || '',
        isbn: listing.isbn || '',
        price: String(listing.price ?? ''),
        condition: listing.condition || 'used',
        description: listing.description || '',
      });
      setIsbnInput(listing.isbn || '');
      setImagePreview(listing.imageUrl || '');
    } else {
      setForm(emptyForm);
      setIsbnInput('');
      setImagePreview('');
    }
  }, [open, listing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && !submitting && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, onClose]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!open) return null;

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is over 5 MB. Please pick a smaller one.');
      return;
    }
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAutofill = async () => {
    const canonical = parseIsbn(isbnInput);
    if (!canonical) {
      setAutofillState({
        status: 'error',
        message: 'Enter a 10 or 13 digit ISBN.',
      });
      return;
    }
    setAutofillState({ status: 'loading', message: '' });
    try {
      const result = await lookupByIsbn(canonical);
      if (!result) {
        setAutofillState({
          status: 'not_found',
          message: "Couldn't find that book. You can still fill the form manually.",
        });
        // Even on not-found, save the ISBN so search can match it later.
        setForm((f) => ({ ...f, isbn: canonical }));
        return;
      }
      setForm((f) => ({
        ...f,
        title: result.title || f.title,
        author: result.author || f.author,
        // Keep the seller's description if they've already typed one.
        description: f.description?.trim() ? f.description : result.description,
        isbn: canonical,
      }));
      setAutofillState({
        status: 'found',
        message: `Found: ${result.title}${result.author ? ` — ${result.author}` : ''}`,
      });
    } catch (err) {
      console.error('ISBN lookup failed:', err);
      setAutofillState({
        status: 'error',
        message: err?.message || 'Lookup failed. Check your connection and try again.',
      });
    }
  };

  const validate = () => {
    if (form.title.trim().length < 2) return 'Title is required.';
    if (form.author.trim().length < 2) return 'Author is required.';
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) return 'Enter a valid price.';
    if (!CONDITIONS.some((c) => c.value === form.condition)) return 'Pick a condition.';
    if (!isEdit && !imageFile) return 'Please add a photo of the book.';
    if (form.isbn && !parseIsbn(form.isbn)) {
      return 'ISBN should be 10 or 13 digits, or leave it blank.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) return setError(v);

    setSubmitting(true);
    try {
      let image = null;
      if (imageFile) {
        image = await uploadListingImage(user.uid, imageFile);
      }
      // Persist the canonical ISBN form (stripped of dashes/spaces).
      const payload = {
        ...form,
        isbn: form.isbn ? parseIsbn(form.isbn) : '',
      };
      if (isEdit) {
        await updateListing(listing.id, payload, image);
      } else {
        await createListing(
          user,
          { ...payload, sellerName: profile?.username || user.displayName || '' },
          image
        );
      }
      onClose({ saved: true });
    } catch (err) {
      console.error('Save listing failed:', err);
      setError(err?.message || 'Could not save the listing. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/60 p-0 dark:bg-black/70 sm:items-center sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-slate-100">
            {isEdit ? 'Edit listing' : 'List a book for sale'}
          </h2>
          <button
            onClick={() => !submitting && onClose()}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="space-y-5 px-6 py-5">
            {/* Autofill via ISBN */}
            <IsbnAutofill
              value={isbnInput}
              onChange={setIsbnInput}
              onLookup={handleAutofill}
              state={autofillState}
            />

            {/* Image uploader */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-800 dark:text-slate-200">
                Cover photo {!isEdit && <span className="text-brand-600 dark:text-brand-400">*</span>}
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-brand-500/60 dark:hover:bg-brand-500/5 sm:aspect-[16/9]"
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/60 via-transparent p-3 opacity-0 transition group-hover:opacity-100">
                      <span className="rounded-md bg-white/95 px-3 py-1 text-xs font-medium text-stone-800 dark:bg-slate-100/95 dark:text-slate-900">
                        Change photo
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-stone-500 dark:text-slate-400">
                    <ImagePlus className="h-8 w-8" />
                    <p className="text-sm font-medium">Tap to upload a photo</p>
                    <p className="text-xs">JPG, PNG or WebP — up to 5 MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="title"
                label="Book title"
                value={form.title}
                onChange={update('title')}
                placeholder="The Great Gatsby"
                required
              />
              <Field
                id="author"
                label="Author"
                value={form.author}
                onChange={update('author')}
                placeholder="F. Scott Fitzgerald"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="price"
                label="Price"
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                value={form.price}
                onChange={update('price')}
                placeholder="299"
                required
                prefix={CURRENCY_SYMBOL}
              />
              <div>
                <label
                  htmlFor="condition"
                  className="mb-1.5 block text-sm font-medium text-stone-800 dark:text-slate-200"
                >
                  Condition <span className="text-brand-600 dark:text-brand-400">*</span>
                </label>
                <select
                  id="condition"
                  value={form.condition}
                  onChange={update('condition')}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-brand-500/30"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium text-stone-800 dark:text-slate-200"
              >
                Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={update('description')}
                rows={4}
                placeholder="Edition, any markings, why you loved it…"
                className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-stone-900 placeholder-stone-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-brand-500/30"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-stone-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting
                ? isEdit
                  ? 'Saving…'
                  : 'Posting…'
                : isEdit
                  ? 'Save changes'
                  : 'Post book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IsbnAutofill({ value, onChange, onLookup, state }) {
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onLookup();
    }
  };

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
      <label
        htmlFor="isbn-autofill"
        className="flex items-center gap-2 text-sm font-medium text-stone-800 dark:text-slate-200"
      >
        <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        Autofill via ISBN
      </label>
      <p className="mt-0.5 text-xs text-stone-500 dark:text-slate-400">
        Got the book's ISBN? We'll fetch the title, author, and description so you only need a price and a photo.
      </p>

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-slate-500" />
          <input
            id="isbn-autofill"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="978-0-7432-7356-5"
            inputMode="numeric"
            className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-stone-900 placeholder-stone-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-brand-500/30"
          />
        </div>
        <button
          type="button"
          onClick={onLookup}
          disabled={state.status === 'loading'}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {state.status === 'loading' ? 'Looking up…' : 'Autofill'}
        </button>
      </div>

      <AutofillStatus state={state} />
    </div>
  );
}

function AutofillStatus({ state }) {
  if (state.status === 'idle') return null;

  if (state.status === 'found') {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{state.message}</span>
      </div>
    );
  }

  if (state.status === 'not_found') {
    return (
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        {state.message}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        {state.message}
      </div>
    );
  }

  return null;
}

function Field({ id, label, prefix, ...inputProps }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-stone-800 dark:text-slate-200"
      >
        {label}
        {inputProps.required && <span className="ml-0.5 text-brand-600 dark:text-brand-400">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-slate-400">
            {prefix}
          </span>
        )}
        <input
          id={id}
          {...inputProps}
          className={`w-full rounded-lg border border-stone-200 bg-white py-2.5 ${
            prefix ? 'pl-7' : 'pl-3'
          } pr-3 text-stone-900 placeholder-stone-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-brand-500/30`}
        />
      </div>
    </div>
  );
}

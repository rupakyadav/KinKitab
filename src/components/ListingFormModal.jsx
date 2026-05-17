import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import {
  CONDITIONS,
  createListing,
  updateListing,
  uploadListingImage,
} from '../lib/listings.js';
import { CURRENCY_SYMBOL } from '../lib/money.js';
import { useAuth } from '../context/AuthContext.jsx';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const emptyForm = {
  title: '',
  author: '',
  price: '',
  condition: 'used',
  description: '',
};

/**
 * Create + edit listing modal.
 * - When `listing` is null: create flow.
 * - When `listing` is provided: edit flow (image upload optional).
 */
export default function ListingFormModal({ open, onClose, listing }) {
  const { user, profile } = useAuth();
  const isEdit = Boolean(listing);

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Reset / hydrate when the modal opens.
  useEffect(() => {
    if (!open) return;
    setError('');
    setImageFile(null);
    if (listing) {
      setForm({
        title: listing.title || '',
        author: listing.author || '',
        price: String(listing.price ?? ''),
        condition: listing.condition || 'used',
        description: listing.description || '',
      });
      setImagePreview(listing.imageUrl || '');
    } else {
      setForm(emptyForm);
      setImagePreview('');
    }
  }, [open, listing]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && !submitting && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, onClose]);

  // Revoke object URLs to avoid memory leaks.
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

  const validate = () => {
    if (form.title.trim().length < 2) return 'Title is required.';
    if (form.author.trim().length < 2) return 'Author is required.';
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) return 'Enter a valid price.';
    if (!CONDITIONS.some((c) => c.value === form.condition)) return 'Pick a condition.';
    if (!isEdit && !imageFile) return 'Please add a photo of the book.';
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
      if (isEdit) {
        await updateListing(listing.id, form, image);
      } else {
        await createListing(
          user,
          { ...form, sellerName: profile?.username || user.displayName || '' },
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/60 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">
            {isEdit ? 'Edit listing' : 'List a book for sale'}
          </h2>
          <button
            onClick={() => !submitting && onClose()}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="space-y-5 px-6 py-5">
            {/* Image uploader */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-800">
                Cover photo {!isEdit && <span className="text-brand-600">*</span>}
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 transition hover:border-brand-400 hover:bg-brand-50/40 sm:aspect-[16/9]"
              >
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/60 via-transparent p-3 opacity-0 transition group-hover:opacity-100">
                      <span className="rounded-md bg-white/95 px-3 py-1 text-xs font-medium text-stone-800">
                        Change photo
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-stone-500">
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

            {/* Title + Author */}
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

            {/* Price + Condition */}
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
                  className="mb-1.5 block text-sm font-medium text-stone-800"
                >
                  Condition <span className="text-brand-600">*</span>
                </label>
                <select
                  id="condition"
                  value={form.condition}
                  onChange={update('condition')}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium text-stone-800"
              >
                Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={update('description')}
                rows={4}
                placeholder="Edition, any markings, why you loved it…"
                className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-stone-900 placeholder-stone-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-stone-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
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

function Field({ id, label, prefix, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-800">
        {label}
        {inputProps.required && <span className="ml-0.5 text-brand-600">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
            {prefix}
          </span>
        )}
        <input
          id={id}
          {...inputProps}
          className={`w-full rounded-lg border border-stone-200 bg-white py-2.5 ${
            prefix ? 'pl-7' : 'pl-3'
          } pr-3 text-stone-900 placeholder-stone-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100`}
        />
      </div>
    </div>
  );
}

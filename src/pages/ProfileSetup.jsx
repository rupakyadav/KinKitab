import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Mail, User as UserIcon, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { saveUserProfile } from '../lib/userProfile.js';

const initialForm = { username: '', phone: '', location: '' };

export default function ProfileSetup() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Hydrate the form once we have the profile (or default to Google name).
  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username || '',
        phone: profile.phone || '',
        location: profile.location || '',
      });
    } else if (user) {
      setForm((f) => ({
        ...f,
        username: f.username || user.displayName?.split(' ')[0] || '',
      }));
    }
  }, [profile, user]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    if (form.username.trim().length < 2) return 'Username must be at least 2 characters.';
    if (form.location.trim().length < 2) return 'Please enter your city or area.';
    if (form.phone && !/^[\d\s+()-]{7,}$/.test(form.phone.trim())) {
      return 'Phone number looks off. Use digits, spaces, +, - or parentheses.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) return setError(v);

    setSaving(true);
    try {
      await saveUserProfile(user, form);
      await refreshProfile(user.uid);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Save profile failed:', err);
      setError(err?.message || 'Could not save your profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const isExisting = Boolean(profile);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-slate-100 sm:text-3xl">
          {isExisting ? 'Edit your profile' : 'Set up your profile'}
        </h1>
        <p className="mt-1 text-stone-600 dark:text-slate-300">
          {isExisting
            ? 'Update your contact details and location.'
            : 'A few details so buyers and sellers can reach you.'}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
      >
        {/* Identity (read-only) */}
        <div className="mb-6 flex items-center gap-4 rounded-xl bg-stone-50 p-4 dark:bg-slate-800/60">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || 'You'}
              className="h-14 w-14 rounded-full ring-2 ring-brand-100 dark:ring-brand-500/30"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-stone-900 dark:text-slate-100">
              {user?.displayName}
            </p>
            <p className="flex items-center gap-1 truncate text-sm text-stone-500 dark:text-slate-400">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <Field
            id="username"
            label="Username"
            icon={UserIcon}
            value={form.username}
            onChange={update('username')}
            placeholder="e.g. bookworm_alex"
            required
          />
          <Field
            id="phone"
            label="Phone number"
            icon={Phone}
            value={form.phone}
            onChange={update('phone')}
            placeholder="e.g. +91 98765 43210"
            type="tel"
            hint="Shown to buyers when they want to arrange pickup."
          />
          <Field
            id="location"
            label="Location"
            icon={MapPin}
            value={form.location}
            onChange={update('location')}
            placeholder="City or neighborhood"
            required
            hint="Used to match you with nearby buyers (cash on delivery)."
          />
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {isExisting && (
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : isExisting ? 'Save changes' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ id, label, icon: Icon, hint, ...inputProps }) {
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
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-slate-500" />
        )}
        <input
          id={id}
          {...inputProps}
          className={`w-full rounded-lg border border-stone-200 bg-white py-2.5 ${
            Icon ? 'pl-10' : 'pl-3'
          } pr-3 text-stone-900 placeholder-stone-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-brand-500 dark:focus:ring-brand-500/30`}
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

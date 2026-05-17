import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Tag, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Welcome() {
  const { user, profile, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Already signed in? Send returning users to the dashboard;
  // first-time users go through profile setup.
  useEffect(() => {
    if (loading || !user) return;
    navigate(profile ? '/dashboard' : '/profile-setup', { replace: true });
  }, [user, profile, loading, navigate]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Redirect happens via the effect above once auth state updates.
    } catch (err) {
      console.error('Google sign-in failed:', err);
      alert('Sign-in failed. Check the console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-amber-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-brand-600" />
          <span className="text-xl font-bold tracking-tight text-stone-900">
            KinKitab
          </span>
        </div>
        <button
          onClick={handleSignIn}
          className="rounded-lg px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white/60"
        >
          Sign in
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-12 pb-20 md:pt-20">
        <section className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-stone-900 md:text-5xl">
              A second life for{' '}
              <span className="text-brand-600">every book.</span>
            </h1>
            <p className="mt-5 text-lg text-stone-600">
              Buy and sell pre-loved books in your city. List in minutes,
              discover in seconds, pay on delivery.
            </p>

            <div className="mt-8">
              <button
                onClick={handleSignIn}
                className="inline-flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-5 py-3 text-stone-800 shadow-sm transition hover:shadow-md"
              >
                <GoogleLogo />
                <span className="font-medium">Sign in with Google</span>
              </button>
              <p className="mt-3 text-xs text-stone-500">
                We use Google to keep things safe and password-free.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FeatureCard
              icon={<Tag className="h-5 w-5" />}
              title="List in minutes"
              body="Snap a photo, set a price, you're done."
            />
            <FeatureCard
              icon={<Search className="h-5 w-5" />}
              title="Find anything"
              body="Search by title, author, or ISBN."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Verified users"
              body="Real Google profiles, no anonymous shenanigans."
            />
            <FeatureCard
              icon={<BookOpen className="h-5 w-5" />}
              title="Cash on Delivery"
              body="Hand over the book, take the cash. Simple."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/70 bg-white/50">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-stone-500">
          © {new Date().getFullYear()} KinKitab — built with care.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, body }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600">{body}</p>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.5 26.7 36.5 24 36.5c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.5 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41 35 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

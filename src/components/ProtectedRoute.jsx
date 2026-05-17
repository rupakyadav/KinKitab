import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-stone-500">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return children;
}

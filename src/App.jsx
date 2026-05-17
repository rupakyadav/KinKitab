import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome.jsx';
import ProfileSetup from './pages/ProfileSetup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MyListings from './pages/MyListings.jsx';
import BookDetail from './pages/BookDetail.jsx';
import Inbox from './pages/Inbox.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public landing — no navbar here */}
      <Route path="/" element={<Welcome />} />

      {/* Authenticated app — wrapped in AppLayout so the navbar shows on every page below */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/inbox/:chatId" element={<Inbox />} />
      </Route>

      {/* Anything else → home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

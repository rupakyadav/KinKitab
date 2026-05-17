import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

/**
 * Layout for all authenticated pages.
 * The Welcome (landing) page does NOT use this layout, so the navbar
 * appears everywhere except there, per the spec.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

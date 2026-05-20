import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { subscribeToFavorites, toggleFavorite } from '../lib/favorites.js';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    return subscribeToFavorites(user.uid, setFavorites);
  }, [user]);

  const isFavorite = (bookId) => favorites.includes(bookId);

  const toggle = async (bookId) => {
    if (!user) return;
    try {
      await toggleFavorite(user.uid, bookId, isFavorite(bookId));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return ctx;
}

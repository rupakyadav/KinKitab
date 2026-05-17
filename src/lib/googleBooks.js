import { parseIsbn } from './isbn.js';

const ENDPOINT = 'https://www.googleapis.com/books/v1/volumes';

/**
 * Look up a book by ISBN via the public Google Books API.
 * Returns { title, authors, author, description, isbn, thumbnail } or null
 * when nothing is found. Throws on network / non-2xx responses so callers
 * can show a clear error.
 */
export async function lookupByIsbn(rawIsbn) {
  const isbn = parseIsbn(rawIsbn);
  if (!isbn) throw new Error('Enter a valid 10 or 13 digit ISBN.');

  const url = `${ENDPOINT}?q=isbn:${isbn}&maxResults=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Books request failed (${res.status}).`);
  }
  const data = await res.json();
  const item = data?.items?.[0];
  if (!item) return null;

  const v = item.volumeInfo || {};
  const authors = Array.isArray(v.authors) ? v.authors : [];
  const thumb =
    v.imageLinks?.extraLarge ||
    v.imageLinks?.large ||
    v.imageLinks?.medium ||
    v.imageLinks?.thumbnail ||
    v.imageLinks?.smallThumbnail ||
    '';

  return {
    isbn,
    title: v.title || '',
    authors,
    author: authors.join(', '),
    description: v.description || '',
    thumbnail: thumb,
  };
}

# KinKitab — Product Specification

## 1. Vision
KinKitab is a community-driven marketplace where readers can buy and sell used books. The goal is to make pre-loved books easy to discover, affordable to buy, and simple to sell, while giving each book a second life.

## 2. Target Users
- **Sellers**: Students, casual readers, and book hoarders looking to declutter and earn from books they no longer need.
- **Buyers**: Budget-conscious readers, students hunting for textbooks, and collectors looking for out-of-print titles.

## 3. Core Value Propositions
- Affordable access to books vs. buying new.
- Frictionless listing flow (snap a photo, set a price, done).
- Trust through verified Google sign-in profiles.
- Cash on Delivery to remove payment friction in early markets.

## 4. MVP Feature Set

### 4.1 Authentication & Profiles
- Sign in with Google (Firebase Auth).
- First-time users complete a profile: display name, city, phone (optional), short bio.
- Profile page shows user's active listings and basic stats (books listed, books sold).

### 4.2 Listing a Book
- Authenticated users can create a listing with:
  - Title, author, ISBN (optional)
  - Condition (New, Like New, Good, Fair, Poor)
  - Genre / category
  - Price (in local currency)
  - Description
  - Up to 5 photos (Firebase Storage)
  - Pickup city
- Edit and delete own listings.
- Mark a listing as "Sold" to remove it from search.

### 4.3 Browse & Search
- Home feed: recent listings, with thumbnail, title, price, city.
- Search by title, author, or ISBN.
- Filters: condition, price range, city, genre.
- Sort by: newest, price (low to high, high to low).

### 4.4 Book Detail Page
- Full image gallery, all metadata, seller's display name and city.
- "Contact Seller" button reveals seller phone or opens an in-app message thread (in-app messaging deferred to v2; MVP shows masked contact info on request).
- Report listing (flag for review).

### 4.5 Transactions (MVP)
- **Cash on Delivery only.** No payment processing.
- Buyer contacts seller, they coordinate handoff.
- After handoff, seller marks the listing as sold.
- Optional: buyer leaves a star rating on the seller (1-5).

### 4.6 Trust & Safety (Lightweight MVP)
- Email verification through Google sign-in.
- Report listing / report user.
- Admin can soft-delete listings via a Firestore flag.

## 5. Out of Scope for MVP
- Online payments (Stripe, Razorpay, etc.)
- In-app chat
- Shipping integrations
- Mobile native apps
- Multi-language support
- Wishlist / favorites (likely v1.1)

## 6. Success Metrics
- Number of listings created per week
- Number of unique active sellers and buyers
- Listings marked sold / total listings (sell-through rate)
- 7-day retention of new users

## 7. User Stories (MVP)

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| U1 | Visitor | Sign in with Google | I don't have to remember a password |
| U2 | New user | Set up my profile | Buyers/sellers can trust me |
| U3 | Seller | List a book with photos and a price | I can find a buyer |
| U4 | Seller | Edit or delete my listing | I can correct mistakes or remove it |
| U5 | Seller | Mark a book as sold | It stops showing in search |
| U6 | Buyer | Search by title or author | I can find specific books |
| U7 | Buyer | Filter by city and price | I find books I can afford and pick up |
| U8 | Buyer | View seller contact info | I can arrange COD pickup |
| U9 | Any user | Report a listing | Bad listings get removed |

## 8. Future Roadmap (Post-MVP)
- v1.1: Wishlist, in-app messaging, push notifications
- v1.2: Online payments + escrow
- v1.3: Shipping integration, address book
- v2.0: Recommendations, book clubs, reading lists

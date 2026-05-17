# KinKitab — Tech Stack Specification

## 1. Overview
KinKitab is a single-page web application backed by Firebase. We chose this stack because it lets a small team (or a solo vibe-coder) ship a real product without managing servers, while keeping the door open to scale later.

## 2. Frontend

| Concern | Choice | Why |
|--------|--------|-----|
| Framework | React 18 (with Vite) | Fast dev server, modern tooling, huge ecosystem |
| Language | JavaScript (TypeScript optional later) | Lower friction for first-time builders |
| Styling | Tailwind CSS | Utility-first, fast iteration, clean modern feel |
| Routing | React Router v6 | Standard for React SPAs |
| State | React Context + hooks for auth; component state elsewhere | Simple, no Redux overhead at MVP scale |
| Forms | React Hook Form | Lightweight validation, less boilerplate |
| Icons | lucide-react | Clean, modern, tree-shakable |
| Build | Vite | Faster than Create React App, simpler config |

## 3. Backend (Firebase)

| Service | Purpose |
|---------|---------|
| Firebase Auth | Google sign-in, session management |
| Cloud Firestore | Users, listings, reports, ratings |
| Firebase Storage | Listing images (up to 5 per listing) |
| Firebase Hosting | Serve the built React app |
| Firebase Security Rules | Enforce that users can only edit their own data |

### 3.1 Firestore Data Model (initial draft)

```
users/{uid}
  displayName: string
  email: string
  city: string
  phone: string?
  bio: string?
  photoURL: string
  createdAt: timestamp
  rating: { sum: number, count: number }

listings/{listingId}
  sellerId: string (uid)
  title: string
  author: string
  isbn: string?
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
  genre: string
  price: number
  currency: string  // e.g. 'INR', 'USD'
  description: string
  images: string[]  // Storage URLs
  city: string
  status: 'active' | 'sold' | 'removed'
  createdAt: timestamp
  updatedAt: timestamp
  searchKeywords: string[]  // lowercased title + author tokens for basic search

reports/{reportId}
  reporterId: string
  targetType: 'listing' | 'user'
  targetId: string
  reason: string
  createdAt: timestamp
  status: 'open' | 'reviewed' | 'dismissed'
```

### 3.2 Security Rules (high level)
- `users/{uid}`: read by anyone, write only by the owning uid.
- `listings/{id}`: read by anyone if `status == 'active'` or if requester is the seller; write only by the seller.
- `reports/{id}`: create by any authenticated user; read/update only by admins (admin claim).
- Storage: write only by the authenticated user under `listings/{uid}/...`; read public.

## 4. Search Strategy
For MVP, we'll do client-side filtering on a `searchKeywords` array stored on each listing (lowercased tokens of title + author). This works for hundreds of listings. When we outgrow it, we'll plug in Algolia or Typesense via a Cloud Function trigger.

## 5. Payments
None at MVP. All transactions are Cash on Delivery, coordinated off-platform between buyer and seller.

## 6. Deployment
- **Hosting**: Firebase Hosting (single command: `firebase deploy`)
- **Environments**: one Firebase project for dev/prod at MVP. We can split later.
- **CI/CD**: optional GitHub Actions running `firebase deploy` on push to `main`. Skip for week one.

## 7. Project Structure (planned)

```
kinkitab/
├── specs/
│   ├── product-spec.md
│   └── tech-stack-spec.md
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── lib/
│   │   └── firebase.js          # Firebase init + exports
│   ├── context/
│   │   └── AuthContext.jsx      # Auth state provider
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── BookCard.jsx
│   │   ├── ImageUploader.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── Home.jsx             # Browse / search
│   │   ├── BookDetail.jsx
│   │   ├── NewListing.jsx
│   │   ├── EditListing.jsx
│   │   ├── Profile.jsx
│   │   ├── MyListings.jsx
│   │   └── SignIn.jsx
│   └── utils/
│       └── search.js            # Keyword tokenizer
├── firebase.json
├── firestore.rules
├── storage.rules
├── .env.local                   # Firebase config (gitignored)
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── package.json
└── README.md
```

## 8. Dependencies (initial)

**Runtime**
- react, react-dom
- react-router-dom
- firebase
- react-hook-form
- lucide-react

**Dev**
- vite, @vitejs/plugin-react
- tailwindcss, postcss, autoprefixer
- eslint, prettier (optional)

## 9. Coding Conventions
- Functional components only.
- Tailwind classes inline; extract to components when repeated 3+ times.
- File names: `PascalCase` for components, `camelCase` for utilities.
- Keep Firebase calls inside `src/lib/` or hooks, never directly in JSX.

## 10. Risks & Open Questions
- **Spam listings**: rate-limit listing creation in security rules (e.g., max N per day per user) — confirm during build.
- **Image moderation**: out of scope for MVP; rely on user reports.
- **Search scale**: revisit Algolia/Typesense after ~500 listings.
- **Free-tier limits**: Firebase free tier is generous but Storage egress can bite; monitor.

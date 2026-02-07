# SparkDeck Roadmap (Draft)

This roadmap outlines the near- to mid-term development plan for SparkDeck, with a focus on persistence, accessibility, scalability, and future discoverability. The goal is to ship incrementally while protecting the existing accessible UI and minimizing risky migrations.

---

## Guiding Principles

- Accessibility-first, always (screen readers, keyboard users, predictable semantics)
- Human-first UX (clear privacy, no surprises)
- Vanilla JS for now (clarity > premature abstraction)
- Migrate only when real constraints appear
- Ship in phases so SparkDeck becomes usable, then navigable, then discoverable

---

## Phase 1: Make SparkDeck “Real” (Auth, Backend, Deploy)

### 1. Authentication (Firebase Auth)
**Goal:** Users can sign in and access their decks across devices.

- Set up Firebase project
- Configure Firebase Auth
  - Email/password (initial)
  - Optional: magic links later
- Handle auth states (signed in / signed out)
- Secure token handling on the frontend
- Integrate with existing Vanilla JS app (no framework migration)

Accessibility considerations:
- Fully accessible login and signup forms
- Clear error messaging (announced by screen readers)
- Focus management on auth state changes

---

### 2. Backend & Data Persistence (Neon / Postgres)
**Goal:** Decks and folders persist reliably per user.

- Connect authenticated users to Neon database
- Define core data models:
  - Users
  - Decks
  - Folders
- Add `visibility` field to decks early:
  - `private` (default)
  - `public`
  - `unlisted`
- Ensure database schema does not block future public sharing

---

### 3. Backend Architecture Decision (API Layer)
**Goal:** Secure, scalable access to data without exposing the database.

SparkDeck will use a **server-side API layer** between the frontend and the Neon database.

- The frontend will NOT talk directly to the database
- API endpoints will be implemented using **Netlify Functions**
- Each API request will:
  - Verify the Firebase ID token
  - Extract the authenticated user ID
  - Enforce ownership and access rules
  - Perform database operations against Neon

This approach:
- Keeps database credentials off the client
- Prevents unauthorized data access
- Allows validation, rate limiting, and future schema changes
- Mirrors a traditional, secure web architecture while remaining framework-agnostic

---

### 4. Deployment
**Goal:** SparkDeck lives on the internet, not just localhost.

- Deploy to Netlify
- Configure environment variables (Firebase, Neon)
- Decide and reserve URL zones early (even if not implemented yet):
  - `/app` → logged-in SparkDeck (current one-page app)
  - `/decks/...` → future public/unlisted deck pages
- Purchase and connect custom domain (sparkdeck.app if available)

---

## Phase 2: Navigation & Structure (Links + Routing)

### 5. Link-Based Navigation
**Goal:** Replace button-based navigation with semantic links.

- Convert folder items from buttons → `<a>` links
- Preserve existing drill-down behavior
- Enable:
  - Open in new tab
  - Copy link
  - Browser back/forward support

Accessibility considerations:
- Links used for navigation, buttons reserved for actions
- No fake links (`href="#"`)
- Predictable keyboard behavior

---

### 6. Breadcrumb Navigation
**Goal:** Clear orientation and easy traversal of folder hierarchy.

- Implement breadcrumbs as links
- Wrap breadcrumbs in a `nav` landmark with an accessible label
- Each breadcrumb links “up” the hierarchy
- Ensure screen readers announce structure correctly

---

### 7. Client-Side Routing (App Only)
**Goal:** Maintain a smooth one-page app experience while supporting real URLs.

- Use the History API (`pushState`, `popstate`) for routing
- Update the URL during navigation without full page reloads
- Preserve browser back/forward behavior
- Manage focus on route changes (e.g., move focus to main heading)

**Important distinction:**
- Client-side routing is for the **authenticated SparkDeck app**
- Public and shareable pages will NOT rely on client-side rendering alone

---

## Phase 3: Privacy & Sharing

### 8. Deck Visibility Controls
**Goal:** Give users explicit control over who can see their decks.

- Add visibility control in the **Create Deck tab**
  - Options:
    - Private (only you)
    - Public (anyone on the internet can view; searchable)
    - Unlisted (anyone with the link can view; not indexed)
- Default visibility: **Private**
- The same control will also be available in the **Edit Deck** view

Helper text will clearly explain the implications of each option.

---

## Phase 4: Public Pages & Discoverability

### 9. Public & Unlisted Deck Pages (Server-Rendered or Pre-Generated)
**Goal:** Shareable, crawlable deck previews without exposing the full app.

- Create public-facing deck preview pages with real HTML:
  - Deck title
  - Description
  - Subject/category
  - Card count
  - Sample cards (read-only)
- Pages will be:
  - Server-rendered via Netlify Functions **or**
  - Pre-generated static HTML
- Visibility rules:
  - Private → no public page
  - Unlisted → public URL + `noindex`
  - Public → indexable

**Rationale:**
- Search engines and social crawlers require HTML at request time
- Open Graph and SEO metadata must exist before JavaScript runs

---

### 10. SEO & Social Sharing
**Goal:** Make SparkDeck discoverable via search and sharing.

- Add Open Graph / social preview meta tags
- Use clean, human-readable URLs:
  - `/decks/biology-101`
- Generate sitemap for public decks
- Optional structured data (Schema.org) for educational content
- Position SparkDeck as an accessibility-first Quizlet alternative

---

## Phase 5: Future Considerations (Not Yet)

- Framework migration (only if/when required)
- Advanced analytics
- AI-assisted features (paid tier, token-aware)
- Educator/classroom features
- Folder-level sharing

---

## Notes

- Vanilla JS is intentional at this stage for clarity, accessibility, and ease of refactor.
- Migration is a solvable future problem, not a current blocker.
- The existing accessible UI should be preserved throughout all changes.
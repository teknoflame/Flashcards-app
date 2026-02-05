# SparkDeck Next.js Migration Plan

**Document Purpose**: This is a detailed migration plan for converting SparkDeck from a vanilla JavaScript app to a Next.js application with Auth0 authentication, Neon PostgreSQL database, and Netlify deployment.

**For Claude**: Use this document to guide the migration. The user is new to Next.js, Auth0, and Neon, so provide clear explanations and guidance throughout.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Architecture](#2-current-architecture)
3. [Target Architecture](#3-target-architecture)
4. [Tech Stack Decisions](#4-tech-stack-decisions)
5. [Migration Phases](#5-migration-phases)
6. [Database Schema](#6-database-schema)
7. [API Routes](#7-api-routes)
8. [Component Structure](#8-component-structure)
9. [Code to Preserve](#9-code-to-preserve)
10. [Environment Variables](#10-environment-variables)
11. [Deployment Configuration](#11-deployment-configuration)
12. [Task Checklist](#12-task-checklist)

---

## 1. Project Overview

### What We're Building

SparkDeck is a flashcard application. We're migrating it from:
- **Current**: Vanilla JS, localStorage, static files
- **Target**: Next.js, Auth0, Neon PostgreSQL, Netlify

### Why This Migration

- **User accounts**: People can log in and access their decks from any device
- **Cloud sync**: Decks persist in a database, not just the browser
- **Cross-device**: Same account works on desktop and mobile browsers

### User's Context

- Free tier on all services (Neon, Auth0, Netlify)
- New to these technologies - needs clear guidance
- Wants to preserve as much existing code/UX as possible
- Strong focus on accessibility (current app is WCAG compliant)

---

## 2. Current Architecture

### Tech Stack
- Vanilla JavaScript (ES6+)
- HTML5, CSS3
- localStorage for persistence
- No build tools or dependencies
- Node.js static file server (development only)

### File Structure
```
Flashcards-app/
├── index.html          # SPA shell (2,755 lines, includes inline JS)
├── app.js              # Core logic - SparkDeckApp class (881 lines)
├── styles.css          # Styling (253 lines)
├── server.js           # Dev server (72 lines)
├── package.json        # Minimal, no dependencies
├── README.md           # User docs
└── CLAUDE.md           # AI assistant guide
```

### Current Data Models

**Deck Object**:
```javascript
{
    name: "Biology Chapter 5",
    category: "Biology",
    folderId: "f_abc123" | null,
    cards: [...],
    created: "2025-12-25T10:30:00.000Z"
}
```

**Card Object**:
```javascript
{
    front: "What is photosynthesis?",
    back: "Process of converting light...",
    mediaUrl: "https://youtube.com/..." | null
}
```

**Folder Object**:
```javascript
{
    id: "f_lx3k9p_abc123",
    name: "Chemistry Notes",
    created: "2025-12-25T10:30:00.000Z"
}
```

### Key Features to Preserve
1. Deck Management (create, delete, organize)
2. Card Creation (auto-generate from notes, manual entry)
3. Study Mode (flip cards, navigate, progress tracking)
4. Folder Organization (create, rename, delete, move decks)
5. Media Embedding (YouTube videos on card backs)
6. Full keyboard navigation
7. Screen reader support (ARIA live regions, announcements)
8. Accessibility settings (dark mode, font size, high contrast, reduced motion)
9. Stats tracking with reset functionality

---

## 3. Target Architecture

### Overview
```
┌─────────────────────────────────────────────────────────┐
│                        Netlify                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │                   Next.js App                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│  │  │   Pages/    │  │    API      │  │  Auth0    │  │  │
│  │  │ Components  │  │   Routes    │  │ Middleware│  │  │
│  │  └─────────────┘  └──────┬──────┘  └─────┬─────┘  │  │
│  └───────────────────────────┼────────────────┼──────┘  │
└──────────────────────────────┼────────────────┼─────────┘
                               │                │
                               ▼                ▼
                        ┌────────────┐   ┌────────────┐
                        │   Neon     │   │   Auth0    │
                        │ PostgreSQL │   │  Service   │
                        └────────────┘   └────────────┘
```

### Data Flow
1. User visits app → Auth0 checks session
2. If not logged in → Show landing page with login option
3. If logged in → Fetch user's decks from Neon via API routes
4. All CRUD operations go through Next.js API routes to Neon
5. Study stats stored per-user in database

---

## 4. Tech Stack Decisions

### Framework: Next.js 14+ (App Router)
- **Why**: Modern React framework, built-in API routes, excellent Auth0/Netlify support
- **Router**: App Router (not Pages Router) - it's the current standard

### Database: Neon PostgreSQL
- **Why**: Serverless, generous free tier, PostgreSQL compatibility
- **ORM**: Prisma (type-safe, great DX, works well with Neon)

### Authentication: Auth0
- **Why**: Handles auth complexity, free tier supports 7,500 users
- **Library**: `@auth0/nextjs-auth0` (official SDK)

### Hosting: Netlify
- **Why**: Free tier, automatic deployments, serverless functions
- **Config**: `netlify.toml` for build settings

### Styling: Keep existing CSS
- **Why**: Preserve current look, minimize rewrite
- **Approach**: CSS Modules or global CSS import

### State Management: React Context + hooks
- **Why**: Simple, no extra dependencies, sufficient for this app

---

## 5. Migration Phases

### Phase 1: Project Setup & Static UI (No Auth/DB)

**Goal**: Get a working Next.js app that looks like the current app

**Tasks**:
1. Create new Next.js project in a `sparkdeck-next/` directory
2. Set up folder structure
3. Port CSS (global styles)
4. Create React components for all UI elements
5. Implement client-side state (temporary, will be replaced)
6. Verify all UI renders correctly
7. Test accessibility (keyboard nav, screen reader)

**Deliverable**: App runs locally, looks identical to current app, uses in-memory state

### Phase 2: Authentication (Auth0)

**Goal**: Users can sign up, log in, log out

**Tasks**:
1. Create Auth0 Application (Regular Web Application)
2. Configure Auth0 settings (callbacks, logout URLs)
3. Install `@auth0/nextjs-auth0`
4. Set up environment variables
5. Create auth API routes (`/api/auth/[auth0]`)
6. Add AuthProvider to app layout
7. Create login/logout buttons
8. Add protected route middleware
9. Create landing page for logged-out users
10. Test auth flow end-to-end

**Deliverable**: Users can create accounts and log in, app shows user info

### Phase 3: Database (Neon + Prisma)

**Goal**: Decks, cards, folders persist in PostgreSQL

**Tasks**:
1. Get Neon connection string
2. Install Prisma and configure for Neon
3. Define database schema (see Section 6)
4. Run migrations
5. Create API routes for CRUD operations (see Section 7)
6. Update React components to use API routes
7. Migrate from localStorage logic to API calls
8. Handle loading/error states
9. Test data persistence

**Deliverable**: Data persists in Neon, survives browser refresh, works across devices

### Phase 4: Deployment (Netlify)

**Goal**: App is live on the internet

**Tasks**:
1. Create `netlify.toml` configuration
2. Connect GitHub repo to Netlify
3. Set environment variables in Netlify dashboard
4. Configure Auth0 with production URLs
5. Update Neon connection for production
6. Deploy and test
7. Set up custom domain (optional)

**Deliverable**: App accessible at a public URL

### Phase 5: Polish & Cleanup

**Goal**: Production-ready quality

**Tasks**:
1. Error handling and user feedback
2. Loading states and skeletons
3. Offline handling (graceful degradation)
4. Performance optimization
5. Final accessibility audit
6. Remove old vanilla JS files (or archive)
7. Update README and documentation

---

## 6. Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id        String   @id @default(cuid())
  auth0Id   String   @unique
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  folders Folder[]
  decks   Deck[]
  stats   StudyStats?
  settings UserSettings?
}

model Folder {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  decks  Deck[]

  @@unique([userId, name])
}

model Deck {
  id        String   @id @default(cuid())
  name      String
  category  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId   String
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  folderId String?
  folder   Folder? @relation(fields: [folderId], references: [id], onDelete: SetNull)
  cards    Card[]

  @@index([userId])
  @@index([folderId])
}

model Card {
  id        String   @id @default(cuid())
  front     String
  back      String
  mediaUrl  String?
  position  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  deckId String
  deck   Deck   @relation(fields: [deckId], references: [id], onDelete: Cascade)

  @@index([deckId])
}

model StudyStats {
  id              String   @id @default(cuid())
  cardsStudied    Int      @default(0)
  studySessions   Int      @default(0)
  totalStudyTime  Int      @default(0)  // in seconds
  lastStudiedAt   DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UserSettings {
  id             String   @id @default(cuid())
  darkMode       Boolean  @default(false)
  fontSize       String   @default("medium")  // small, medium, large
  highContrast   Boolean  @default(false)
  reducedMotion  Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 7. API Routes

### Route Structure

```
app/
├── api/
│   ├── auth/
│   │   └── [auth0]/
│   │       └── route.ts        # Auth0 handler
│   ├── user/
│   │   └── route.ts            # GET/PUT current user
│   ├── folders/
│   │   ├── route.ts            # GET all, POST create
│   │   └── [id]/
│   │       └── route.ts        # GET, PUT, DELETE single
│   ├── decks/
│   │   ├── route.ts            # GET all, POST create
│   │   └── [id]/
│   │       ├── route.ts        # GET, PUT, DELETE single
│   │       └── cards/
│   │           └── route.ts    # GET, POST, PUT (batch)
│   ├── stats/
│   │   └── route.ts            # GET, PUT, DELETE (reset)
│   └── settings/
│       └── route.ts            # GET, PUT
```

### API Route Examples

**GET /api/decks** - Get all decks for current user
```typescript
// Returns: { decks: Deck[] }
```

**POST /api/decks** - Create a new deck
```typescript
// Body: { name, category?, folderId?, cards: [] }
// Returns: { deck: Deck }
```

**PUT /api/decks/[id]** - Update a deck
```typescript
// Body: { name?, category?, folderId? }
// Returns: { deck: Deck }
```

**DELETE /api/decks/[id]** - Delete a deck
```typescript
// Returns: { success: true }
```

---

## 8. Component Structure

### Folder Structure

```
app/
├── layout.tsx              # Root layout with AuthProvider
├── page.tsx                # Landing page (logged out) or redirect
├── globals.css             # Ported from styles.css
├── (auth)/
│   ├── login/
│   │   └── page.tsx        # Login page
│   └── callback/
│       └── page.tsx        # Auth0 callback handler
├── (app)/
│   ├── layout.tsx          # App shell (tabs, navigation)
│   ├── page.tsx            # Redirect to /decks
│   ├── decks/
│   │   └── page.tsx        # Deck list (My Decks tab)
│   ├── create/
│   │   └── page.tsx        # Create deck (Create tab)
│   ├── study/
│   │   └── [deckId]/
│   │       └── page.tsx    # Study mode
│   └── settings/
│       └── page.tsx        # Settings tab
components/
├── ui/
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   ├── TextInput.tsx
│   └── Select.tsx
├── deck/
│   ├── DeckCard.tsx
│   ├── DeckList.tsx
│   ├── DeckForm.tsx
│   └── DeckActions.tsx
├── card/
│   ├── CardForm.tsx
│   ├── CardPreview.tsx
│   ├── Flashcard.tsx
│   └── MediaEmbed.tsx
├── folder/
│   ├── FolderList.tsx
│   ├── FolderSection.tsx
│   └── FolderActions.tsx
├── study/
│   ├── StudyView.tsx
│   ├── ProgressBar.tsx
│   └── StudyControls.tsx
├── layout/
│   ├── Header.tsx
│   ├── TabNav.tsx
│   └── Announcer.tsx       # ARIA live region
└── auth/
    ├── LoginButton.tsx
    ├── LogoutButton.tsx
    └── UserProfile.tsx
lib/
├── prisma.ts               # Prisma client singleton
├── auth.ts                 # Auth0 config
├── api.ts                  # Client-side API helpers
└── utils.ts                # Shared utilities
hooks/
├── useDecks.ts             # Deck data fetching
├── useFolders.ts           # Folder data fetching
├── useStudySession.ts      # Study mode state
└── useAnnounce.ts          # Screen reader announcements
```

---

## 9. Code to Preserve

### From styles.css (preserve almost entirely)
- All component styles
- Accessibility utilities (.sr-only, focus states)
- Modal styles
- May need minor adjustments for CSS Modules if used

### From app.js (adapt to React)

**Preserve as utility functions**:
- `parseTextToFlashcards()` - Auto-generate logic (lines ~431-486)
- Validation logic

**Adapt to React hooks**:
- Study mode state management
- Card navigation logic

**Adapt to React components**:
- Render logic → JSX
- Event handlers → React event handlers

### Accessibility patterns to preserve
- ARIA live region announcements
- Focus management on modal open/close
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader text (.sr-only)
- Focus trap in modals

---

## 10. Environment Variables

### Local Development (.env.local)

```bash
# Auth0
AUTH0_SECRET='[generate with: openssl rand -hex 32]'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://YOUR_TENANT.auth0.com'
AUTH0_CLIENT_ID='your_client_id'
AUTH0_CLIENT_SECRET='your_client_secret'

# Neon Database
DATABASE_URL='postgresql://user:pass@host/db?sslmode=require'
DIRECT_URL='postgresql://user:pass@host/db?sslmode=require'
```

### Production (Netlify Dashboard)

Same variables, but:
- `AUTH0_BASE_URL` = production URL
- Auth0 Application settings updated with production URLs

---

## 11. Deployment Configuration

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Auth0 Application Settings

**Allowed Callback URLs**:
```
http://localhost:3000/api/auth/callback,
https://your-app.netlify.app/api/auth/callback
```

**Allowed Logout URLs**:
```
http://localhost:3000,
https://your-app.netlify.app
```

**Allowed Web Origins**:
```
http://localhost:3000,
https://your-app.netlify.app
```

---

## 12. Task Checklist

### Phase 1: Project Setup & Static UI

- [ ] Create Next.js project: `npx create-next-app@latest sparkdeck-next`
- [ ] Configure TypeScript (optional but recommended)
- [ ] Set up folder structure per Section 8
- [ ] Port styles.css to globals.css
- [ ] Create base UI components (Button, Modal, Input)
- [ ] Create layout components (Header, TabNav)
- [ ] Create Announcer component for screen reader
- [ ] Create DeckCard and DeckList components
- [ ] Create CardForm and CardPreview components
- [ ] Create Flashcard and StudyView components
- [ ] Create FolderSection and FolderList components
- [ ] Implement tab navigation
- [ ] Implement deck creation flow (in-memory)
- [ ] Implement study mode (in-memory)
- [ ] Implement folder management (in-memory)
- [ ] Test keyboard navigation throughout
- [ ] Test with screen reader
- [ ] Verify visual parity with original app

### Phase 2: Authentication

- [ ] Create Auth0 Application (Regular Web Application type)
- [ ] Note down: Domain, Client ID, Client Secret
- [ ] Configure callback URLs in Auth0
- [ ] Install: `npm install @auth0/nextjs-auth0`
- [ ] Create .env.local with Auth0 variables
- [ ] Create /api/auth/[auth0]/route.ts
- [ ] Wrap app in UserProvider
- [ ] Create LoginButton and LogoutButton components
- [ ] Create landing page for unauthenticated users
- [ ] Add middleware for protected routes
- [ ] Display user info when logged in
- [ ] Test: sign up, log in, log out, session persistence

### Phase 3: Database

- [ ] Get Neon connection string from dashboard
- [ ] Install: `npm install prisma @prisma/client`
- [ ] Initialize Prisma: `npx prisma init`
- [ ] Add schema from Section 6
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Create Prisma client singleton (lib/prisma.ts)
- [ ] Create User on first login (sync with Auth0)
- [ ] Implement /api/folders routes
- [ ] Implement /api/decks routes
- [ ] Implement /api/decks/[id]/cards routes
- [ ] Implement /api/stats routes
- [ ] Implement /api/settings routes
- [ ] Update components to fetch from API
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test CRUD operations end-to-end
- [ ] Verify data persists across sessions

### Phase 4: Deployment

- [ ] Create netlify.toml
- [ ] Install Netlify CLI: `npm install -g netlify-cli`
- [ ] Connect repo to Netlify
- [ ] Add environment variables in Netlify dashboard
- [ ] Update Auth0 with production URLs
- [ ] Deploy: `netlify deploy --prod` or push to main
- [ ] Test production auth flow
- [ ] Test production database operations
- [ ] Verify no console errors

### Phase 5: Polish

- [ ] Add proper error boundaries
- [ ] Add loading skeletons
- [ ] Handle offline gracefully
- [ ] Optimize images and assets
- [ ] Run Lighthouse accessibility audit
- [ ] Fix any accessibility issues
- [ ] Update README with new setup instructions
- [ ] Archive or remove old vanilla JS files
- [ ] Final end-to-end testing

---

## Notes for Claude

1. **Go phase by phase** - Don't jump ahead. Complete each phase before moving to the next.

2. **Test frequently** - After each significant change, verify the app still works.

3. **Preserve accessibility** - This is critical. Every component must be keyboard accessible and screen reader friendly.

4. **Explain to the user** - They're new to this stack. Explain what you're doing and why.

5. **Keep it simple** - Don't over-engineer. This is a personal project with a focus on maintainability.

6. **User will need to**:
   - Create Auth0 Application and provide credentials
   - Provide Neon connection string
   - Set up Netlify site

7. **The original app files are in the same repo** - Reference them for exact UI behavior and accessibility patterns.

---

## Quick Reference: Commands

```bash
# Create Next.js app
npx create-next-app@latest sparkdeck-next --typescript --tailwind --eslint --app --src-dir=false

# Install dependencies
npm install @auth0/nextjs-auth0 prisma @prisma/client

# Prisma commands
npx prisma init
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio  # GUI for database

# Development
npm run dev

# Build
npm run build

# Netlify
netlify login
netlify init
netlify deploy --prod
```

---

**End of Migration Plan**

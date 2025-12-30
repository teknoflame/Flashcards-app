# Backend Integration TODO - SparkDeck

**Last Updated**: 2025-12-30
**Status**: Planning Phase
**Stack**: Neon (PostgreSQL) + Netlify (Hosting/Functions) + Auth0 (Authentication)

---

## Current Architecture

### Client-Side Only (Current)
- **Storage**: localStorage (browser-based, no persistence across devices)
- **Limitations**:
  - No multi-device sync
  - Data lost if browser cache cleared
  - No user accounts
  - No SEO (search engines can't index)
  - No sharing/collaboration features

### Data Structure (localStorage)

**Folders** (`sparkdeck-folders`):
```javascript
{
    id: "f_lx3k9p_abc123",              // String (generated)
    name: "Chemistry",                   // String
    parentFolderId: "f_parent123",       // String | null (null = root level)
    created: "2025-12-25T10:30:00.000Z" // ISO 8601 timestamp
}
```

**Decks** (`sparkdeck-decks`):
```javascript
{
    name: "Biology Chapter 5",           // String
    category: "Biology",                 // String (from dropdown)
    folderId: "f_abc123",               // String | null
    cards: [...],                        // Array of Card objects
    created: "2025-12-25T10:30:00.000Z" // ISO 8601 timestamp
}
```

**Cards** (nested in decks):
```javascript
{
    front: "What is photosynthesis?",    // String
    back: "Process of converting...",    // String
    mediaUrl: "https://youtube.com/..." // String | null (optional)
}
```

**Settings** (`sparkdeck-sounds-muted`):
```javascript
"true" | "false"  // String boolean
```

---

## Target Architecture

### Full Stack (Goal)

```
┌─────────────────────────────────────┐
│   SparkDeck Web App (Netlify)       │
│   - Next.js (SSR/SSG)                │
│   - React Components                 │
│   - Client-side routing              │
└──────────────┬──────────────────────┘
               │
               ├── Auth0 (Authentication)
               │   - Login/Signup
               │   - Session management
               │   - JWT tokens
               │
               ├── Netlify Functions (API)
               │   - /api/folders/*
               │   - /api/decks/*
               │   - /api/cards/*
               │   - /api/sync/*
               │
               └── Neon PostgreSQL (Database)
                   - User data
                   - Folders/Decks/Cards
                   - Study progress
                   - Analytics
```

---

## Phase 1: Database Schema (Neon)

### Tables

**1. Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_auth0_id ON users(auth0_id);
```

**2. Folders Table**
```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT no_self_reference CHECK (id != parent_folder_id)
);

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_folder_id);
```

**3. Decks Table**
```sql
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_decks_folder_id ON decks(folder_id);
```

**4. Cards Table**
```sql
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    media_url TEXT,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_cards_position ON cards(deck_id, position);
```

**5. User Settings Table**
```sql
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    sounds_muted BOOLEAN DEFAULT false,
    theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**6. Study Sessions Table (Future)**
```sql
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    cards_studied INTEGER DEFAULT 0
);
```

---

## Phase 2: Netlify Functions (API Endpoints)

### Folder Endpoints

**GET /api/folders**
- Get all folders for authenticated user
- Supports hierarchical nesting
- Returns: `{ folders: [...] }`

**POST /api/folders**
- Create new folder
- Body: `{ name, parentFolderId }`
- Returns: `{ folder: {...} }`

**PATCH /api/folders/:id**
- Update folder (rename, move)
- Body: `{ name?, parentFolderId? }`
- Returns: `{ folder: {...} }`

**DELETE /api/folders/:id**
- Delete folder (moves subfolders/decks to parent)
- Returns: `{ success: true }`

### Deck Endpoints

**GET /api/decks**
- Get all decks for authenticated user
- Optional query: `?folderId=xxx`
- Returns: `{ decks: [...] }`

**POST /api/decks**
- Create new deck with cards
- Body: `{ name, category, folderId, cards: [...] }`
- Returns: `{ deck: {...} }`

**PATCH /api/decks/:id**
- Update deck (rename, move, update cards)
- Body: `{ name?, category?, folderId?, cards? }`
- Returns: `{ deck: {...} }`

**DELETE /api/decks/:id**
- Delete deck and all cards
- Returns: `{ success: true }`

### Sync Endpoint

**POST /api/sync**
- Sync localStorage data to backend
- Body: `{ folders: [...], decks: [...] }`
- Handles conflicts (merge strategy)
- Returns: `{ folders: [...], decks: [...] }`

### Example Function (Netlify)

```javascript
// netlify/functions/get-folders.js
const { Pool } = require('pg');

exports.handler = async (event, context) => {
    // Auth0 JWT verification
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

    // Verify token with Auth0
    const user = await verifyAuth0Token(token);

    // Connect to Neon
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const result = await pool.query(
            'SELECT * FROM folders WHERE user_id = $1 ORDER BY name',
            [user.userId]
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ folders: result.rows })
        };
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    } finally {
        await pool.end();
    }
};
```

---

## Phase 3: Auth0 Integration

### Setup

1. **Create Auth0 Application**
   - Application Type: Single Page Application
   - Allowed Callback URLs: `http://localhost:3000/callback, https://sparkdeck.netlify.app/callback`
   - Allowed Logout URLs: `http://localhost:3000, https://sparkdeck.netlify.app`
   - Allowed Web Origins: `http://localhost:3000, https://sparkdeck.netlify.app`

2. **Environment Variables** (Netlify)
   ```
   AUTH0_DOMAIN=your-tenant.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   DATABASE_URL=postgresql://user:pass@neon-host/sparkdeck
   ```

3. **Install SDK**
   ```bash
   npm install @auth0/auth0-react
   ```

### Client-Side Implementation

```javascript
// src/providers/auth0-provider.js
import { Auth0Provider } from '@auth0/auth0-react';

function Auth0ProviderWithHistory({ children }) {
    return (
        <Auth0Provider
            domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN}
            clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
            redirectUri={window.location.origin}
            audience={`https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/api/v2/`}
        >
            {children}
        </Auth0Provider>
    );
}
```

```javascript
// Usage in components
import { useAuth0 } from '@auth0/auth0-react';

function LoginButton() {
    const { loginWithRedirect, isAuthenticated, user, logout } = useAuth0();

    if (isAuthenticated) {
        return (
            <div>
                <p>Welcome, {user.name}!</p>
                <button onClick={() => logout()}>Logout</button>
            </div>
        );
    }

    return <button onClick={() => loginWithRedirect()}>Login</button>;
}
```

---

## Phase 4: Migration Strategy

### Hybrid Approach (Recommended)

**Keep localStorage as fallback + sync to backend**

**Benefits**:
- ✅ Works offline
- ✅ Fast (no network latency)
- ✅ Backwards compatible
- ✅ Multi-device sync when online

**Implementation**:
```javascript
class DataManager {
    constructor() {
        this.useBackend = this.isAuthenticated();
    }

    async getFolders() {
        if (this.useBackend) {
            // Try backend first
            try {
                const response = await fetch('/api/folders', {
                    headers: { 'Authorization': `Bearer ${this.getToken()}` }
                });
                const data = await response.json();

                // Cache in localStorage for offline
                localStorage.setItem('sparkdeck-folders', JSON.stringify(data.folders));
                return data.folders;
            } catch (error) {
                // Fallback to localStorage if network fails
                console.warn('Backend unavailable, using localStorage');
                return this.loadFoldersFromLocalStorage();
            }
        } else {
            // Guest mode: use localStorage only
            return this.loadFoldersFromLocalStorage();
        }
    }

    async saveFolders(folders) {
        // Always save to localStorage first (instant)
        localStorage.setItem('sparkdeck-folders', JSON.stringify(folders));

        // If authenticated, sync to backend
        if (this.useBackend) {
            await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ folders })
            });
        }
    }
}
```

### Data Migration Path

**Step 1**: User creates account (Auth0)
**Step 2**: Detect existing localStorage data
**Step 3**: Show migration prompt: "Sync 15 decks to your account?"
**Step 4**: POST to `/api/sync` with all localStorage data
**Step 5**: Backend validates and imports
**Step 6**: Mark as synced in localStorage

---

## Phase 5: SEO Improvements

### After Backend Integration

**1. Add URL Routing**
```
/ → Home (all folders)
/folders/:folderId → Folder view
/decks/:deckId → Deck detail page (preview cards)
/study/:deckId → Study mode
```

**2. Switch Breadcrumb Buttons → Links**
```javascript
// Before (buttons)
<button onClick={() => navigateToHome()}>Home</button>

// After (links with history API)
<a href="/" onClick={(e) => { e.preventDefault(); navigateToHome(); }}>Home</a>
```

**3. Server-Side Rendering (Next.js)**
- Pre-render folder/deck pages
- Google can index content
- Better social sharing (Open Graph)

**4. Meta Tags (Dynamic)**
```javascript
<Head>
    <title>{folder.name} - SparkDeck</title>
    <meta name="description" content={`Study ${deck.cards.length} flashcards in ${folder.name}`} />
    <meta property="og:title" content={`${folder.name} - SparkDeck`} />
</Head>
```

---

## Netlify Configuration

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = ".next"
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[dev]
  framework = "#auto"
  command = "npm run dev"
  targetPort = 3000
  port = 8888

[context.production.environment]
  NEXT_PUBLIC_API_URL = "https://sparkdeck.netlify.app"

[context.deploy-preview.environment]
  NEXT_PUBLIC_API_URL = "https://deploy-preview-$DEPLOY_ID--sparkdeck.netlify.app"
```

---

## iOS App Integration

### Shared Backend (Future)

**Same API for Web + iOS**:
- iOS app uses same Netlify Functions API
- Auth0 works on iOS (Auth0.swift SDK)
- Data syncs across web + iOS seamlessly

**Example iOS API Call**:
```swift
let token = await Auth0.credentials().accessToken

let url = URL(string: "https://sparkdeck.netlify.app/api/folders")!
var request = URLRequest(url: url)
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

let (data, _) = try await URLSession.shared.data(for: request)
let folders = try JSONDecoder().decode([Folder].self, from: data)
```

---

## Free Tier Limits

### Neon (PostgreSQL)
- ✅ 512 MB storage
- ✅ 10 branches (great for dev/staging/prod)
- ✅ Unlimited queries
- ✅ Auto-scaling (scales to zero)
- ⚠️ 100 hours compute/month

### Netlify
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Unlimited sites
- ✅ 125k serverless function invocations/month
- ⚠️ Functions timeout: 10 seconds

### Auth0
- ✅ 7,000 free active users/month
- ✅ Unlimited logins
- ✅ Social + database authentication
- ✅ Multifactor authentication

**Conclusion**: Free tiers are MORE than enough for SparkDeck! 🎉

---

## Next Steps

1. **Check Taylor's Progress**
   - Review Next.js conversion status
   - Check for Neon/Netlify integration
   - Review YouTube implementation

2. **Set Up Auth0**
   - Create Auth0 account
   - Configure application
   - Add environment variables

3. **Database Setup**
   - Create Neon project
   - Run schema SQL
   - Test connection from Netlify Functions

4. **Build API Endpoints**
   - Start with GET /api/folders
   - Add authentication middleware
   - Test with Postman/curl

5. **Client Integration**
   - Add Auth0 login UI
   - Migrate from localStorage to API calls
   - Add sync functionality

6. **Testing**
   - Test offline mode
   - Test multi-device sync
   - Test migration from localStorage

---

## Questions for Taylor

- [ ] Next.js conversion status?
- [ ] Any Neon database setup?
- [ ] Netlify Functions started?
- [ ] Auth0 integration plans?
- [ ] YouTube embed status?

---

**Remember**: Start small, iterate fast! Get basic auth + folders working first, then expand. 🚀

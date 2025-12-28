# CLAUDE.md - AI Assistant Guide for Flashcards-app

**Last Updated**: 2025-12-28
**Project**: StudyFlow Flashcards Application
**Repository**: teknoflame/Flashcards-app

## Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Architecture & Design Patterns](#architecture--design-patterns)
4. [Key Features](#key-features)
5. [Development Workflows](#development-workflows)
6. [Coding Conventions](#coding-conventions)
7. [Testing & Quality Assurance](#testing--quality-assurance)
8. [Common Tasks & Patterns](#common-tasks--patterns)
9. [Accessibility Guidelines](#accessibility-guidelines)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

**StudyFlow** is a client-side flashcard application designed for creating, organizing, and studying flashcards with a strong emphasis on accessibility and user experience.

### Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Architecture**: Class-based OOP (StudyFlowApp)
- **Storage**: localStorage (browser-based persistence)
- **Server**: Node.js static file server (development only)
- **External APIs**: YouTube IFrame API (for video embeds)

### Core Philosophy

1. **Accessibility First**: WCAG compliant, full keyboard navigation, screen reader support
2. **Zero Dependencies**: No build tools, frameworks, or external libraries (except YouTube API)
3. **Progressive Enhancement**: Works on file://, enhanced with http://localhost
4. **Simple & Maintainable**: Readable code over clever abstractions

### Recent Architectural Changes (December 2024)

**Embedded JavaScript Removal**:
- ✅ **Removed**: All embedded JavaScript code from `index.html`
- ✅ **Current**: Single external JavaScript reference: `<script src="app.js" defer></script>`
- ✅ **Benefit**: Clean separation of concerns, better maintainability, improved caching
- ⚠️ **Note**: Inline CSS still remains in `index.html` (can be refactored later)

This change eliminates duplicate code and follows web development best practices for separating structure (HTML), presentation (CSS), and behavior (JavaScript).

---

## Codebase Structure

```
Flashcards-app/
├── index.html          # Main entry point (SPA shell, no embedded JavaScript)
├── app.js              # Core application logic (StudyFlowApp class + methods)
├── styles.css          # External stylesheet (extracted from inline styles)
├── server.js           # Node.js static file server (local development)
├── package.json        # Node project metadata (minimal, no dependencies)
├── README.md           # User-facing documentation
└── CLAUDE.md           # This file - AI assistant guide
```

### File Responsibilities

#### `index.html` (~540 lines)
- **Purpose**: SPA shell and application structure
- **Contents**:
  - HTML structure (tabs, forms, modals, dialogs)
  - Inline styles (CSS embedded in `<style>` tag)
  - External script reference to `app.js` (no embedded JavaScript)
- **Important**: All JavaScript logic is in external `app.js` file. Clean separation of concerns with no inline scripts.

#### `app.js` (881 lines)
- **Purpose**: Core application logic
- **Contents**:
  - `StudyFlowApp` class (lines 1-761)
  - Global helper functions (lines 763-766)
  - App initialization (lines 768-772)
  - Modal helper methods (lines 774-880)
- **Key Classes**: `StudyFlowApp` (singleton pattern)
- **External Dependencies**: None (except YouTube IFrame API loaded dynamically)

#### `styles.css` (253 lines)
- **Purpose**: All visual styling
- **Organization**:
  - Reset & base styles (lines 1-27)
  - Layout & navigation (lines 29-63)
  - Form elements (lines 65-112)
  - Components (deck cards, flashcards, modals)
  - Accessibility utilities (.sr-only, focus states)
- **Note**: Duplicated in `index.html` inline styles

#### `server.js` (72 lines)
- **Purpose**: Lightweight HTTP server for local development
- **Features**:
  - Static file serving with proper MIME types
  - Path traversal protection
  - SPA fallback (all routes → index.html)
  - Configurable port (default 8000)
- **Usage**: `npm start` or `node server.js`

---

## Architecture & Design Patterns

### Class-Based Architecture

The entire application is encapsulated in a single `StudyFlowApp` class:

```javascript
class StudyFlowApp {
    constructor() {
        this.decks = this.loadDecks();           // Array of deck objects
        this.folders = this.loadFolders();       // Array of folder objects
        this.currentDeck = null;                 // Active deck during study
        this.currentCardIndex = 0;               // Current card position
        this.showingFront = true;                // Card flip state
        this.tempCards = [];                     // Cards being created
        this.creationMode = null;                // 'auto' or 'manual'
        // ... DOM element references cached in initializeElements()
    }
}
```

### Data Models

#### Deck Object
```javascript
{
    name: "Biology Chapter 5",           // String
    category: "Biology",                 // String (from dropdown)
    folderId: "f_abc123",               // String | null
    cards: [...],                        // Array of Card objects
    created: "2025-12-25T10:30:00.000Z" // ISO 8601 timestamp
}
```

#### Card Object
```javascript
{
    front: "What is photosynthesis?",    // String
    back: "Process of converting...",    // String
    mediaUrl: "https://youtube.com/..." // String | null (optional)
}
```

#### Folder Object
```javascript
{
    id: "f_lx3k9p_abc123",              // String (generated)
    name: "Chemistry Notes",             // String
    created: "2025-12-25T10:30:00.000Z" // ISO 8601 timestamp
}
```

### State Management

- **Persistence**: localStorage (synchronous)
  - Key `studyflow-decks`: JSON array of decks
  - Key `studyflow-folders`: JSON array of folders
- **State Location**: All state in `StudyFlowApp` instance properties
- **State Updates**: Direct mutation + localStorage sync
- **No State Library**: Vanilla JS, manual state management

### Event-Driven Architecture

1. **DOM Event Listeners**: Set up in `setupEventListeners()` (lines 78-160 in app.js)
2. **Keyboard Shortcuts**: Global keydown handler for study navigation
3. **Custom Announcements**: ARIA live region for screen reader feedback

### UI Patterns

- **Tab Navigation**: Manual ARIA implementation (not native `<tab>` elements)
- **Modal Dialogs**: Two implementations:
  - `<dialog>` element for help modal (native)
  - Custom overlay + focus trap for prompts/confirmations
- **Focus Management**: Explicit focus() calls, focus trapping in modals
- **Progressive Disclosure**: Hidden sections revealed on interaction

---

## Key Features

### 1. Deck Management (app.js:342-415)
- Create/delete decks
- Organize into folders
- Move decks between folders
- Empty state handling

### 2. Card Creation (app.js:417-536)
**Auto-Generate Mode** (app.js:431-486):
- Parse plain text notes
- Patterns recognized:
  - `Question? \n Answer`
  - `Definition: Term \n Explanation`
  - `Term: Definition`
- Minimum definition length: 10 characters

**Manual Mode** (app.js:488-507):
- Front/back text input
- Optional media URL (YouTube, etc.)
- Real-time preview

### 3. Study Mode (app.js:625-697)
- Sequential card navigation
- Card flipping (front ↔ back)
- Progress tracking (visual + percentage)
- Keyboard shortcuts:
  - Space/Enter: Flip card
  - Left/Right Arrow: Navigate
  - Escape: End study

### 4. Folder Organization (app.js:206-340)
- Create/rename/delete folders
- Alphabetically sorted
- Duplicate name prevention (case-insensitive)
- Orphaned decks move to "(No folder)"

### 5. Media Embedding (index.html:1562-1750)
- **YouTube Videos**:
  - IFrame API integration
  - Error handling (153, 101, 150)
  - Fallback to direct links
  - file:// protocol warning
- **Toggle Controls**: Show/hide media on card back
- **Accessibility**: Focusable iframes, keyboard navigation

### 6. Accessibility Features
- **Keyboard Navigation**: All features keyboard-accessible
- **Screen Reader Support**:
  - ARIA labels, roles, live regions
  - Descriptive announcements
  - Focus management
- **Focus Trapping**: In modals and dialogs
- **Visual Focus Indicators**: High-contrast outlines
- **Help System**:
  - Global `?` shortcut
  - Full keyboard shortcut reference

---

## Development Workflows

### Git Workflow

**Branch Strategy**:
- `main`: Production-ready code (not used actively)
- `develop`: Integration branch
- `feature-*`: Feature branches (e.g., `feature-add-video-imbeds-on-flashcards`)
- `claude/*`: AI-assisted branches (format: `claude/<description>-<SESSION_ID>`)

**Commit Conventions**:
- Descriptive commit messages (not using conventional commits)
- Merge commits for feature integration
- Examples from history:
  - `"Add media embedding support for flashcards"`
  - `"Move StudyFlow app logic to app.js"`
  - `"Improve YouTube embed reliability and add local server"`

**Typical Workflow**:
```bash
# Create feature branch from develop
git checkout develop
git checkout -b feature-<name>

# Make changes, commit incrementally
git add .
git commit -m "Clear, descriptive message"

# Merge back to develop when complete
git checkout develop
git merge feature-<name>
```

### Local Development

**Starting the Server**:
```bash
npm start                    # Uses server.js on port 8000
# OR
node server.js               # Direct invocation
# OR
python -m http.server 8000   # Alternative Python server
```

**Development Server**:
- Serves files from project root
- Handles SPA routing (fallback to index.html)
- Sets proper Content-Type headers
- No live reload (manual refresh required)

**Testing Accessibility**:
- Use browser's built-in screen reader (NVDA, VoiceOver, JAWS)
- Test keyboard-only navigation (no mouse)
- Verify ARIA announcements in live region
- Check focus indicators are visible

### File Editing Guidelines

**When modifying `app.js`**:
- All JavaScript changes go in `app.js` only
- No inline JavaScript in `index.html` - maintain separation of concerns

**When modifying `styles.css`**:
- Also update inline `<style>` in `index.html`
- Ensures consistent styling regardless of file load order

**Adding New Features**:
1. Add DOM elements to `index.html`
2. Add element references in `initializeElements()`
3. Add event listeners in `setupEventListeners()`
4. Implement feature logic as class methods
5. Update `renderDecks()` or appropriate render method
6. Add styles to `styles.css` (and inline styles)

---

## Coding Conventions

### JavaScript Style

**Naming Conventions**:
- Classes: PascalCase (`StudyFlowApp`)
- Methods: camelCase (`loadDecks`, `renderDecks`)
- Private methods: Prefix with `_` (`_openModalCommon`, `_restoreModalClose`)
- Constants: UPPER_SNAKE_CASE (rare, mostly inline values)
- DOM elements: camelCase properties (`this.deckName`, `this.cardFront`)

**Code Organization**:
- Group related methods together
- Public methods before private methods
- Event handlers near feature implementation
- Prototype methods at end of file (modals)

**Error Handling**:
- Try/catch for localStorage operations
- Console.warn() for non-critical errors
- Graceful degradation (return empty arrays on error)
- User-facing error messages via `announce()`

**Async Patterns**:
- Promises for modal interactions (user confirmation)
- Async/await for user prompts (`async promptAddFolder()`)
- No async for localStorage (synchronous API)

### HTML Conventions

**Semantic HTML**:
- Use semantic elements (`<nav>`, `<main>`, `<section>`, `<dialog>`)
- Proper heading hierarchy (h1 → h2 → h3)
- Form elements wrapped in `<section>` or `<div class="section">`

**ARIA Attributes**:
- `role="tablist"`, `role="tab"`, `role="tabpanel"` for tabs
- `aria-label` for context (e.g., move deck select)
- `aria-live="polite"` for announcements
- `aria-hidden` to hide from screen readers
- `aria-describedby` for additional context

**ID Conventions**:
- Kebab-case (`deck-name`, `study-progress`)
- Descriptive, component-based (`modal-title`, `help-modal`)
- Unique across entire document

### CSS Conventions

**Class Naming**:
- Kebab-case (`.deck-card`, `.button-group`)
- Component-based (`.modal-overlay`, `.flashcard-content`)
- Utility classes (`.hidden`, `.sr-only`)

**Organization**:
1. Resets & base styles
2. Layout (container, tabs)
3. Typography
4. Form elements
5. Components (alphabetical)
6. Utilities
7. Modals (at end)

**Accessibility in CSS**:
- Never `outline: none` without custom focus style
- High contrast focus indicators (2px solid + box-shadow)
- `.sr-only` for screen-reader-only text
- Keyboard focus states always visible

---

## Testing & Quality Assurance

### Current Testing Strategy

**Manual Testing** (no automated tests yet):
1. **Feature Testing**: Test all CRUD operations (create, read, update, delete)
2. **Accessibility Testing**:
   - Keyboard-only navigation
   - Screen reader testing (NVDA, VoiceOver)
   - Focus management verification
3. **Cross-Browser Testing**: Chrome, Firefox, Safari, Edge
4. **localStorage Testing**:
   - Verify persistence across page reloads
   - Test quota exceeded scenarios
   - Test corrupted data recovery

### Test Checklist for New Features

- [ ] Works without JavaScript (graceful degradation)
- [ ] Keyboard accessible (no mouse required)
- [ ] Screen reader announces state changes
- [ ] Focus management is logical
- [ ] Works on file:// protocol
- [ ] Works on http://localhost
- [ ] localStorage persists correctly
- [ ] Error states are handled
- [ ] Empty states are handled
- [ ] User feedback is clear (announcements)

### Known Limitations

1. **No Build Process**: No transpilation, minification, or bundling
2. **No Type Checking**: Pure JavaScript (no TypeScript)
3. **No Unit Tests**: Manual testing only
4. **No CI/CD**: Manual deployment
5. **localStorage Limits**: ~5-10MB browser quota
6. **YouTube Embeds**:
   - Fail on file:// protocol (error 153)
   - May fail if owner disabled embedding
   - Require valid Referer header

---

## Common Tasks & Patterns

### Adding a New Modal Dialog

**For Confirmation Dialogs**:
```javascript
const confirmed = await this.openConfirmModal({
    title: 'Delete deck',
    message: 'Are you sure you want to delete "Biology"?',
    confirmText: 'Delete',
});
if (!confirmed) return;
// Proceed with deletion
```

**For Text Input**:
```javascript
const name = await this.openTextModal({
    title: 'Create folder',
    label: 'Folder name',
    confirmText: 'Create',
});
if (!name || !name.trim()) return;
// Use the input
```

### Adding a New Deck Property

1. **Update Deck Model** (in memory):
   ```javascript
   const deck = {
       name,
       category,
       folderId,
       newProperty: value,  // Add here
       cards: this.tempCards,
       created: new Date().toISOString()
   };
   ```

2. **Update UI** (in `renderDecks()` or other render methods)

3. **Test localStorage Migration**:
   - Old decks won't have the property
   - Provide defaults: `deck.newProperty = deck.newProperty || defaultValue`

### Adding a Keyboard Shortcut

**Global Shortcut** (app.js:110-139):
```javascript
document.addEventListener('keydown', (e) => {
    if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        this.switchTab('create');
    }
});
```

**Conditional Shortcut** (only when studying):
```javascript
if (this.currentDeck) {
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            this.previousCard();
            break;
    }
}
```

### Adding Screen Reader Announcements

```javascript
this.announce('Deck created successfully');
// Announced via ARIA live region, clears after 1 second
```

**Best Practices**:
- Keep announcements concise (< 10 words)
- Use active voice ("Deck deleted" not "The deck has been deleted")
- Avoid redundant announcements (UI change + announcement)

### Rendering Dynamic Content

**Pattern Used** (see `renderDecks()` app.js:342-415):
1. Clear container: `container.innerHTML = ''`
2. Group/sort data
3. Create elements with `document.createElement()`
4. Set `innerHTML` for structure, `textContent` for user data
5. Attach event listeners to dynamic elements
6. Append to container

**Security**: Never use `innerHTML` with unsanitized user input alone. For user data like deck names, use `textContent` or escape HTML entities.

---

## Accessibility Guidelines

### ARIA Best Practices (Used in This Project)

1. **Live Regions**:
   - `<div aria-live="polite" aria-atomic="true" class="sr-only" id="announcements">`
   - Updates announced automatically
   - Used for status messages, confirmations

2. **Tabs**:
   - `role="tablist"` on container
   - `role="tab"` + `aria-selected` on buttons
   - `role="tabpanel"` on content sections

3. **Modals**:
   - `role="dialog"` + `aria-modal="true"`
   - `aria-labelledby` pointing to title
   - `aria-describedby` for description
   - `aria-hidden="true"` on background content

4. **Dynamic Content**:
   - `aria-label` for context-specific labels
   - `aria-controls` to link toggle buttons with content
   - `aria-expanded` for expandable sections

### Keyboard Navigation Requirements

**Global Navigation**:
- Tab: Move forward through interactive elements
- Shift+Tab: Move backward
- Enter/Space: Activate buttons, links, tabs
- Escape: Close modals, exit study mode

**Study Mode**:
- Space/Enter: Flip card
- Left/Right Arrow: Navigate cards
- Escape: End study session

**Modals**:
- Focus trap active (Tab cycles within modal)
- Escape closes modal
- Focus returns to trigger element on close

### Focus Management Checklist

When implementing a new feature:
- [ ] Focus moves logically (left-to-right, top-to-bottom)
- [ ] Modals trap focus (can't Tab outside)
- [ ] Closing modals restores previous focus
- [ ] New content receives focus when appropriate
- [ ] Focus is visible (not `outline: none`)
- [ ] Interactive elements are keyboard accessible

---

## Troubleshooting

### Common Issues

#### Issue: YouTube videos show error 153

**Cause**: Missing or blocked Referer header (common on file:// protocol)

**Solution**:
1. Serve via HTTP: `npm start` → `http://localhost:8000`
2. Check browser extensions (some strip Referer)
3. Ensure `<meta name="referrer" content="strict-origin-when-cross-origin">` in `<head>`

**Code Reference**:
- Warning banner: index.html:1720-1750
- Error handling: index.html:1613-1648

#### Issue: localStorage data lost

**Cause**: Private browsing, quota exceeded, browser clear

**Solution**:
- Implement export/import feature (future enhancement)
- Check quota: `navigator.storage.estimate()`
- Verify keys: `localStorage.getItem('studyflow-decks')`

#### Issue: Focus not visible

**Cause**: Custom focus styles override browser defaults

**Solution**:
- Verify focus styles in styles.css (lines 85-89, 95-98)
- Test with keyboard navigation
- Check `:focus-visible` support

#### Issue: Screen reader not announcing

**Cause**: ARIA live region not updating or timing issues

**Solution**:
- Check `#announcements` element exists
- Verify `aria-live="polite"` attribute
- Ensure 1-second timeout clears previous announcement
- Test announcement content (not too long)

---

## Future Enhancement Ideas

Based on codebase analysis, these areas could be improved:

1. **Data Management**:
   - Export/import decks (JSON format)
   - Backup/restore functionality
   - Deck templates

2. **Study Features**:
   - Spaced repetition algorithm
   - Study statistics (cards studied, accuracy)
   - Shuffle mode
   - Favorites/bookmarks

3. **Developer Experience**:
   - Add unit tests (Jest or Vitest)
   - Add E2E tests (Playwright or Cypress)
   - Implement build process (optional bundling)
   - Add TypeScript (or JSDoc types)
   - Hot reload development server

4. **Code Quality**:
   - Split StudyFlowApp into smaller modules
   - Add JSDoc comments
   - Implement state management library (optional)
   - Consider moving inline CSS to external stylesheet

5. **Accessibility**:
   - Add high contrast theme
   - Implement text-to-speech for cards
   - Add font size controls
   - Improve color contrast ratios

---

## Key Files Quick Reference

| File | Lines | Primary Purpose | Key Sections |
|------|-------|-----------------|--------------|
| `app.js` | 881 | Core logic | StudyFlowApp class (1-761), Modals (774-880) |
| `index.html` | ~540 | UI structure | Tabs (342-461), Modals (465-520), External JS ref (537) |
| `styles.css` | 253 | Styling | Components (157-224), Modals (226-252) |
| `server.js` | 72 | Dev server | Server setup (23-71) |
| `package.json` | 11 | Metadata | Scripts (6-8) |
| `README.md` | 75 | User docs | Setup (18-47), Structure (49-51) |

---

## Contact & Contribution

- **Author**: teknoflame
- **Repository**: github.com/teknoflame/Flashcards-app
- **License**: MIT (specified in package.json)

When contributing:
1. Follow existing code style and patterns
2. Test accessibility thoroughly
3. Keep JavaScript in `app.js` only (no inline scripts in HTML)
4. Document non-obvious decisions
5. Keep dependencies minimal (prefer vanilla JS)

---

**Document Version**: 1.1
**Created**: 2025-12-25
**Last Revised**: 2025-12-28 (Removed embedded JavaScript references)
**AI Assistant**: Claude (Anthropic)

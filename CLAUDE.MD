# StudyFlow - Claude Development Documentation

## Project Overview

StudyFlow is an accessible flashcards study application built with vanilla JavaScript, HTML, and CSS. The app features spaced repetition learning, deck organization with folders, keyboard shortcuts for accessibility, and support for multimedia content including YouTube embeds.

## Architecture

### File Structure

```
Flashcards-app/
├── index.html      # Main HTML structure with semantic markup
├── app.js          # All JavaScript logic (external file)
├── styles.css      # Additional styling (external file)
├── server.js       # Node.js static file server
├── package.json    # NPM configuration
└── README.md       # User-facing documentation
```

### Recent Architectural Changes

**Embedded JavaScript Removal (December 2024)**

Previously, `index.html` contained embedded JavaScript code within `<script>` tags directly in the HTML file. This has been **completely removed** to improve:

- **Separation of concerns**: HTML structure is now separate from JavaScript logic
- **Maintainability**: All JavaScript code is centralized in `app.js`
- **Caching**: Browser can cache JavaScript separately from HTML
- **Debugging**: Easier to debug and develop with proper source files

**Current Implementation:**

- ✅ **External JavaScript only**: Single reference to `app.js` at the bottom of `index.html`
  ```html
  <script src="app.js" defer></script>
  ```
- ✅ **No inline JavaScript**: No `<script>` blocks with code in the HTML
- ✅ **No inline event handlers**: No `onclick`, `onload`, or similar attributes in HTML elements
- ⚠️ **Inline CSS remains**: The `<style>` block in `index.html` still contains inline CSS (lines 10-327). This could be moved to `styles.css` in a future refactor if desired.

### JavaScript Architecture (`app.js`)

The external JavaScript file handles:

- **State Management**: Deck storage, folder organization, study session state
- **DOM Manipulation**: Dynamic rendering of decks, cards, and UI elements
- **Event Handling**: Tab navigation, keyboard shortcuts, modal interactions
- **Local Storage**: Persisting decks and folders using `localStorage`
- **Media Embedding**: YouTube iframe integration and Google Drive viewer links
- **Accessibility**: ARIA live regions, keyboard navigation, screen reader announcements
- **Card Generation**: Auto-generation of flashcards from pasted notes

### CSS Architecture

Currently split between:

1. **Inline styles** (`index.html` lines 10-327): Core styling, layout, and component styles
2. **External stylesheet** (`styles.css`): Additional styling rules

## Key Features

### Accessibility Features

- Full keyboard navigation with hotkeys (D, C, N, F, S, 1-9, ?, Esc, arrows)
- ARIA labels and live regions for screen readers
- Focus management in modals and study mode
- Semantic HTML structure
- High contrast visual design

### Deck Management

- Create decks with categories and folder organization
- Collapsible folder system for organizing decks
- Manual card creation or auto-generation from notes
- Delete individual decks or entire folders
- Persistent storage via localStorage

### Study Mode

- Linear card progression with flip functionality
- Visual progress bar and card counter
- Keyboard shortcuts for navigation (arrows, space/enter)
- Media playback support (YouTube embeds)

### Media Support

- YouTube video embeds (automatically converted to iframe)
- Google Drive file viewer integration
- Generic URL support with "View Media" links

## Development Guidelines

### When Modifying Code

1. **JavaScript changes**: Edit `app.js` only - never add inline scripts to `index.html`
2. **Styling changes**: Preferably edit `styles.css`, or inline `<style>` block if needed
3. **Structure changes**: Edit `index.html` for markup only
4. **Maintain separation**: Keep concerns separated between files

### Code Standards

- Use vanilla JavaScript (no frameworks)
- Maintain accessibility features when adding new functionality
- Test keyboard navigation after changes
- Ensure localStorage persistence works correctly
- Follow existing naming conventions (camelCase for JS, kebab-case for CSS)

## Running the Application

```bash
# Install dependencies (optional, creates package-lock.json)
npm install

# Start the development server
npm start

# Access at http://localhost:8000
```

Alternatively, open `index.html` directly in a browser for local development without a server.

## Future Considerations

### Potential Refactoring Opportunities

1. **Move inline CSS to external file**: Extract all styles from `index.html` to `styles.css`
2. **Modularize JavaScript**: Split `app.js` into smaller modules (state, ui, storage, media)
3. **Add build process**: Consider bundling/minification for production
4. **Testing**: Add unit tests for core functionality
5. **Backend integration**: Replace localStorage with a proper database for multi-device sync

### Accessibility Enhancements

- Add adjustable text size settings
- Implement high contrast mode toggle
- Add voice navigation option for study mode
- Improve error messaging and validation feedback

---

**Last Updated**: December 2024
**Maintained by**: Claude (AI Assistant)

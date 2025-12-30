# SparkDeck Features Roadmap

**Last Updated**: 2025-12-30
**Status**: All features designed for localhost:8000 with easy backend migration
**Philosophy**: Build with localStorage, migrate to backend later!

---

## ✅ Completed Features

- [x] Drill-down folder UI with breadcrumb navigation
- [x] Nested folders (unlimited depth)
- [x] YouTube video embedding on cards
- [x] Sound effects system with mute toggle
- [x] Auto-generate cards from notes
- [x] Manual card creation
- [x] Keyboard shortcuts (D, C/N, F, S, H, 1-9, ?)
- [x] Full WCAG accessibility (screen readers, keyboard nav)
- [x] ARIA live announcements

---

## 🎯 High Priority Features (Easy Wins!)

### 1. **Import/Export Decks** ⭐ HIGHEST PRIORITY
**Effort**: 30 minutes | **Impact**: HUGE

**Why First?**
- Users can backup their data NOW
- Share decks with friends/classmates
- Essential for backend migration
- Prevents data loss

**Implementation**:
```javascript
// Export single deck
exportDeck(deckIndex) → downloads JSON file

// Export all data
exportAllData() → downloads complete backup

// Import deck
importDeck(jsonFile) → adds to library

// Import all data
importAllData(jsonFile) → merges with existing
```

**User Flow**:
1. Click "Export" button on deck → downloads `Biology-Chapter-5.json`
2. Share file with friend
3. Friend clicks "Import Deck" → selects file → deck added!

**Migration**: Export format IS the API format - perfect for backend!

---

### 2. **Quiz Mode** 🎮
**Effort**: 2 hours | **Impact**: High | **You mentioned wanting this!**

**Features**:
- Multiple choice quiz generation
- True/False questions
- Score tracking
- Review wrong answers
- Timer option (optional)

**Quiz Types**:
1. **Multiple Choice**: Show front → 4 answer options (1 correct + 3 random)
2. **True/False**: Show statement → Is this correct?
3. **Fill in the Blank**: Show partial back → type missing word
4. **Mixed Mode**: Randomize question types

**Quiz Results**:
- Score: 8/10 (80%)
- Time: 2 minutes 15 seconds
- Review wrong answers
- Try again option

**localStorage Schema**:
```javascript
{
    quizHistory: [
        {
            deckId: "deck123",
            date: "2025-12-30T10:00:00Z",
            score: 8,
            total: 10,
            timeSeconds: 135,
            wrongCardIndices: [2, 5]
        }
    ]
}
```

**Migration**: Quiz history → database table

---

### 3. **Study Statistics Dashboard** 📊
**Effort**: 1-2 hours | **Impact**: High (motivating!)

**Metrics to Track**:
- Cards studied today/this week/all time
- Decks completed
- Study streak (days in a row)
- Time spent studying
- Most studied deck
- Study calendar (heatmap like GitHub)

**Visual Dashboard**:
```
Study Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 47 cards studied this week
🔥 5 day streak!
⏱️  2 hours 15 minutes total
⭐ Most studied: Biology (23 cards)

Weekly Activity:
Mon Tue Wed Thu Fri Sat Sun
🟩  🟩  🟩  🟩  🟩  ⬜  ⬜
```

**localStorage Schema**:
```javascript
{
    studySessions: [
        {
            deckIndex: 0,
            date: "2025-12-30",
            cardsStudied: 10,
            timeSeconds: 300
        }
    ],
    dailyStats: {
        "2025-12-30": { cardsStudied: 10, timeSeconds: 300 }
    }
}
```

**Migration**: Study sessions → analytics table

---

### 4. **Search & Filter** 🔍
**Effort**: 1 hour | **Impact**: High (quality of life)

**Search Features**:
- Search decks by name
- Search cards by front/back text
- Filter by category
- Filter by folder
- Sort by: Name, Date Created, Most Studied, Card Count

**UI**:
```
┌─────────────────────────────────┐
│ 🔍 Search decks...              │
└─────────────────────────────────┘

Filter: [All Categories ▼] [All Folders ▼]
Sort: [Name ▼]

Results: 5 decks
```

**Implementation**:
- Real-time search (filter as you type)
- Case-insensitive matching
- Highlight search terms

**Migration**: Works exactly the same with API!

---

## 🚀 Medium Priority Features

### 5. **Spaced Repetition System (SRS)** 🧠
**Effort**: 2-3 hours | **Impact**: Very High (learning science!)

**Algorithm**: SM-2 (SuperMemo 2)
- Cards have "intervals": 1 day, 3 days, 7 days, 14 days, etc.
- "Easy" → longer interval
- "Hard" → shorter interval
- "Again" → reset to 1 day

**Card States**:
- 🆕 New (never studied)
- 📚 Learning (interval < 7 days)
- ✅ Mature (interval ≥ 7 days)

**Review Queue**:
```
Due Today: 15 cards
  🆕 New: 5
  📚 Learning: 7
  ✅ Review: 3

Study Now →
```

**localStorage Schema**:
```javascript
{
    cardProgress: {
        "deck0_card0": {
            interval: 7,           // days until next review
            easeFactor: 2.5,       // difficulty multiplier
            nextReview: "2025-12-31",
            reviewCount: 5
        }
    }
}
```

**Migration**: Card progress → database table

---

### 6. **Study Session History** 📅
**Effort**: 1 hour | **Impact**: Medium

**Features**:
- Log every study session
- View past sessions
- Resume interrupted sessions
- Session details: date, time, cards studied, score

**Session Log UI**:
```
Recent Sessions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Today, 3:45 PM
  Biology Chapter 5
  10 cards • 5 minutes

Yesterday, 9:30 AM
  Chemistry Formulas
  15 cards • 8 minutes
```

**Migration**: Session history → database table

---

### 7. **Dark Mode / Themes** 🌙
**Effort**: 1-2 hours | **Impact**: Medium (user preference)

**Themes**:
- 🌞 Light Mode (default)
- 🌙 Dark Mode
- 🎨 High Contrast
- 🟦 Blue Theme
- 🟩 Green Theme

**Implementation**:
```css
/* Dark mode variables */
:root[data-theme="dark"] {
    --bg-color: #1e1e1e;
    --text-color: #e0e0e0;
    --primary-color: #58a6ff;
}
```

**localStorage**: `sparkdeck-theme: "dark"`

**Accessibility**: Respect `prefers-color-scheme` media query

**Migration**: Theme preference → user settings table

---

### 8. **Card Tags System** 🏷️
**Effort**: 2 hours | **Impact**: Medium

**Features**:
- Add multiple tags per card: `#difficult`, `#exam`, `#memorize`
- Filter study session by tags
- Tag autocomplete
- Tag management (rename, delete)

**Card with Tags**:
```javascript
{
    front: "What is mitosis?",
    back: "Cell division...",
    mediaUrl: null,
    tags: ["biology", "cell-division", "exam"]
}
```

**Study by Tags**:
- Study only `#exam` cards
- Exclude `#mastered` cards
- Mix tags: `#biology AND #difficult`

**Migration**: Tags → separate tags table with many-to-many relationship

---

### 9. **Favorites / Starred Decks** ⭐
**Effort**: 30 minutes | **Impact**: Low-Medium

**Features**:
- Star/unstar decks
- "Favorites" section at top
- Quick access to frequently used decks

**UI**:
```
⭐ Favorites
  Chemistry Formulas ⭐
  Biology Exam Prep ⭐

📁 Folders
  ...
```

**localStorage**: Add `starred: true` to deck object

**Migration**: Boolean field in database

---

### 10. **Deck Templates** 📋
**Effort**: 1 hour | **Impact**: Medium

**Features**:
- Save deck structure as template
- Create new deck from template
- Pre-built templates (Languages, Science, Math)

**Example Templates**:
```javascript
{
    name: "Language Vocabulary Template",
    category: "Languages",
    cardTemplate: {
        front: "[Word in English]",
        back: "[Translation]\n[Pronunciation]\n[Example sentence]",
        mediaUrl: "[YouTube pronunciation link]"
    }
}
```

**Built-in Templates**:
- 🌍 Language Vocabulary
- 🧪 Science Definitions
- 📐 Math Formulas
- 📅 History Dates & Events

**Migration**: Templates → database table

---

## 🎨 Polish Features

### 11. **Shuffle Mode** 🔀
**Effort**: 10 minutes | **Impact**: Low

**Feature**: Randomize card order when studying

**Implementation**:
```javascript
shuffleCards() {
    this.currentDeck.cards.sort(() => Math.random() - 0.5);
}
```

**UI**: Toggle "Shuffle" button in study mode

---

### 12. **Card Flip Animation** ✨
**Effort**: 30 minutes | **Impact**: Low (visual polish)

**Feature**: Smooth 3D flip animation when revealing answer

**CSS**:
```css
.flashcard {
    transition: transform 0.6s;
    transform-style: preserve-3d;
}
.flashcard.flipped {
    transform: rotateY(180deg);
}
```

---

### 13. **Progress Indicators** 📈
**Effort**: 30 minutes | **Impact**: Low

**Features**:
- Overall progress: "45% of all decks completed"
- Per-deck progress: "Studied 23/50 cards"
- Folder progress: "3/5 decks in Chemistry completed"

---

### 14. **Keyboard Shortcut Customization** ⌨️
**Effort**: 2 hours | **Impact**: Low

**Feature**: Let users customize keyboard shortcuts

**Settings UI**:
```
Keyboard Shortcuts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
My Decks:        D    [Change]
Create Deck:     C    [Change]
Create Folder:   F    [Change]
...
```

**localStorage**: `sparkdeck-shortcuts: { decks: 'D', create: 'C' }`

---

## 🔮 Advanced Features (Future)

### 15. **Collaborative Decks** 👥
**Effort**: Backend required | **Impact**: High

**Features**:
- Share deck edit link
- Collaborate in real-time
- See who's studying

**Requirements**: Backend API, WebSockets

---

### 16. **AI Card Generation** 🤖
**Effort**: Backend required | **Impact**: High

**Features**:
- Upload PDF → auto-generate cards
- AI improves card quality
- Suggest related content

**Requirements**: Backend API, OpenAI integration

---

### 17. **Voice Recording** 🎤
**Effort**: 1-2 hours | **Impact**: Medium

**Features**:
- Record audio for pronunciation
- Playback on card back
- Great for language learning

**Implementation**: Web Audio API + localStorage (base64 audio)

**Limitation**: Audio files are large (might hit localStorage quota)

**Migration**: Audio → cloud storage (S3, Cloudinary)

---

## 📊 Feature Comparison Matrix

| Feature | Effort | Impact | localStorage | Migration Ease |
|---------|--------|--------|-------------|----------------|
| **Import/Export** | 30 min | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| **Quiz Mode** | 2 hr | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| **Study Stats** | 2 hr | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| **Search/Filter** | 1 hr | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| **Spaced Repetition** | 3 hr | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| **Session History** | 1 hr | ⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| **Dark Mode** | 2 hr | ⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| **Tags** | 2 hr | ⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| **Favorites** | 30 min | ⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| **Templates** | 1 hr | ⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |

---

## 🎯 Recommended Implementation Order

### Phase 1: Data Protection & UX (Week 1)
1. **Import/Export** (critical for data safety!)
2. **Search/Filter** (quality of life)
3. **Favorites** (quick access)

### Phase 2: Study Features (Week 2)
4. **Quiz Mode** (you mentioned wanting this!)
5. **Study Statistics** (motivating!)
6. **Session History** (tracking)

### Phase 3: Advanced Study (Week 3)
7. **Spaced Repetition** (learning science!)
8. **Tags System** (organization)
9. **Dark Mode** (accessibility)

### Phase 4: Polish (Week 4)
10. **Templates** (productivity)
11. **Shuffle Mode** (variety)
12. **Progress Indicators** (feedback)

---

## 💡 Tips for Implementation

### Starting a New Feature Session

**Good Claude Code prompt**:
```
Hi Claude! I want to add [FEATURE NAME] to SparkDeck.

Context:
- We're building with vanilla JavaScript + localStorage
- The app is at /home/user/Flashcards-app
- Check FEATURES_ROADMAP.md for details
- Must be fully accessible (WCAG AA)
- Easy backend migration later

Let's implement [FEATURE NAME] step by step!
```

### Keep Features Modular

Each feature should:
- ✅ Work independently
- ✅ Use localStorage (for now)
- ✅ Have clear migration path
- ✅ Maintain accessibility
- ✅ Not break existing features

### Test Checklist

For each new feature:
- [ ] Works on localhost:8000
- [ ] Keyboard accessible
- [ ] Screen reader friendly
- [ ] Persists in localStorage
- [ ] Mobile responsive (if applicable)
- [ ] No console errors

---

## 🔄 Backend Migration Strategy

When Taylor has backend ready, migration is easy:

**Current (localStorage)**:
```javascript
saveDeck(deck) {
    this.decks.push(deck);
    localStorage.setItem('sparkdeck-decks', JSON.stringify(this.decks));
}
```

**Future (API)**:
```javascript
async saveDeck(deck) {
    const response = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(deck)
    });
    const savedDeck = await response.json();

    // Still cache locally for offline mode
    this.decks.push(savedDeck);
    localStorage.setItem('sparkdeck-decks', JSON.stringify(this.decks));
}
```

All features work exactly the same way! Just swap storage layer. 🎉

---

## 🎮 For Your iOS App

All these features will work in iOS too! Just replace:
- `localStorage` → `UserDefaults` or CoreData
- `fetch('/api/...')` → `URLSession` calls

Same logic, different platform! 📱

---

**Questions? Check BACKEND_TODO.md for backend info!**
**Need help? Start a new Claude Code session with this file! 🚀**

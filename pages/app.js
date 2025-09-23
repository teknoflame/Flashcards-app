import { useEffect, useRef } from 'react';

export default function AppPage() {
  const containerRef = useRef(null);

  useEffect(() => {
  if (!containerRef.current) return;

  // Inject the legacy app HTML (markup only, scripts are loaded separately)
  const html = `
    <div class="container">
      <header>
        <h1>StudyFlow</h1>
        <p>Intelligent, accessible flashcards with spaced repetition - making studying seamless and engaging for everyone.</p>
        <div class="section" style="margin-top:10px;">
          <button id="open-help-btn" type="button">Help</button>
        </div>
      </header>


      <div aria-live="polite" aria-atomic="true" class="sr-only" id="announcements"></div>

      <nav class="nav-tabs" role="tablist">
        <button class="nav-tab active" role="tab" data-tab="decks" aria-selected="true">My Decks</button>
        <button class="nav-tab" role="tab" data-tab="create">Create Deck</button>
        <button class="nav-tab" role="tab" data-tab="study">Study Mode</button>
      </nav>

      <main>
        <!-- Decks Tab -->
        <section class="tab-content active" id="decks-tab" role="tabpanel">
          <h2>Your Study Decks</h2>
          <div class="section" aria-label="Folder actions">
            <button id="add-folder-btn" type="button">Add Folder</button>
          </div>
          <div id="decks-list">
            <div class="empty-state">
              <h3>Welcome to StudyFlow!</h3>
              <p>Create your first deck to get started studying.</p>
              <button type="button" onclick="switchTab('create')">Create Your First Deck</button>
            </div>
          </div>
        </section>

        <!-- Create Deck Tab -->
        <section class="tab-content" id="create-tab" role="tabpanel">
          <h2>Create New Deck</h2>
                  
          <div class="section">
            <label for="deck-name">Deck Name:</label>
            <input type="text" id="deck-name" placeholder="e.g., Biology Chapter 5">
                      
            <label for="deck-category">Category:</label>
            <select id="deck-category">
              <option value="Biology">Biology</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Physics">Physics</option>
              <option value="Math">Math</option>
              <option value="History">History</option>
              <option value="Other">Other</option>
            </select>

            <label for="deck-folder">Folder:</label>
            <select id="deck-folder" aria-describedby="deck-folder-help">
              <!-- options populated by JS -->
            </select>
            <div id="deck-folder-help" class="sr-only">Choose a folder to save this deck into. Select "New folder…" to create one.</div>
          </div>

          <div class="section">
            <h3>Create Cards</h3>
            <div class="button-group">
              <button id="auto-method-btn" type="button">Auto-Generate from Notes</button>
              <button id="manual-method-btn" type="button">Create Manually</button>
            </div>
          </div>

          <div id="auto-input" class="section hidden">
            <label for="notes-input">Paste your study notes here:</label>
            <textarea id="notes-input" rows="10" placeholder="Example:\nWhat is photosynthesis?\nPhotosynthesis is the process by which plants convert light energy into chemical energy.\n\nDefinition: Mitochondria\nMitochondria are the powerhouses of the cell."></textarea>
            <button id="generate-btn" type="button">Generate Cards from Notes</button>
          </div>

          <div id="manual-input" class="section hidden">
            <label for="card-front">Front of card (question or term):</label>
            <textarea id="card-front" rows="3" placeholder="Example: What is mitosis?"></textarea>
                      
            <label for="card-back">Back of card (answer or definition):</label>
            <textarea id="card-back" rows="4" placeholder="Example: Mitosis is the process of cell division."></textarea>
                      
            <label for="card-media">Optional media URL (YouTube link, Google Drive, etc.)</label>
            <input type="url" id="card-media" placeholder="https://www.youtube.com/watch?v=..." aria-describedby="card-media-help">
            <div id="card-media-help" class="sr-only">Provide a link to a video or file. You can preview it after adding the card. Supported: YouTube (embedded). Other services will open in a viewer.</div>
                      
            <button id="add-card-btn" type="button">Add This Card</button>
          </div>

          <div id="cards-preview" class="section hidden">
            <h3>Cards Preview</h3>
            <div id="preview-cards"></div>
            <div class="button-group">
              <button id="save-deck-btn" type="button">Save Deck</button>
              <button id="cancel-deck-btn" type="button">Cancel</button>
            </div>
          </div>
        </section>
        <!-- Study Mode Tab -->
        <section class="tab-content" id="study-tab" role="tabpanel">
          <div id="no-study-content">
            <div class="empty-state">
              <h3>No Active Study Session</h3>
              <p>Select a deck from "My Decks" to start studying.</p>
            </div>
          </div>

          <div id="study-mode-content" class="hidden">
            <h2>Study Mode</h2>
            <div class="progress" id="study-progress" aria-live="polite"></div>
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
            </div>
                      
            <div class="flashcard" id="flashcard" tabindex="0" role="button" aria-label="Flashcard - press Space or Enter to flip">
              <div class="flashcard-content" id="card-content">Click a deck to start studying!</div>
            </div>

            <div class="button-group">
              <button id="prev-btn" type="button">Previous Card</button>
              <button id="flip-btn" type="button">Flip Card</button>
              <button id="next-btn" type="button">Next Card</button>
            </div>

            <div class="button-group">
              <button id="end-study-btn" type="button">End Study Session</button>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- Help Modal (dialog) -->
    <dialog id="help-modal" aria-labelledby="help-title" aria-describedby="help-description">
      <div class="modal-dialog">
        <div class="modal-header">
          <h1 id="help-title" class="modal-title">Help</h1>
          <button id="close-help-btn" type="button" class="close-btn" aria-label="Close help">Close</button>
        </div>
        <div id="help-description" class="modal-body">
          <p>Welcome to StudyFlow. This Help covers how to navigate the app, create decks, and study efficiently with keyboard shortcuts.</p>

          <h2>Overview</h2>
          <p>StudyFlow lets you create flashcard decks, generate cards from notes, and study them with accessible controls and progress tracking.</p>

          <h2>Keyboard Navigation</h2>
          <ul>
            <li><strong>Tab/Shift+Tab:</strong> Move between interactive elements</li>
            <li><strong>Space/Enter:</strong> Activate buttons and flip the current card</li>
            <li><strong>Arrow Keys:</strong> Navigate cards during study (Left/Right)</li>
            <li><strong>?:</strong> Open Help</li>
            <li><strong>Escape:</strong> Close dialogs or return to deck selection</li>
          </ul>

          <h2>Creating Decks</h2>
          <ol>
            <li>Go to “Create Deck”.</li>
            <li>Enter a deck name and pick a category.</li>
            <li>Choose to auto-generate from your notes or create cards manually.</li>
            <li>Preview and save when ready.</li>
          </ol>

          <h2>Studying Cards</h2>
          <ul>
            <li>Select a deck from “My Decks”, then choose “Study This Deck”.</li>
            <li>Use Flip to switch between front and back.</li>
            <li>Use Previous/Next or arrow keys to move through cards.</li>
            <li>Progress updates are announced and shown visually.</li>
          </ul>
        </div>
      </div>
    </dialog>

    <!-- Accessible generic modal elements (used for prompts/confirmations) -->
    <div id="modal-overlay" class="modal-overlay hidden" aria-hidden="true"></div>
    <div id="app-modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
      <div class="modal-header">
        <h2 id="modal-title">Dialog</h2>
      </div>
      <div class="modal-body">
        <p id="modal-desc" class="sr-only"></p>
        <div id="modal-content"></div>
      </div>
      <div class="modal-footer button-group">
        <button id="modal-cancel-btn" type="button">Cancel</button>
        <button id="modal-confirm-btn" type="button">Confirm</button>
      </div>
    </div>
  `;

  containerRef.current.innerHTML = html;

  // Load the legacy app script from the public folder
  const existing = document.querySelector('script[data-legacy-app]');
  if (!existing) {
    const s = document.createElement('script');
    s.src = '/legacy-app.js';
    s.defer = true;
    s.setAttribute('data-legacy-app', '1');
    s.onload = () => {
    try {
      if (window.initializeStudyFlowApp) {
      window.initializeStudyFlowApp();
      } else if (typeof window.app === 'undefined' && window.StudyFlowApp) {
      // Fallback initialization
      window.app = new window.StudyFlowApp();
      try { window.app.checkEmbeddingEnvironment && window.app.checkEmbeddingEnvironment(); } catch (_) {}
      }
    } catch (e) {
      console.error('Failed to initialize legacy app:', e);
    }
    };
    document.body.appendChild(s);
  } else {
    // If script already present, just attempt to initialize
    try { window.initializeStudyFlowApp && window.initializeStudyFlowApp(); } catch (_) {}
  }

  return () => {
    // optional cleanup: don't aggressively remove DOM so localStorage state persists
  };
  }, []);

  return <div ref={containerRef} />;
}

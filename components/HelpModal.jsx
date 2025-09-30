import React from 'react';

export default function HelpModal() {
  return (
    <dialog id="help-modal" aria-labelledby="help-title" aria-describedby="help-description">
      <div className="modal-dialog">
        <div className="modal-header">
          <h1 id="help-title" className="modal-title">Help</h1>
          <button id="close-help-btn" type="button" className="close-btn" aria-label="Close help">Close</button>
        </div>
        <div id="help-description" className="modal-body">
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
  );
}

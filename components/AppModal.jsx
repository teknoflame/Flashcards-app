import React from 'react';

export default function AppModal() {
  return (
    <div>
      <div id="modal-overlay" className="modal-overlay hidden" aria-hidden="true"></div>
      <div id="app-modal" className="modal hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
        <div className="modal-header">
          <h2 id="modal-title">Dialog</h2>
        </div>
        <div className="modal-body">
          <p id="modal-desc" className="sr-only"></p>
          <div id="modal-content"></div>
        </div>
        <div className="modal-footer button-group">
          <button id="modal-cancel-btn" type="button">Cancel</button>
          <button id="modal-confirm-btn" type="button">Confirm</button>
        </div>
      </div>
    </div>
  );
}

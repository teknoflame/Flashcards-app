// Sound Manager for audio playback
class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = this.loadMutedState();
        this.soundPaths = {
            flip: 'sounds/flip.mp3',
            enterStudy: 'sounds/enter-study.mp3',
            exitStudy: 'sounds/exit-study.mp3',
            correct: 'sounds/correct.mp3',
            wrong: 'sounds/wrong.mp3'
        };
        this.preloadSounds();
    }

    loadMutedState() {
        try {
            const saved = localStorage.getItem('studyflow-sounds-muted');
            return saved === 'true';
        } catch (error) {
            console.warn('Could not load sound preferences:', error);
            return false;
        }
    }

    saveMutedState() {
        try {
            localStorage.setItem('studyflow-sounds-muted', this.muted.toString());
        } catch (error) {
            console.warn('Could not save sound preferences:', error);
        }
    }

    preloadSounds() {
        for (const [key, path] of Object.entries(this.soundPaths)) {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = path;

            // Handle loading errors gracefully
            audio.addEventListener('error', () => {
                console.warn(`Sound file not found: ${path}. Sound will be skipped.`);
            });

            this.sounds[key] = audio;
        }
    }

    play(soundName) {
        if (this.muted) return;

        const audio = this.sounds[soundName];
        if (!audio) {
            console.warn(`Sound "${soundName}" not found.`);
            return;
        }

        // Reset to beginning if already playing
        audio.currentTime = 0;

        // Play and handle errors
        audio.play().catch(err => {
            console.warn(`Could not play sound "${soundName}":`, err.message);
        });
    }

    toggleMute() {
        this.muted = !this.muted;
        this.saveMutedState();
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }
}

// Simple StudyFlow App (extracted from index.html)
class StudyFlowApp {
    constructor() {
        this.soundManager = new SoundManager();
        this.decks = this.loadDecks();
        this.folders = this.loadFolders();
        this.folderExpandedState = this.loadFolderExpandedState();
        this.currentDeck = null;
        this.currentCardIndex = 0;
        this.showingFront = true;
        this.tempCards = [];
        this.creationMode = null;
        this.initializeElements();
        this.setupEventListeners();
        this.populateFolderOptions(this.deckFolder);
        this.renderDecks();
        this.updateMuteButton();
    }

    initializeElements() {
        // Navigation
        this.navTabs = document.querySelectorAll('.nav-tab');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Create deck elements
        this.deckName = document.getElementById('deck-name');
        this.deckCategory = document.getElementById('deck-category');
        this.deckFolder = document.getElementById('deck-folder');
        this.autoMethodBtn = document.getElementById('auto-method-btn');
        this.manualMethodBtn = document.getElementById('manual-method-btn');
        this.autoInput = document.getElementById('auto-input');
        this.manualInput = document.getElementById('manual-input');
        this.notesInput = document.getElementById('notes-input');
        this.generateBtn = document.getElementById('generate-btn');
        this.cardFront = document.getElementById('card-front');
        this.cardBack = document.getElementById('card-back');
        this.addCardBtn = document.getElementById('add-card-btn');
        this.cardsPreview = document.getElementById('cards-preview');
        this.previewCards = document.getElementById('preview-cards');
        this.saveDeckBtn = document.getElementById('save-deck-btn');
        this.cancelDeckBtn = document.getElementById('cancel-deck-btn');

        // Study elements
        this.studyModeContent = document.getElementById('study-mode-content');
        this.noStudyContent = document.getElementById('no-study-content');
        this.studyProgress = document.getElementById('study-progress');
        this.progressFill = document.getElementById('progress-fill');
        this.flashcard = document.getElementById('flashcard');
        this.cardContent = document.getElementById('card-content');
        this.prevBtn = document.getElementById('prev-btn');
        this.flipBtn = document.getElementById('flip-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.endStudyBtn = document.getElementById('end-study-btn');

        // Other elements
        this.decksList = document.getElementById('decks-list');
        this.announcements = document.getElementById('announcements');

        // Help modal elements (dialog)
        this.openHelpBtn = document.getElementById('open-help-btn');
        this.helpModal = document.getElementById('help-modal');
        this.closeHelpBtn = document.getElementById('close-help-btn');
        this.mainEl = document.querySelector('main');
        this.lastFocusedBeforeHelp = null;

        // Folder and generic app modal elements
        this.addFolderBtn = document.getElementById('add-folder-btn');
        this.appContainer = document.querySelector('.container');

        // Sound control
        this.muteToggleBtn = document.getElementById('mute-toggle-btn');

        // Generic modal elements (used for prompts/confirmations)
        this.modal = document.getElementById('app-modal');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalTitle = document.getElementById('modal-title');
        this.modalDesc = document.getElementById('modal-desc');
        this.modalContent = document.getElementById('modal-content');
        this.modalCancelBtn = document.getElementById('modal-cancel-btn');
        this.modalConfirmBtn = document.getElementById('modal-confirm-btn');
        this._lastFocusedEl = null;
    }

    setupEventListeners() {
        // Navigation
        this.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Create deck
        this.autoMethodBtn.addEventListener('click', () => this.setCreationMode('auto'));
        this.manualMethodBtn.addEventListener('click', () => this.setCreationMode('manual'));
        this.generateBtn.addEventListener('click', () => this.generateCards());
        this.addCardBtn.addEventListener('click', () => this.addManualCard());
        this.saveDeckBtn.addEventListener('click', () => this.saveDeck());
        this.cancelDeckBtn.addEventListener('click', () => this.cancelDeck());
        this.deckFolder.addEventListener('change', (e) => this.onDeckFolderSelectChanged(e));

        // Study mode
        this.flipBtn.addEventListener('click', () => this.flipCard());
        this.flashcard.addEventListener('click', () => this.flipCard());
        this.flashcard.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.flipCard();
            }
        });
        this.prevBtn.addEventListener('click', () => this.previousCard());
        this.nextBtn.addEventListener('click', () => this.nextCard());
        this.endStudyBtn.addEventListener('click', () => this.endStudy());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Skip shortcuts when typing in input fields
            const tag = (e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '');
            const isTyping = ['input', 'textarea', 'select'].includes(tag);

            // Skip if a modal is open (except help modal shortcuts)
            const isModalOpen = this.isAppModalOpen();

            // Global Help shortcut (Shift + / => ?)
            if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !isTyping) {
                e.preventDefault();
                this.openHelpModal();
                return;
            }

            // Study mode shortcuts
            if (this.currentDeck) {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.previousCard();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.nextCard();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        if (this.isHelpOpen()) {
                            this.closeHelpModal();
                        } else {
                            this.endStudy();
                        }
                        break;
                }
            }

            // Global navigation hotkeys (only when not typing and no modal open)
            if (!isTyping && !isModalOpen && !this.isHelpOpen()) {
                switch(e.key.toLowerCase()) {
                    case 'd':
                        // Go to My Decks tab
                        e.preventDefault();
                        if (this.currentDeck) this.endStudy();
                        this.switchTab('decks');
                        break;
                    case 'c':
                    case 'n':
                        // Go to Create Deck tab (c = create, n = new)
                        e.preventDefault();
                        if (this.currentDeck) this.endStudy();
                        this.switchTab('create');
                        this.deckName.focus();
                        break;
                    case 'f':
                        // Create new folder
                        e.preventDefault();
                        if (this.currentDeck) this.endStudy();
                        this.promptAddFolder();
                        break;
                    case 's':
                        // Start studying (first deck or focused deck)
                        e.preventDefault();
                        if (!this.currentDeck && this.decks.length > 0) {
                            this.startStudy(0);
                        }
                        break;
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                    case '9':
                        // Quick study deck by number
                        const deckIndex = parseInt(e.key) - 1;
                        if (deckIndex < this.decks.length) {
                            e.preventDefault();
                            this.startStudy(deckIndex);
                        }
                        break;
                }
            }
        });

        // Help modal events
        if (this.openHelpBtn) this.openHelpBtn.addEventListener('click', () => this.openHelpModal());
        if (this.closeHelpBtn) this.closeHelpBtn.addEventListener('click', () => this.closeHelpModal());
        if (this.helpModal) this.helpModal.addEventListener('close', () => this.closeHelpModal(true));

        // Trap focus within help dialog and handle Escape when it's open
        document.addEventListener('keydown', (e) => {
            if (!this.isHelpOpen()) return;
            if (e.key === 'Tab') this.trapFocus(e);
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closeHelpModal();
            }
        });

        // Folder actions
        if (this.addFolderBtn) {
            this.addFolderBtn.addEventListener('click', () => this.promptAddFolder());
        }

        // Sound toggle
        if (this.muteToggleBtn) {
            this.muteToggleBtn.addEventListener('click', () => this.toggleMute());
        }
    }

    announce(message) {
        this.announcements.textContent = message;
        setTimeout(() => {
            this.announcements.textContent = '';
        }, 1000);
    }

    toggleMute() {
        const isMuted = this.soundManager.toggleMute();
        this.updateMuteButton();
        this.announce(isMuted ? 'Sounds muted' : 'Sounds enabled');
    }

    updateMuteButton() {
        if (!this.muteToggleBtn) return;
        const isMuted = this.soundManager.isMuted();
        const wasActive = document.activeElement === this.muteToggleBtn;

        this.muteToggleBtn.textContent = isMuted ? '🔇' : '🔊';
        this.muteToggleBtn.setAttribute('aria-label', isMuted ? 'Unmute sounds' : 'Mute sounds');

        // Force screen readers to re-announce by briefly removing and restoring focus
        if (wasActive) {
            this.muteToggleBtn.blur();
            setTimeout(() => {
                this.muteToggleBtn.focus();
            }, 10);
        }
    }

    switchTab(tabName) {
        // Update nav tabs
        this.navTabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).setAttribute('aria-selected', 'true');

        // Update tab content
        this.tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.announce(`Switched to ${tabName} tab`);
    }

    loadDecks() {
        try {
            const saved = localStorage.getItem('studyflow-decks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Could not load decks:', error);
            return [];
        }
    }

    saveDecks() {
        try {
            localStorage.setItem('studyflow-decks', JSON.stringify(this.decks));
            return true;
        } catch (error) {
            console.warn('Could not save decks:', error);
            return false;
        }
    }

    // Folder persistence
    loadFolders() {
        try {
            const saved = localStorage.getItem('studyflow-folders');
            const folders = saved ? JSON.parse(saved) : [];
            return Array.isArray(folders) ? folders : [];
        } catch (error) {
            console.warn('Could not load folders:', error);
            return [];
        }
    }

    saveFolders() {
        try {
            localStorage.setItem('studyflow-folders', JSON.stringify(this.folders));
            return true;
        } catch (error) {
            console.warn('Could not save folders:', error);
            return false;
        }
    }

    loadFolderExpandedState() {
        try {
            const saved = localStorage.getItem('studyflow-folder-expanded');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Could not load folder expanded state:', error);
            return {};
        }
    }

    saveFolderExpandedState() {
        try {
            localStorage.setItem('studyflow-folder-expanded', JSON.stringify(this.folderExpandedState));
            return true;
        } catch (error) {
            console.warn('Could not save folder expanded state:', error);
            return false;
        }
    }

    generateFolderId() {
        return 'f_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    populateFolderOptions(selectEl, selectedId = '') {
        if (!selectEl) return;
        const current = selectedId !== undefined && selectedId !== null ? selectedId : (selectEl.value || '');
        selectEl.innerHTML = '';
        const optNone = document.createElement('option');
        optNone.value = '';
        optNone.textContent = '(No folder)';
        selectEl.appendChild(optNone);

        const foldersSorted = [...this.folders].sort((a, b) => a.name.localeCompare(b.name));
        foldersSorted.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            selectEl.appendChild(opt);
        });

        const optNew = document.createElement('option');
        optNew.value = '__NEW__';
        optNew.textContent = 'New folder…';
        selectEl.appendChild(optNew);

        selectEl.value = current;
        if (selectEl.value !== current) {
            selectEl.value = '';
        }
    }

    onDeckFolderSelectChanged(e) {
        if (e.target.value === '__NEW__') {
            this.promptAddFolder({ focusSelectAfter: true, applyToSelect: e.target });
        }
    }

    async promptAddFolder({ focusSelectAfter = false, applyToSelect = null } = {}) {
        const name = await this.openTextModal({
            title: 'Create folder',
            label: 'Folder name',
            confirmText: 'Create',
        });
        if (!name || !name.trim()) {
            if (applyToSelect) applyToSelect.value = '';
            return;
        }
        const finalName = name.trim();
        const dup = this.folders.find(f => f.name.toLowerCase() === finalName.toLowerCase());
        if (dup) {
            this.announce(`A folder named "${finalName}" already exists.`);
            if (applyToSelect) {
                applyToSelect.value = dup.id;
            }
            return;
        }
        const folder = { id: this.generateFolderId(), name: finalName, created: new Date().toISOString() };
        this.folders.push(folder);
        if (this.saveFolders()) {
            this.announce(`Folder "${finalName}" created.`);
            this.populateFolderOptions(this.deckFolder, folder.id);
            this.renderDecks();
            if (applyToSelect) {
                this.populateFolderOptions(applyToSelect, folder.id);
                applyToSelect.value = folder.id;
            }
            if (focusSelectAfter) (applyToSelect || this.deckFolder).focus();
        } else {
            this.announce('Error saving folder. Please try again.');
        }
    }

    async renameFolder(folderId) {
        const folder = this.folders.find(f => f.id === folderId);
        if (!folder) return;
        const newName = await this.openTextModal({
            title: 'Rename folder',
            label: 'Folder name',
            initialValue: folder.name,
            confirmText: 'Rename',
        });
        if (!newName || !newName.trim()) return;
        const finalName = newName.trim();
        const dup = this.folders.find(f => f.id !== folderId && f.name.toLowerCase() === finalName.toLowerCase());
        if (dup) {
            this.announce(`A folder named "${finalName}" already exists.`);
            return;
        }
        folder.name = finalName;
        if (this.saveFolders()) {
            this.populateFolderOptions(this.deckFolder, this.deckFolder.value);
            this.renderDecks();
            this.announce('Folder renamed.');
        }
    }

    async deleteFolder(folderId) {
        const folder = this.folders.find(f => f.id === folderId);
        if (!folder) return;
        const confirmDelete = await this.openConfirmModal({
            title: 'Delete folder',
            message: `Delete folder "${folder.name}"? Decks will be moved to (No folder).`,
            confirmText: 'Delete',
        });
        if (!confirmDelete) return;
        this.decks.forEach(d => { if (d.folderId === folderId) d.folderId = null; });
        this.folders = this.folders.filter(f => f.id !== folderId);
        delete this.folderExpandedState[folderId];
        this.saveFolders();
        this.saveDecks();
        this.saveFolderExpandedState();
        this.populateFolderOptions(this.deckFolder, this.deckFolder.value === folderId ? '' : this.deckFolder.value);
        this.renderDecks();
        this.announce('Folder deleted and decks moved to (No folder).');
    }

    toggleFolder(folderId) {
        const isExpanded = this.folderExpandedState[folderId] || false;
        this.folderExpandedState[folderId] = !isExpanded;
        this.saveFolderExpandedState();
        this.renderDecks();
        const folder = this.folders.find(f => f.id === folderId);
        if (folder) {
            const newState = this.folderExpandedState[folderId] ? 'expanded' : 'collapsed';
            this.announce(`Folder "${folder.name}" ${newState}.`);
        }
    }

    renderDecks() {
        if (this.decks.length === 0) {
            this.decksList.innerHTML = `
                <div class="empty-state">
                    <h3>Welcome to StudyFlow!</h3>
                    <p>Create your first deck to get started studying.</p>
                    <button type="button" onclick="app.switchTab('create')">Create Your First Deck</button>
                </div>
            `;
            return;
        }

        this.decksList.innerHTML = '';

        // Group decks by folder
        const groups = new Map();
        this.decks.forEach((deck, idx) => {
            const key = deck.folderId || null;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(idx);
        });

        const foldersSorted = [...this.folders].sort((a, b) => a.name.localeCompare(b.name));

        // Render Folders section if there are any folders
        if (foldersSorted.length > 0) {
            const foldersSection = document.createElement('section');
            foldersSection.className = 'folders-section';
            foldersSection.setAttribute('aria-labelledby', 'folders-heading');

            const foldersHeading = document.createElement('h3');
            foldersHeading.id = 'folders-heading';
            foldersHeading.textContent = 'Folders';
            foldersSection.appendChild(foldersHeading);

            foldersSorted.forEach(folder => {
                const folderId = folder.id;
                const folderDecks = groups.get(folderId) || [];
                const isExpanded = this.folderExpandedState[folderId] || false;
                const deckCount = folderDecks.length;
                const decksContentId = `folder-content-${folderId}`;

                const folderContainer = document.createElement('div');
                folderContainer.className = 'folder-container';

                // Folder toggle button
                const folderButton = document.createElement('button');
                folderButton.type = 'button';
                folderButton.className = 'folder-toggle';
                folderButton.setAttribute('aria-expanded', isExpanded.toString());
                folderButton.setAttribute('aria-controls', decksContentId);
                folderButton.innerHTML = `<span class="folder-icon">${isExpanded ? '▼' : '▶'}</span> ${folder.name} <span class="folder-count">(${deckCount} ${deckCount === 1 ? 'deck' : 'decks'})</span>`;
                folderButton.onclick = () => this.toggleFolder(folderId);

                folderContainer.appendChild(folderButton);

                // Folder actions (rename/delete)
                const folderActions = document.createElement('div');
                folderActions.className = 'folder-actions';
                folderActions.innerHTML = `
                    <button type="button" onclick="app.renameFolder('${folderId}')" aria-label="Rename folder ${folder.name}">Rename</button>
                    <button type="button" onclick="app.deleteFolder('${folderId}')" aria-label="Delete folder ${folder.name}">Delete</button>
                `;
                folderContainer.appendChild(folderActions);

                // Decks content (only shown when expanded)
                if (isExpanded && folderDecks.length > 0) {
                    const decksContent = document.createElement('div');
                    decksContent.id = decksContentId;
                    decksContent.className = 'folder-decks-content';
                    decksContent.setAttribute('role', 'region');
                    decksContent.setAttribute('aria-label', `Decks in ${folder.name}`);

                    folderDecks.forEach(deckIndex => {
                        const deckEl = this.createDeckCard(deckIndex);
                        decksContent.appendChild(deckEl);
                    });

                    folderContainer.appendChild(decksContent);
                }

                foldersSection.appendChild(folderContainer);
            });

            this.decksList.appendChild(foldersSection);
        }

        // Render "My Decks" section for unorganized decks
        const unorganizedDecks = groups.get(null) || [];
        if (unorganizedDecks.length > 0) {
            const myDecksSection = document.createElement('section');
            myDecksSection.className = 'my-decks-section';
            myDecksSection.setAttribute('aria-labelledby', 'my-decks-heading');

            const myDecksHeading = document.createElement('h3');
            myDecksHeading.id = 'my-decks-heading';
            myDecksHeading.textContent = 'My Decks';
            myDecksSection.appendChild(myDecksHeading);

            unorganizedDecks.forEach(deckIndex => {
                const deckEl = this.createDeckCard(deckIndex);
                myDecksSection.appendChild(deckEl);
            });

            this.decksList.appendChild(myDecksSection);
        }
    }

    createDeckCard(deckIndex) {
        const deck = this.decks[deckIndex];
        const deckEl = document.createElement('article');
        deckEl.className = 'deck-card';
        deckEl.setAttribute('aria-labelledby', `deck-title-${deckIndex}`);
        const moveSelectId = `move-folder-${deckIndex}`;
        deckEl.innerHTML = `
            <div class="deck-header">
                <h4 id="deck-title-${deckIndex}" class="deck-title">${deck.name}</h4>
            </div>
            <p>${deck.cards.length} cards • ${deck.category}</p>
            <div class="section" style="margin-top:10px;">
                <label for="${moveSelectId}">Move to folder:</label>
                <select id="${moveSelectId}" data-deck-index="${deckIndex}">
                </select>
            </div>
            <div class="button-group deck-actions">
                <button type="button" onclick="app.startStudy(${deckIndex})" aria-label="Study deck ${deck.name}">Study This Deck</button>
                <button type="button" onclick="app.deleteDeck(${deckIndex})" aria-label="Delete deck ${deck.name}">Delete</button>
            </div>
        `;

        const selectEl = deckEl.querySelector(`#${moveSelectId}`);
        this.populateFolderOptions(selectEl, deck.folderId || '');
        selectEl.addEventListener('change', (ev) => this.onMoveDeckFolderChanged(ev));

        return deckEl;
    }

    setCreationMode(mode) {
        this.creationMode = mode;
        this.autoInput.classList.toggle('hidden', mode !== 'auto');
        this.manualInput.classList.toggle('hidden', mode !== 'manual');

        if (mode === 'auto') {
            this.notesInput.focus();
            this.announce('Auto-generate mode selected. Paste your notes.');
        } else {
            this.cardFront.focus();
            this.announce('Manual mode selected. Create cards one at a time.');
        }
    }

    generateCards() {
        const notes = this.notesInput.value.trim();
        if (!notes) {
            this.announce('Please paste your study notes first.');
            this.notesInput.focus();
            return;
        }

        this.tempCards = this.parseNotes(notes);

        if (this.tempCards.length === 0) {
            this.announce('No flashcards could be generated. Please check your notes format.');
            return;
        }

        this.showPreview();
        this.announce(`Successfully generated ${this.tempCards.length} flashcards.`);
    }

    parseNotes(notes) {
        const cards = [];
        const lines = notes.split('\n').map(line => line.trim()).filter(line => line);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.includes('?') && i + 1 < lines.length) {
                const question = line;
                const answer = lines[i + 1];
                if (!answer.includes('?')) {
                    cards.push({ front: question, back: answer });
                    i++;
                }
            }
            else if (line.toLowerCase().startsWith('definition:')) {
                const term = line.substring(11).trim();
                if (i + 1 < lines.length) {
                    const definition = lines[i + 1];
                    cards.push({ front: `What is ${term}?`, back: definition });
                    i++;
                }
            }
            else if (line.includes(':') && !line.includes('?')) {
                const parts = line.split(':');
                if (parts.length >= 2) {
                    const term = parts[0].trim();
                    const definition = parts.slice(1).join(':').trim();
                    if (definition.length > 10) {
                        cards.push({ front: `What is ${term}?`, back: definition });
                    }
                }
            }
        }

        return cards;
    }

    addManualCard() {
        const front = this.cardFront.value.trim();
        const back = this.cardBack.value.trim();

        if (!front || !back) {
            this.announce('Please fill in both the front and back of the card.');
            if (!front) this.cardFront.focus();
            else this.cardBack.focus();
            return;
        }

        this.tempCards.push({ front, back });

        this.cardFront.value = '';
        this.cardBack.value = '';

        this.showPreview();
        this.announce(`Card added. You now have ${this.tempCards.length} cards.`);
        this.cardFront.focus();
    }

    showPreview() {
        this.previewCards.innerHTML = '';
        this.tempCards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'deck-card';
            cardElement.innerHTML = `
                <div class="deck-header">
                    <span>Card ${index + 1}</span>
                    <button type="button" onclick="app.removeCard(${index})">Remove</button>
                </div>
                <p><strong>Front:</strong> ${card.front}</p>
                <p><strong>Back:</strong> ${card.back}</p>
            `;
            this.previewCards.appendChild(cardElement);
        });

        this.cardsPreview.classList.remove('hidden');
    }

    removeCard(index) {
        this.tempCards.splice(index, 1);
        if (this.tempCards.length === 0) {
            this.cardsPreview.classList.add('hidden');
        } else {
            this.showPreview();
        }
        this.announce(`Card removed. ${this.tempCards.length} cards remaining.`);
    }

    saveDeck() {
        const name = this.deckName.value.trim();
        const category = this.deckCategory.value;
        const folderId = this.deckFolder.value || null;

        if (!name) {
            this.announce('Please enter a deck name.');
            this.deckName.focus();
            return;
        }

        if (this.tempCards.length === 0) {
            this.announce('Please create at least one card before saving.');
            return;
        }

        const deck = { name, category, folderId, cards: this.tempCards, created: new Date().toISOString() };

        this.decks.push(deck);
        if (this.saveDecks()) {
            this.announce(`Deck "${name}" saved successfully with ${this.tempCards.length} cards.`);
            this.renderDecks();
            this.resetCreateForm();
            this.switchTab('decks');
        } else {
            this.announce('Error saving deck. Please try again.');
        }
    }

    async cancelDeck() {
        if (this.tempCards.length > 0) {
            const ok = await this.openConfirmModal({
                title: 'Discard deck?',
                message: 'Are you sure you want to cancel? All unsaved cards will be lost.',
                confirmText: 'Discard',
            });
            if (!ok) return;
        }
        this.resetCreateForm();
        this.switchTab('decks');
    }

    resetCreateForm() {
        this.deckName.value = '';
        this.deckCategory.value = 'Biology';
        this.notesInput.value = '';
        this.cardFront.value = '';
        this.cardBack.value = '';
        this.tempCards = [];
        this.creationMode = null;
        this.autoInput.classList.add('hidden');
        this.manualInput.classList.add('hidden');
        this.cardsPreview.classList.add('hidden');
        this.populateFolderOptions(this.deckFolder);
        this.deckFolder.value = '';
    }

    async deleteDeck(index) {
        const deck = this.decks[index];
        const ok = await this.openConfirmModal({
            title: 'Delete deck',
            message: `Are you sure you want to delete "${deck.name}"?`,
            confirmText: 'Delete',
        });
        if (!ok) return;
        this.decks.splice(index, 1);
        this.saveDecks();
        this.renderDecks();
        this.announce(`Deck "${deck.name}" deleted.`);
    }

    onMoveDeckFolderChanged(e) {
        const target = e.target;
        const deckIndex = Number(target.getAttribute('data-deck-index'));
        if (target.value === '__NEW__') {
            this.promptAddFolder({ focusSelectAfter: true, applyToSelect: target });
            return;
        }
        const newFolderId = target.value || null;
        const deck = this.decks[deckIndex];
        deck.folderId = newFolderId;
        this.saveDecks();
        this.renderDecks();
        const folderName = newFolderId ? (this.folders.find(f => f.id === newFolderId)?.name || '(Unknown)') : '(No folder)';
        this.announce(`Moved deck "${deck.name}" to folder ${folderName}.`);
    }

    startStudy(deckIndex) {
        this.soundManager.play('enterStudy');
        this.currentDeck = this.decks[deckIndex];
        this.currentCardIndex = 0;
        this.showingFront = true;

        this.switchTab('study');
        this.studyModeContent.classList.remove('hidden');
        this.noStudyContent.classList.add('hidden');

        this.displayCurrentCard();
        this.announce(`Started studying "${this.currentDeck.name}" with ${this.currentDeck.cards.length} cards.`);
        this.flashcard.focus();
    }

    displayCurrentCard() {
        if (!this.currentDeck || !this.currentDeck.cards.length) return;

        const card = this.currentDeck.cards[this.currentCardIndex];
        const progress = Math.round(((this.currentCardIndex + 1) / this.currentDeck.cards.length) * 100);

        this.studyProgress.textContent = `Card ${this.currentCardIndex + 1} of ${this.currentDeck.cards.length}`;
        this.progressFill.style.width = `${progress}%`;

        const content = this.showingFront ? card.front : card.back;
        const side = this.showingFront ? 'front' : 'back';

        this.cardContent.textContent = content;
        this.flashcard.setAttribute('aria-label',
            `Card ${this.currentCardIndex + 1} of ${this.currentDeck.cards.length}, showing ${side}. ${content}. Press Space or Enter to flip.`
        );

        this.prevBtn.disabled = this.currentCardIndex === 0;
        this.nextBtn.disabled = this.currentCardIndex === this.currentDeck.cards.length - 1;
    }

    flipCard() {
        if (!this.currentDeck) return;

        this.soundManager.play('flip');
        this.showingFront = !this.showingFront;
        this.displayCurrentCard();

        const side = this.showingFront ? 'front' : 'back';
        const content = this.currentDeck.cards[this.currentCardIndex][this.showingFront ? 'front' : 'back'];
        this.announce(`Flipped to ${side}: ${content}`);
    }

    previousCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.showingFront = true;
            this.displayCurrentCard();
            this.announce(`Previous card: ${this.currentDeck.cards[this.currentCardIndex].front}`);
        }
    }

    nextCard() {
        if (this.currentCardIndex < this.currentDeck.cards.length - 1) {
            this.currentCardIndex++;
            this.showingFront = true;
            this.displayCurrentCard();
            this.announce(`Next card: ${this.currentDeck.cards[this.currentCardIndex].front}`);
        } else {
            this.announce('You have reached the end of the flashcards. Great job!');
        }
    }

    endStudy() {
        this.soundManager.play('exitStudy');
        this.currentDeck = null;
        this.switchTab('decks');
        this.studyModeContent.classList.add('hidden');
        this.noStudyContent.classList.remove('hidden');
        this.announce('Study session ended.');
    }

    // ===== Modal Helpers =====
    isAppModalOpen() {
        return this.modal && !this.modal.classList.contains('hidden');
    }

    isHelpOpen() {
        return this.helpModal && this.helpModal.open === true;
    }

    getFocusableElementsInModal() {
        if (!this.helpModal) return [];
        const selectors = [
            'a[href]', 'area[href]', 'button:not([disabled])', 'input:not([disabled])',
            'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
        ];
        return Array.from(this.helpModal.querySelectorAll(selectors.join(',')))
            .filter(el => el.offsetParent !== null || el === document.activeElement);
    }

    openHelpModal() {
        if (!this.helpModal || this.isHelpOpen()) return;
        this.lastFocusedBeforeHelp = document.activeElement;
        try { this.helpModal.showModal(); } catch (_) { this.helpModal.show(); }
        this.helpModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const dialog = this.helpModal.querySelector('.modal-dialog');
        if (dialog) dialog.focus();
        const focusables = this.getFocusableElementsInModal();
        if (focusables.length) focusables[0].focus();
        this.announce('Help opened.');
    }

    closeHelpModal() {
        if (!this.helpModal || !this.isHelpOpen()) return;
        if (!arguments[0]) {
            try { this.helpModal.close(); } catch (_) {}
        }
        this.helpModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (this.lastFocusedBeforeHelp && typeof this.lastFocusedBeforeHelp.focus === 'function') {
            this.lastFocusedBeforeHelp.focus();
        } else if (this.openHelpBtn) {
            this.openHelpBtn.focus();
        }
        this.announce('Help closed.');
    }

    trapFocus(e) {
        const focusables = this.getFocusableElementsInModal();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
            if (active === first || !this.helpModal.contains(active)) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (active === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
}

// Global functions for onclick events
function switchTab(tabName) {
    app.switchTab(tabName);
}

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StudyFlowApp();
});

// Modal helpers added to StudyFlowApp prototype
StudyFlowApp.prototype.openTextModal = function({ title, label, initialValue = '', confirmText = 'Save', cancelText = 'Cancel' }) {
    return new Promise((resolve) => {
        const inputId = 'modal-text-input';
        this.modalTitle.textContent = title;
        this.modalDesc.textContent = `${label} input dialog.`;
        this.modalContent.innerHTML = `
            <label for="${inputId}">${label}:</label>
            <input type="text" id="${inputId}" value="${initialValue.replace(/\"/g, '&quot;')}">
        `;
        this.modalConfirmBtn.textContent = confirmText;
        this.modalCancelBtn.textContent = cancelText;

        const inputEl = this.modalContent.querySelector(`#${inputId}`);
        const removeInputListener = () => inputEl.removeEventListener('input', updateConfirmState);
        const cleanup = this._openModalCommon({
            initialFocus: inputEl,
            onConfirm: () => { removeInputListener(); cleanup(); resolve(inputEl.value); },
            onCancel: () => { removeInputListener(); cleanup(); resolve(null); },
        });

        const updateConfirmState = () => {
            const hasText = inputEl.value.trim().length > 0;
            this.modalConfirmBtn.disabled = !hasText;
        };
        inputEl.addEventListener('input', updateConfirmState);
        updateConfirmState();

        setTimeout(() => { inputEl.select(); }, 0);
    });
};

StudyFlowApp.prototype.openConfirmModal = function({ title, message, confirmText = 'OK', cancelText = 'Cancel' }) {
    return new Promise((resolve) => {
        this.modalTitle.textContent = title;
        this.modalDesc.textContent = message;
        this.modalContent.innerHTML = `<p>${message}</p>`;
        this.modalConfirmBtn.textContent = confirmText;
        this.modalCancelBtn.textContent = cancelText;
        this._openModalCommon({
            initialFocus: this.modalConfirmBtn,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
        });
    });
};

// Internal modal open/close with focus trap
StudyFlowApp.prototype._openModalCommon = function({ initialFocus, onConfirm, onCancel }) {
    this._lastFocusedEl = document.activeElement;
    this.modal.classList.remove('hidden');
    this.modalOverlay.classList.remove('hidden');
    this.modalOverlay.setAttribute('aria-hidden', 'false');
    if (this.appContainer) this.appContainer.setAttribute('aria-hidden', 'true');

    const focusable = () => Array.from(this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !el.disabled && el.offsetParent !== null);
    const keyHandler = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            doCancel();
        } else if (e.key === 'Tab') {
            const els = focusable();
            if (els.length === 0) return;
            const first = els[0];
            const last = els[els.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };
    document.addEventListener('keydown', keyHandler);

    const doConfirm = () => { this._restoreModalClose(); onConfirm && onConfirm(); };
    const doCancel = () => { this._restoreModalClose(); onCancel && onCancel(); };
    const clickOutside = (e) => { if (e.target === this.modalOverlay) doCancel(); };
    this.modalConfirmBtn.onclick = doConfirm;
    this.modalCancelBtn.onclick = doCancel;
    this.modalOverlay.addEventListener('click', clickOutside);

    (initialFocus || this.modalConfirmBtn).focus();

    return () => {
        document.removeEventListener('keydown', keyHandler);
        this.modalOverlay.removeEventListener('click', clickOutside);
        this.modalConfirmBtn.onclick = null;
        this.modalCancelBtn.onclick = null;
    };
};

StudyFlowApp.prototype._restoreModalClose = function() {
    this.modal.classList.add('hidden');
    this.modalOverlay.classList.add('hidden');
    this.modalOverlay.setAttribute('aria-hidden', 'true');
    if (this.appContainer) this.appContainer.removeAttribute('aria-hidden');
    if (this._lastFocusedEl && typeof this._lastFocusedEl.focus === 'function') {
        this._lastFocusedEl.focus();
    }
};

// For backward compatibility
StudyFlowApp.prototype._closeModal = function() {
    this._restoreModalClose();
};

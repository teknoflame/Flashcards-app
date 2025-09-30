// Legacy StudyFlow application code adapted to initialize on demand.
(function(){
  // Copy of StudyFlowApp class (trimmed comments). Use the version from root app.js but don't auto-initialize.
  class StudyFlowApp {
    constructor() {
      this.decks = this.loadDecks();
      this.folders = this.loadFolders();
      this.currentDeck = null;
      this.currentCardIndex = 0;
      this.showingFront = true;
      this.tempCards = [];
      this.creationMode = null;
      this.initializeElements();
      this.setupEventListeners();
      this.populateFolderOptions(this.deckFolder);
      this.renderDecks();
    }

    initializeElements() {
      this.navTabs = document.querySelectorAll('.nav-tab');
      this.tabContents = document.querySelectorAll('.tab-content');
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
      this.cardMedia = document.getElementById('card-media');
      this.addCardBtn = document.getElementById('add-card-btn');
      this.cardsPreview = document.getElementById('cards-preview');
      this.previewCards = document.getElementById('preview-cards');
      this.saveDeckBtn = document.getElementById('save-deck-btn');
      this.cancelDeckBtn = document.getElementById('cancel-deck-btn');
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
      this.decksList = document.getElementById('decks-list');
      this.announcements = document.getElementById('announcements');
      this.openHelpBtn = document.getElementById('open-help-btn');
      this.helpModal = document.getElementById('help-modal');
      this.closeHelpBtn = document.getElementById('close-help-btn');
      this.mainEl = document.querySelector('main');
      this.lastFocusedBeforeHelp = null;
      this.addFolderBtn = document.getElementById('add-folder-btn');
      this.appContainer = document.querySelector('.container');
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
      if (this.navTabs) this.navTabs.forEach(tab => {
        tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
      });
      if (this.autoMethodBtn) this.autoMethodBtn.addEventListener('click', () => this.setCreationMode('auto'));
      if (this.manualMethodBtn) this.manualMethodBtn.addEventListener('click', () => this.setCreationMode('manual'));
      if (this.generateBtn) this.generateBtn.addEventListener('click', () => this.generateCards());
      if (this.addCardBtn) this.addCardBtn.addEventListener('click', () => this.addManualCard());
      if (this.saveDeckBtn) this.saveDeckBtn.addEventListener('click', () => this.saveDeck());
      if (this.cancelDeckBtn) this.cancelDeckBtn.addEventListener('click', () => this.cancelDeck());
      if (this.deckFolder) this.deckFolder.addEventListener('change', (e) => this.onDeckFolderSelectChanged(e));
      if (this.flipBtn) this.flipBtn.addEventListener('click', () => this.flipCard());
      if (this.flashcard) this.flashcard.addEventListener('click', () => this.flipCard());
      if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.previousCard());
      if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextCard());
      if (this.endStudyBtn) this.endStudyBtn.addEventListener('click', () => this.endStudy());
      if (this.openHelpBtn) this.openHelpBtn.addEventListener('click', () => this.openHelpModal());
      if (this.closeHelpBtn) this.closeHelpBtn.addEventListener('click', () => this.closeHelpModal());
      if (this.addFolderBtn) this.addFolderBtn.addEventListener('click', () => this.promptAddFolder());
      document.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '');
        if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !['input','textarea','select'].includes(tag)) {
          e.preventDefault();
          this.openHelpModal();
          return;
        }
        if (this.currentDeck) {
          if (e.key === 'ArrowLeft') { e.preventDefault(); this.previousCard(); }
          if (e.key === 'ArrowRight') { e.preventDefault(); this.nextCard(); }
          if (e.key === 'Escape') { e.preventDefault(); if (this.isHelpOpen()) this.closeHelpModal(); else this.endStudy(); }
        }
      });
    }

    announce(message) { if (this.announcements) { this.announcements.textContent = message; setTimeout(()=>{this.announcements.textContent='';},1000); } }

    switchTab(tabName) {
      if (!this.navTabs || !this.tabContents) return;
      this.navTabs.forEach(tab => { tab.classList.remove('active'); tab.setAttribute('aria-selected','false'); });
      const sel = document.querySelector(`[data-tab="${tabName}"]`);
      if (sel) { sel.classList.add('active'); sel.setAttribute('aria-selected','true'); }
      this.tabContents.forEach(content => content.classList.remove('active'));
      const tc = document.getElementById(`${tabName}-tab`);
      if (tc) tc.classList.add('active');
      this.announce(`Switched to ${tabName} tab`);
    }

    loadDecks(){ try{ const s=localStorage.getItem('studyflow-decks'); return s?JSON.parse(s):[] }catch(e){return[]}}
    saveDecks(){ try{ localStorage.setItem('studyflow-decks',JSON.stringify(this.decks)); return true }catch(e){return false} }
    loadFolders(){ try{ const s=localStorage.getItem('studyflow-folders'); const f=s?JSON.parse(s):[]; return Array.isArray(f)?f:[] }catch(e){return[]} }
    saveFolders(){ try{ localStorage.setItem('studyflow-folders',JSON.stringify(this.folders)); return true }catch(e){return false} }
    generateFolderId(){ return 'f_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8); }

    populateFolderOptions(selectEl, selectedId=''){
      if(!selectEl) return;
      const current = selectedId !== undefined && selectedId !== null ? selectedId : (selectEl.value||'');
      selectEl.innerHTML='';
      const optNone = document.createElement('option'); optNone.value=''; optNone.textContent='(No folder)'; selectEl.appendChild(optNone);
      const foldersSorted = [...this.folders].sort((a,b)=>a.name.localeCompare(b.name));
      foldersSorted.forEach(f=>{ const opt=document.createElement('option'); opt.value=f.id; opt.textContent=f.name; selectEl.appendChild(opt); });
      const optNew=document.createElement('option'); optNew.value='__NEW__'; optNew.textContent='New folder…'; selectEl.appendChild(optNew);
      selectEl.value = current; if (selectEl.value !== current) selectEl.value = '';
    }

    onDeckFolderSelectChanged(e){ if(e.target.value==='__NEW__'){ this.promptAddFolder({ focusSelectAfter:true, applyToSelect:e.target }); } }

    async promptAddFolder({ focusSelectAfter=false, applyToSelect=null }={}){
      const name = await this.openTextModal({ title:'Create folder', label:'Folder name', confirmText:'Create' });
      if(!name||!name.trim()){ if (applyToSelect) applyToSelect.value = ''; return; }
      const finalName = name.trim(); const dup = this.folders.find(f=>f.name.toLowerCase()===finalName.toLowerCase());
      if (dup) { this.announce(`A folder named "${finalName}" already exists.`); if (applyToSelect) applyToSelect.value = dup.id; return; }
      const folder = { id:this.generateFolderId(), name: finalName, created: new Date().toISOString() };
      this.folders.push(folder);
      if (this.saveFolders()) { this.announce(`Folder "${finalName}" created.`); this.populateFolderOptions(this.deckFolder, folder.id); this.renderDecks(); if (applyToSelect) { this.populateFolderOptions(applyToSelect, folder.id); applyToSelect.value = folder.id; } if (focusSelectAfter) (applyToSelect || this.deckFolder).focus(); }
    }

    renderDecks(){ if(!this.decks||this.decks.length===0){ if(this.decksList) this.decksList.innerHTML = `<div class="empty-state"><h3>Welcome to StudyFlow!</h3><p>Create your first deck to get started studying.</p><button type="button" onclick="app.switchTab('create')">Create Your First Deck</button></div>`; return; }
      this.decksList.innerHTML=''; const groups=new Map(); this.decks.forEach((d,idx)=>{ const k=d.folderId||null; if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(idx); });
      const foldersSorted=[...this.folders].sort((a,b)=>a.name.localeCompare(b.name)); const orderedKeys=[null,...foldersSorted.map(f=>f.id)].filter(k=>groups.has(k));
      orderedKeys.forEach(key=>{ const isUnfiled = key===null; const name = isUnfiled ? '(No folder)' : (this.folders.find(f=>f.id===key)?.name || '(Unknown)'); const section=document.createElement('section'); const headingId = `folder-${key||'none'}`; section.className='folder-group'; section.setAttribute('aria-labelledby', headingId); section.innerHTML = `<div class="deck-header"><h3 id="${headingId}" class="deck-title">${name}</h3>${isUnfiled?'':`<div class="button-group" style="width:auto;"><button type="button" onclick="app.renameFolder('${key}')">Rename</button><button type="button" onclick="app.deleteFolder('${key}')">Delete</button></div>`}</div>`;
        const idxs = groups.get(key); idxs.forEach(deckIndex=>{ const deck=this.decks[deckIndex]; const deckEl=document.createElement('div'); deckEl.className='deck-card'; const moveSelectId = `move-folder-${deckIndex}`; deckEl.innerHTML = `<div class="deck-header"><h3 class="deck-title">${deck.name}</h3></div><p>${deck.cards.length} cards • ${deck.category}</p><div class="section" style="margin-top:10px;"><label for="${moveSelectId}">Move to folder:</label><select id="${moveSelectId}" data-deck-index="${deckIndex}" aria-label="Move deck ${deck.name} to folder"></select></div><div class="button-group" style="margin-top: 15px;"><button type="button" onclick="app.startStudy(${deckIndex})">Study This Deck</button><button type="button" onclick="app.deleteDeck(${deckIndex})">Delete</button></div>`; section.appendChild(deckEl); const selectEl = deckEl.querySelector(`#${moveSelectId}`); this.populateFolderOptions(selectEl, deck.folderId||''); selectEl.addEventListener('change', (ev)=>this.onMoveDeckFolderChanged(ev)); }); this.decksList.appendChild(section); }); }

    setCreationMode(mode){ this.creationMode = mode; this.autoInput.classList.toggle('hidden', mode !== 'auto'); this.manualInput.classList.toggle('hidden', mode !== 'manual'); if(mode==='auto'){ this.notesInput.focus(); this.announce('Auto-generate mode selected. Paste your notes.'); } else { this.cardFront.focus(); this.announce('Manual mode selected. Create cards one at a time.'); } }

    generateCards(){ const notes = this.notesInput.value.trim(); if(!notes){ this.announce('Please paste your study notes first.'); this.notesInput.focus(); return; } this.tempCards = this.parseNotes(notes); if(this.tempCards.length===0){ this.announce('No flashcards could be generated. Please check your notes format.'); return; } this.showPreview(); this.announce(`Successfully generated ${this.tempCards.length} flashcards.`); }

    parseNotes(notes){ const cards=[]; const lines=notes.split('\n').map(l=>l.trim()).filter(l=>l); for(let i=0;i<lines.length;i++){ const line=lines[i]; if(line.includes('?') && i+1<lines.length){ const question=line; const answer=lines[i+1]; if(!answer.includes('?')){ cards.push({ front:question, back:answer }); i++; } } else if(line.toLowerCase().startsWith('definition:')){ const term=line.substring(11).trim(); if(i+1<lines.length){ const definition=lines[i+1]; cards.push({ front:`What is ${term}?`, back:definition }); i++; } } else if(line.includes(':') && !line.includes('?')){ const parts=line.split(':'); if(parts.length>=2){ const term=parts[0].trim(); const definition=parts.slice(1).join(':').trim(); if(definition.length>10) cards.push({ front:`What is ${term}?`, back:definition }); } } } return cards; }

    addManualCard(){ const front=this.cardFront.value.trim(); const back=this.cardBack.value.trim(); const media=this.cardMedia?this.cardMedia.value.trim():''; if(!front||!back){ this.announce('Please fill in both the front and back of the card.'); if(!front) this.cardFront.focus(); else this.cardBack.focus(); return; } this.tempCards.push({ front, back, mediaUrl: media||null }); this.cardFront.value=''; this.cardBack.value=''; if(this.cardMedia) this.cardMedia.value=''; this.showPreview(); this.announce(`Card added. You now have ${this.tempCards.length} cards.`); this.cardFront.focus(); }

    showPreview(){ this.previewCards.innerHTML=''; this.tempCards.forEach((card,index)=>{ const cardElement=document.createElement('div'); cardElement.className='deck-card'; cardElement.innerHTML = `<div class="deck-header"><span>Card ${index+1}</span><button type="button" onclick="app.removeCard(${index})">Remove</button></div><p><strong>Front:</strong> ${card.front}</p><p><strong>Back:</strong> ${card.back}</p>`; if(card.mediaUrl){ const previewBtn=document.createElement('button'); previewBtn.type='button'; previewBtn.textContent='Preview media'; previewBtn.addEventListener('click',()=>this.openMediaViewer(card.mediaUrl, `Card ${index+1} media`)); cardElement.appendChild(previewBtn); } this.previewCards.appendChild(cardElement); }); this.cardsPreview.classList.remove('hidden'); }

    removeCard(index){ this.tempCards.splice(index,1); if(this.tempCards.length===0) this.cardsPreview.classList.add('hidden'); else this.showPreview(); this.announce(`Card removed. ${this.tempCards.length} cards remaining.`); }

    saveDeck(){ const name=this.deckName.value.trim(); const category=this.deckCategory.value; const folderId=this.deckFolder.value||null; if(!name){ this.announce('Please enter a deck name.'); this.deckName.focus(); return; } if(this.tempCards.length===0){ this.announce('Please create at least one card before saving.'); return; } const deck={ name, category, folderId, cards:this.tempCards, created: new Date().toISOString() }; this.decks.push(deck); if(this.saveDecks()){ this.announce(`Deck "${name}" saved successfully with ${this.tempCards.length} cards.`); this.renderDecks(); this.resetCreateForm(); this.switchTab('decks'); } else { this.announce('Error saving deck. Please try again.'); } }

    async cancelDeck(){ if(this.tempCards.length>0){ const ok = await this.openConfirmModal({ title:'Discard deck?', message:'Are you sure you want to cancel? All unsaved cards will be lost.', confirmText:'Discard' }); if(!ok) return; } this.resetCreateForm(); this.switchTab('decks'); }

    resetCreateForm(){ this.deckName.value=''; this.deckCategory.value='Biology'; this.notesInput.value=''; this.cardFront.value=''; this.cardBack.value=''; this.tempCards=[]; this.creationMode=null; this.autoInput.classList.add('hidden'); this.manualInput.classList.add('hidden'); this.cardsPreview.classList.add('hidden'); this.populateFolderOptions(this.deckFolder); this.deckFolder.value=''; }

    async deleteDeck(index){ const deck=this.decks[index]; const ok = await this.openConfirmModal({ title:'Delete deck', message:`Are you sure you want to delete "${deck.name}"?`, confirmText:'Delete' }); if(!ok) return; this.decks.splice(index,1); this.saveDecks(); this.renderDecks(); this.announce(`Deck "${deck.name}" deleted.`); }

    onMoveDeckFolderChanged(e){ const t=e.target; const deckIndex = Number(t.getAttribute('data-deck-index')); if(t.value==='__NEW__'){ this.promptAddFolder({ focusSelectAfter:true, applyToSelect:t }); return; } const newFolderId = t.value||null; const deck=this.decks[deckIndex]; deck.folderId=newFolderId; this.saveDecks(); this.renderDecks(); const folderName = newFolderId ? (this.folders.find(f=>f.id===newFolderId)?.name || '(Unknown)') : '(No folder)'; this.announce(`Moved deck "${deck.name}" to folder ${folderName}.`); }

    startStudy(deckIndex){ this.currentDeck=this.decks[deckIndex]; this.currentCardIndex=0; this.showingFront=true; this.switchTab('study'); if(this.studyModeContent) this.studyModeContent.classList.remove('hidden'); if(this.noStudyContent) this.noStudyContent.classList.add('hidden'); this.displayCurrentCard(); this.announce(`Started studying "${this.currentDeck.name}" with ${this.currentDeck.cards.length} cards.`); if(this.flashcard) try{ this.flashcard.focus(); }catch(_){} }

    displayCurrentCard(){ if(!this.currentDeck||!this.currentDeck.cards.length) return; const card=this.currentDeck.cards[this.currentCardIndex]; const progress=Math.round(((this.currentCardIndex+1)/this.currentDeck.cards.length)*100); if(this.studyProgress) this.studyProgress.textContent = `Card ${this.currentCardIndex+1} of ${this.currentDeck.cards.length}`; if(this.progressFill) this.progressFill.style.width = `${progress}%`; const content = this.showingFront ? card.front : card.back; const side = this.showingFront ? 'front' : 'back'; if(this.cardContent){ this.cardContent.textContent = content; } if(this.flashcard) this.flashcard.setAttribute('aria-label', `Card ${this.currentCardIndex+1} of ${this.currentDeck.cards.length}, showing ${side}. ${content}. Press Space or Enter to flip.`); if(this.prevBtn) this.prevBtn.disabled = this.currentCardIndex === 0; if(this.nextBtn) this.nextBtn.disabled = this.currentCardIndex === this.currentDeck.cards.length - 1; }

    flipCard(){ if(!this.currentDeck) return; this.showingFront = !this.showingFront; this.displayCurrentCard(); const side = this.showingFront ? 'front' : 'back'; const content = this.currentDeck.cards[this.currentCardIndex][this.showingFront ? 'front' : 'back']; this.announce(`Flipped to ${side}: ${content}`); }

    previousCard(){ if(this.currentCardIndex>0){ this.currentCardIndex--; this.showingFront=true; this.displayCurrentCard(); this.announce(`Previous card: ${this.currentDeck.cards[this.currentCardIndex].front}`); } }

    nextCard(){ if(this.currentCardIndex < this.currentDeck.cards.length - 1){ this.currentCardIndex++; this.showingFront=true; this.displayCurrentCard(); this.announce(`Next card: ${this.currentDeck.cards[this.currentCardIndex].front}`); } else { this.announce('You have reached the end of the flashcards. Great job!'); } }

    endStudy(){ this.currentDeck=null; this.switchTab('decks'); if(this.studyModeContent) this.studyModeContent.classList.add('hidden'); if(this.noStudyContent) this.noStudyContent.classList.remove('hidden'); this.announce('Study session ended.'); }

    isHelpOpen(){ return this.helpModal && this.helpModal.open === true; }

    getFocusableElementsInModal(){ if(!this.helpModal) return []; const selectors = ['a[href]','area[href]','button:not([disabled])','input:not([disabled])','select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])']; return Array.from(this.helpModal.querySelectorAll(selectors.join(','))).filter(el => el.offsetParent !== null || el === document.activeElement); }

    openHelpModal(){ if(!this.helpModal||this.isHelpOpen()) return; this.lastFocusedBeforeHelp=document.activeElement; try{ this.helpModal.showModal(); }catch(_){ try{ this.helpModal.show(); }catch(_){} } this.helpModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; const dialog=this.helpModal.querySelector('.modal-dialog'); if(dialog) dialog.focus(); const focusables=this.getFocusableElementsInModal(); if(focusables.length) focusables[0].focus(); this.announce('Help opened.'); }

    closeHelpModal(){ if(!this.helpModal||!this.isHelpOpen()) return; try{ this.helpModal.close(); }catch(_){} this.helpModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; if(this.lastFocusedBeforeHelp && typeof this.lastFocusedBeforeHelp.focus === 'function') this.lastFocusedBeforeHelp.focus(); else if(this.openHelpBtn) this.openHelpBtn.focus(); this.announce('Help closed.'); }

    trapFocus(e){ const focusables=this.getFocusableElementsInModal(); if(!focusables.length) return; const first=focusables[0]; const last=focusables[focusables.length-1]; const active=document.activeElement; if(e.shiftKey){ if(active===first || !this.helpModal.contains(active)){ e.preventDefault(); last.focus(); } } else { if(active===last){ e.preventDefault(); first.focus(); } } }

    openTextModal({ title, label, initialValue = '', confirmText = 'Save', cancelText = 'Cancel' }){
      return new Promise((resolve)=>{
        const inputId = 'modal-text-input';
        if(this.modalTitle) this.modalTitle.textContent = title;
        if(this.modalDesc) this.modalDesc.textContent = `${label} input dialog.`;
        if(this.modalContent) this.modalContent.innerHTML = `<label for="${inputId}">${label}:</label><input type="text" id="${inputId}" value="${initialValue.replace(/"/g,'&quot;')}">`;
        if(this.modalConfirmBtn) this.modalConfirmBtn.textContent = confirmText;
        if(this.modalCancelBtn) this.modalCancelBtn.textContent = cancelText;

        const inputEl = this.modalContent.querySelector(`#${inputId}`);
        const removeInputListener = () => inputEl && inputEl.removeEventListener('input', updateConfirmState);
        const cleanup = this._openModalCommon({ initialFocus: inputEl, onConfirm: ()=>{ removeInputListener(); cleanup(); resolve(inputEl.value); }, onCancel: ()=>{ removeInputListener(); cleanup(); resolve(null); } });

        const updateConfirmState = ()=>{ const hasText = inputEl && inputEl.value.trim().length>0; if(this.modalConfirmBtn) this.modalConfirmBtn.disabled = !hasText; };
        if(inputEl) inputEl.addEventListener('input', updateConfirmState);
        updateConfirmState();
        setTimeout(()=>{ if(inputEl) inputEl.select(); }, 0);
      });
    }

    openConfirmModal({ title, message, confirmText = 'OK', cancelText = 'Cancel' }){
      return new Promise((resolve)=>{
        if(this.modalTitle) this.modalTitle.textContent = title;
        if(this.modalDesc) this.modalDesc.textContent = message;
        if(this.modalContent) this.modalContent.innerHTML = `<p>${message}</p>`;
        if(this.modalConfirmBtn) this.modalConfirmBtn.textContent = confirmText;
        if(this.modalCancelBtn) this.modalCancelBtn.textContent = cancelText;
        this._openModalCommon({ initialFocus: this.modalConfirmBtn, onConfirm: ()=>resolve(true), onCancel: ()=>resolve(false) });
      });
    }

    _openModalCommon({ initialFocus, onConfirm, onCancel }){
      this._lastFocusedEl = document.activeElement;
      if(this.modal) this.modal.classList.remove('hidden');
      if(this.modalOverlay) this.modalOverlay.classList.remove('hidden');
      if(this.modalOverlay) this.modalOverlay.setAttribute('aria-hidden','false');
      if(this.appContainer) this.appContainer.setAttribute('aria-hidden','true');

      const focusable = ()=> Array.from(this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el=>!el.disabled && el.offsetParent !== null);
      const keyHandler = (e)=>{ if(e.key==='Escape'){ e.preventDefault(); doCancel(); } else if(e.key==='Tab'){ const els = focusable(); if(els.length===0) return; const first=els[0]; const last=els[els.length-1]; if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); } } };
      document.addEventListener('keydown', keyHandler);
      const doConfirm = ()=>{ this._restoreModalClose(); onConfirm && onConfirm(); };
      const doCancel = ()=>{ this._restoreModalClose(); onCancel && onCancel(); };
      const clickOutside = (e)=>{ if(e.target === this.modalOverlay) doCancel(); };
      if(this.modalConfirmBtn) this.modalConfirmBtn.onclick = doConfirm;
      if(this.modalCancelBtn) this.modalCancelBtn.onclick = doCancel;
      if(this.modalOverlay) this.modalOverlay.addEventListener('click', clickOutside);
      (initialFocus || this.modalConfirmBtn).focus();
      return ()=>{ document.removeEventListener('keydown', keyHandler); if(this.modalOverlay) this.modalOverlay.removeEventListener('click', clickOutside); if(this.modalConfirmBtn) this.modalConfirmBtn.onclick = null; if(this.modalCancelBtn) this.modalCancelBtn.onclick = null; };
    }

    _restoreModalClose(){ if(this.modal) this.modal.classList.add('hidden'); if(this.modalOverlay) this.modalOverlay.classList.add('hidden'); if(this.modalOverlay) this.modalOverlay.setAttribute('aria-hidden','true'); if(this.appContainer) this.appContainer.removeAttribute('aria-hidden'); if(this._lastFocusedEl && typeof this._lastFocusedEl.focus === 'function') this._lastFocusedEl.focus(); }

    _closeModal(){ this._restoreModalClose(); }

    // Minimal media helpers (omitted heavy YouTube API handling in this bundled file)
    createMediaEmbed(url, title=''){
      const btn=document.createElement('button'); btn.type='button'; btn.textContent='Open media'; btn.addEventListener('click', ()=>this.openMediaViewer(url,title)); return btn;
    }
    openMediaViewer(url, title=''){ const content=document.createElement('div'); const embed=this.createMediaEmbed(url,title); content.appendChild(embed); const direct=document.createElement('div'); direct.style.marginTop='12px'; const viewLink=document.createElement('a'); viewLink.href=url; viewLink.target='_blank'; viewLink.rel='noopener noreferrer'; viewLink.textContent='Open media in a new tab'; direct.appendChild(viewLink); if(this.modalTitle) this.modalTitle.textContent = title || 'Media Viewer'; if(this.modalDesc) this.modalDesc.textContent = `Viewing media: ${url}`; if(this.modalContent) { this.modalContent.innerHTML=''; this.modalContent.appendChild(content); this.modalContent.appendChild(direct); } if(this.modalConfirmBtn) this.modalConfirmBtn.textContent='Close'; if(this.modalCancelBtn) this.modalCancelBtn.textContent='Close'; this._openModalCommon({ initialFocus: this.modalConfirmBtn, onConfirm: ()=>{}, onCancel: ()=>{} }); }

  } // end StudyFlowApp

  // Expose initializer for React to call after rendering modal DOM
  window.initializeStudyFlowApp = window.initializeStudyFlowApp || function() {
    if (window.app) return;
    try {
      window.app = new StudyFlowApp();
    } catch (e) {
      console.warn('Error initializing StudyFlowApp', e);
    }
  };

})();
// Keep original app.js content here if needed for legacy SPA mounting
// For now, developers can copy the original app.js into this file to serve it from /public

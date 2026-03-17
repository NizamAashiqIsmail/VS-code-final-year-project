import { state } from './uiState.js';

export const initSettings = (shadow) => {
  const card = shadow.getElementById('settings-card');
  const avatarList = shadow.getElementById('avatar-inputs-list');

  // Build avatar inputs with upload indicator
  avatarList.innerHTML = Object.keys(state.stateSettings).map(s => {
    const hasAvatar = state.stateSettings[s].avatar;
    return `
    <div class="setting-row">
        <span>${s.replace('_', ' ')}:</span>
        <span class="upload-status" data-mood="${s}" style="color:${hasAvatar ? 'green' : '#060606'}; font-size:11px; white-space:nowrap; margin:0 8px;">${hasAvatar ? '✓ set' : 'not set'}</span>
        <input type="file" class="avatar-up" data-state="${s}">
    </div>
  `}).join('');

  shadow.getElementById('set-back').onclick = () => card.style.display = 'none';

  // Add block
  shadow.getElementById('add-block-btn').onclick = async () => {
    const input = shadow.getElementById('block-url');
    const url = input.value.trim().toLowerCase();
    if (url && !state.blockList.includes(url)) {
      state.blockList.push(url);
      await chrome.storage.local.set({ blockList: state.blockList });
      renderBlockList(shadow);
      input.value = '';
    }
  };

  // Load existing block list
  renderBlockList(shadow);

  // Avatar file handlers
  shadow.querySelectorAll('.avatar-up').forEach(input => {
    input.onchange = (e) => {
      // Check if a file was actually selected
      if (!e.target.files || !e.target.files[0]) return;

      const mood = e.target.dataset.state;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress image to JPEG at 80% quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

          state.stateSettings[mood].avatar = dataUrl;
          await chrome.storage.local.set({ stateSettings: state.stateSettings });
          // Update status indicator
          const statusEl = shadow.querySelector(`.upload-status[data-mood="${mood}"]`);
          if (statusEl) {
            statusEl.textContent = '✓ set';
            statusEl.style.color = 'green';
          }
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(e.target.files[0]);
    };
  });
};

export const renderBlockList = (shadow) => {
  const display = shadow.getElementById('block-list-display');
  display.innerHTML = state.blockList.map((site, i) => `
    <div class="block-item" style="display:flex; justify-content:space-between; padding:5px; border-bottom:1px solid #080808;">
      <span style="color : black" ;>${site}</span>
      <span class="remove-btn" data-index="${i}" style="color:red; cursor:pointer;">✖</span>
    </div>
  `).join('');

  display.querySelectorAll('.remove-btn').forEach(btn => {
    btn.onclick = async () => {
      state.blockList.splice(btn.dataset.index, 1);
      await chrome.storage.local.set({ blockList: state.blockList });
      renderBlockList(shadow);
    };
  });
};
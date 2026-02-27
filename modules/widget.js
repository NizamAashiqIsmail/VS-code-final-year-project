import { state, notes } from './uiState.js';

export const initWidget = (shadow, openSettings) => {
  const wrapper = shadow.getElementById('widget-wrapper');
  wrapper.style.display = 'flex';

  let currentMood = 'focused'; // Default mood

  // Listen for mood/state updates from background.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'STATE_UPDATE') {
      currentMood = request.state;
      updateAvatarImage(shadow, currentMood);
    }
  });

  // 1. Build the 5 Arc Buttons
  const labels = ['🖼️', '➖', '⚙️', '🖊️', '🔔'];
  const buttons = [];

  labels.forEach((label, i) => {
    const btn = document.createElement('div');
    btn.className = 'menu-button';
    btn.innerText = label;
    
    btn.onclick = (e) => {
      e.stopPropagation(); //  Prevents the click from "dragging" the circle
      if (i === 0) toggleImage(shadow);
      if (i === 1) toggleMinimize(shadow);
      if (i === 2) openSettings(); // Opens the settings module
      if (i === 3) {
        const val = prompt("Enter note:"); // its like a alert() but with an input field
        if(val) console.log("User Note:", val);
      }
      if (i === 4) toggleSnooze(btn);
    };

    wrapper.appendChild(btn);
    buttons.push(btn);
  });

  // 2. Position Buttons
  const positionButtons = () => {
    const radius = 60; 
    const startAngle = -Math.PI / 2; 
    const endAngle = Math.PI / 2;   
    buttons.forEach((btn, i) => {
      const angle = startAngle + (i * (endAngle - startAngle) / (buttons.length - 1));
      btn.style.left = `${60 + radius * Math.cos(angle) - 17}px`; 
      btn.style.top = `${60 + radius * Math.sin(angle) - 17}px`;
    });
  };
  positionButtons();

  // 3. Timer Logic
  setInterval(() => {
    if(!state.isSnoozed) { // if snoozed the timer stops
      state.seconds++;
      const timer = shadow.getElementById('tab-timer');
      if(timer) timer.innerText = state.seconds + 's';
      if (state.seconds % 10 === 0) {  // NEED TO CHANGE THIS
        state.currentNoteIndex = (state.currentNoteIndex + 1) % notes.length;
        shadow.getElementById('note-box').innerText = notes[state.currentNoteIndex];
      }
    }
  }, 1000); // 1 second interval

  // 4. Dragging Logic
  setupDragging(shadow, wrapper);
};

// --- Helper Internal Functions ---

function updateAvatarImage(shadow, mood) {
  const img = shadow.getElementById('popup-image');
  if (!img) return;
  
  // Get the avatar for the current mood from state
  const avatarData = state.stateSettings[mood]?.avatar;
  if (avatarData) {
    img.src = avatarData;
  }
}

function toggleMinimize(shadow) {
  state.isMinimized = !state.isMinimized;
  shadow.getElementById('widget-wrapper').classList.toggle('minimized', state.isMinimized);
}

function toggleSnooze(btn) {
  state.isSnoozed = !state.isSnoozed;
  btn.innerText = state.isSnoozed ? '🔕' : '🔔';
}

function toggleImage(shadow) {
  const img = shadow.getElementById('popup-image');
  const info = shadow.getElementById('info');
  
  // Safety check: only toggle if image exists
  if (!img) return;
  
  const isHidden = img.style.display === 'none';
  img.style.display = isHidden ? 'block' : 'none';
  info.style.display = isHidden ? 'none' : 'flex';
}

function setupDragging(shadow, wrapper) {
  const circle = shadow.getElementById('main-circle');
  let isDragging = false, startX, startY, initX, initY;

  circle.onmousedown = (e) => {
    isDragging = true; startX = e.clientX; startY = e.clientY;
    const rect = wrapper.getBoundingClientRect();
    initX = rect.left; initY = rect.top;
  };
  window.onmousemove = (e) => {
    if (!isDragging) return;
    wrapper.style.left = `${initX + (e.clientX - startX)}px`;
    wrapper.style.top = `${initY + (e.clientY - startY)}px`;
    wrapper.style.right = 'auto';
  };
  window.onmouseup = () => isDragging = false;
  circle.ondblclick = () => { if(state.isMinimized) toggleMinimize(shadow); };
}
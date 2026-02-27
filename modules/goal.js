import { state } from './uiState.js';

export const initGoalSetting = (shadow, onComplete) => {
  const container = shadow.getElementById('setup-container');
  container.innerHTML = `
    <div class="setup-card">
        <div class="setup-header">What's your focus?</div>
        <p>Gemini will use this to keep you on track.</p>
        <textarea id="goal-input" placeholder="e.g. Studying for Finals..."></textarea>
        <div class="btn-group">
            <button id="set-goal-btn">Set Goal</button>
            <button id="skip-goal-btn" class="secondary">Skip</button>
        </div>
    </div>
  `;

  shadow.getElementById('set-goal-btn').onclick = async () => {
    const goalText = shadow.getElementById('goal-input').value;
    state.userGoal = goalText;
    await chrome.storage.local.set({ userGoal: goalText });
    
    // Log for Gemini API debugging
    console.log("%c[Gemini Context] New Goal Set:", "color: #4285f4; font-weight: bold;", goalText);
    onComplete();
  };

  shadow.getElementById('skip-goal-btn').onclick = onComplete;
};
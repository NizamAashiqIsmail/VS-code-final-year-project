export const initWelcome = (shadow, onStart) => {
  const container = shadow.getElementById('setup-container');
  container.innerHTML = `
    <div class="setup-card">
        <div class="setup-header">Neuro Mirror</div>
        <p>Your AI-powered focus companion is ready.</p>
        <button id="start-btn">Get Started</button>
    </div>
  `;
  shadow.getElementById('start-btn').onclick = onStart;
};
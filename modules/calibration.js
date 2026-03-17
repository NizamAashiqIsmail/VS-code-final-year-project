import { startFaceMesh } from './faceMesh.js';

export const initCalibration = (shadow, onComplete) => {
  let timeLeft = 30;
  let stopFaceMesh = null;
  const container = shadow.getElementById('setup-container');
  container.innerHTML = `
    <div class="setup-card">
        <div class="setup-header">Eye Calibration</div>
        <div class="video-preview">
            <div id="timer-display">30s</div>
            <video id="calib-video" autoplay muted playsinline></video>
            <canvas id="mesh-canvas"></canvas>
            <div id="face-stats">Looking for face...</div>
        </div>
        <button id="calibrate-btn">Finish Calibration</button>
    </div>
  `;

  const updateStats = (features) => {
    const stats = shadow.getElementById('face-stats');
    if (!stats) return;
    if (!features) {
      stats.innerText = 'Looking for face...';
      return;
    }
    stats.innerHTML = `
      <strong>Face data</strong><br>
      Eye distance: ${features.eyeDistance}px<br>
      Eye openness: ${features.eyeOpenness}px<br>
      Smile score: ${features.smileScore}
    `;
  };

  startFaceMesh({
    videoElement: shadow.getElementById('calib-video'),
    canvasElement: shadow.getElementById('mesh-canvas'),
    onFaceFeatures: updateStats,
  }).then((stop) => {
    stopFaceMesh = stop;
  }).catch((err) => {
    console.warn('FaceMesh init failed', err);
    updateStats(null);
  });

  const timer = setInterval(() => {
    timeLeft--;
    if(shadow.getElementById('timer-display')) 
        shadow.getElementById('timer-display').innerText = timeLeft + 's';
    if(timeLeft <= 0) clearInterval(timer);
  }, 1000);

  shadow.getElementById('calibrate-btn').onclick = () => {
    clearInterval(timer);
    stopFaceMesh?.();
    onComplete();
  };
};
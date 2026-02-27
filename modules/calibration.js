export const initCalibration = (shadow, onComplete) => {
  let timeLeft = 30;
  const container = shadow.getElementById('setup-container');
  container.innerHTML = `
    <div class="setup-card">
        <div class="setup-header">Eye Calibration</div>
        <div class="video-preview">
            <div id="timer-display">30s</div>
            <video id="calib-video" autoplay muted></video> 
        </div>
        <button id="calibrate-btn">Finish Calibration</button>
    </div>
  `;

  const timer = setInterval(() => {
    timeLeft--;
    if(shadow.getElementById('timer-display')) 
        shadow.getElementById('timer-display').innerText = timeLeft + 's';
    if(timeLeft <= 0) clearInterval(timer);
  }, 1000);

  shadow.getElementById('calibrate-btn').onclick = () => {
    clearInterval(timer);
    onComplete();
  };
};
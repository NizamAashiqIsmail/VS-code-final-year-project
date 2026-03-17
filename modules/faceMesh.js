// Handles loading MediaPipe FaceMesh and drawing a live overlay on a video element.

const MEDIAPIPE_SCRIPTS = [
  chrome.runtime.getURL('modules/mediapipe/camera_utils.js'),
  chrome.runtime.getURL('modules/mediapipe/control_utils.js'),
  chrome.runtime.getURL('modules/mediapipe/drawing_utils.js'),
  chrome.runtime.getURL('modules/mediapipe/face_mesh.js'),
];

let _loaded = false;

async function ensureMediapipeLoaded() {
  if (_loaded) return;

  // Import the MediaPipe scripts as ES modules into the content script world.
  // This avoids isolated-world issues where injected <script> tags define globals
  // that are not visible to the content script.
  for (const src of MEDIAPIPE_SCRIPTS) {
    await import(src);
  }

  // Verify that FaceMesh is now available on the global scope.
  console.log('MediaPipe load check', {
    FaceMesh: window.FaceMesh,
    Camera: window.Camera,
    drawConnectors: window.drawConnectors,
  });

  if (typeof window.FaceMesh === 'undefined') {
    throw new Error('MediaPipe FaceMesh did not create a global FaceMesh constructor');
  }

  _loaded = true;
}

function _toCanvasPoint(pt, width, height) {
  return { x: pt.x * width, y: pt.y * height };
}

function _distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function computeFaceFeatures(landmarks, width, height) {
  if (!landmarks || landmarks.length === 0) return null;

  const leftEyeOuter = _toCanvasPoint(landmarks[33], width, height);
  const rightEyeOuter = _toCanvasPoint(landmarks[263], width, height);
  const eyeDistance = _distance(leftEyeOuter, rightEyeOuter);

  const mouthTop = _toCanvasPoint(landmarks[13], width, height);
  const mouthBottom = _toCanvasPoint(landmarks[14], width, height);
  const mouthOpening = _distance(mouthTop, mouthBottom);

  const leftEyeTop = _toCanvasPoint(landmarks[159], width, height);
  const leftEyeBottom = _toCanvasPoint(landmarks[145], width, height);
  const rightEyeTop = _toCanvasPoint(landmarks[386], width, height);
  const rightEyeBottom = _toCanvasPoint(landmarks[374], width, height);
  const leftEyeOpen = _distance(leftEyeTop, leftEyeBottom);
  const rightEyeOpen = _distance(rightEyeTop, rightEyeBottom);

  const eyeOpenness = (leftEyeOpen + rightEyeOpen) / 2;

  return {
    eyeDistance: Math.round(eyeDistance),
    mouthOpening: Math.round(mouthOpening),
    eyeOpenness: Math.round(eyeOpenness),
    smileScore: Math.round((mouthOpening / Math.max(eyeDistance, 1)) * 100),
  };
}

/**
 * Starts MediaPipe FaceMesh and draws a real-time overlay onto the provided canvas.
 * @param {HTMLVideoElement} videoElement
 * @param {HTMLCanvasElement} canvasElement
 * @param {(features: object|null) => void} onFaceFeatures
 * @param {object} options
 * @returns {Promise<() => void>} A function you can call to stop the pipeline.
 */
export async function startFaceMesh({
  videoElement,
  canvasElement,
  onFaceFeatures,
  options = {},
}) {
  await ensureMediapipeLoaded();

  const defaultOptions = {
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };

  const FaceMeshCtor = window.FaceMesh || globalThis.FaceMesh;
  const CameraCtor = window.Camera || globalThis.Camera;
  const drawConnectorsFn = window.drawConnectors || globalThis.drawConnectors;
  const FACEMESH_TESSELATION = window.FACEMESH_TESSELATION || globalThis.FACEMESH_TESSELATION;
  const FACEMESH_RIGHT_EYE = window.FACEMESH_RIGHT_EYE || globalThis.FACEMESH_RIGHT_EYE;
  const FACEMESH_RIGHT_EYEBROW = window.FACEMESH_RIGHT_EYEBROW || globalThis.FACEMESH_RIGHT_EYEBROW;
  const FACEMESH_RIGHT_IRIS = window.FACEMESH_RIGHT_IRIS || globalThis.FACEMESH_RIGHT_IRIS;
  const FACEMESH_LEFT_EYE = window.FACEMESH_LEFT_EYE || globalThis.FACEMESH_LEFT_EYE;
  const FACEMESH_LEFT_EYEBROW = window.FACEMESH_LEFT_EYEBROW || globalThis.FACEMESH_LEFT_EYEBROW;
  const FACEMESH_LEFT_IRIS = window.FACEMESH_LEFT_IRIS || globalThis.FACEMESH_LEFT_IRIS;
  const FACEMESH_FACE_OVAL = window.FACEMESH_FACE_OVAL || globalThis.FACEMESH_FACE_OVAL;
  const FACEMESH_LIPS = window.FACEMESH_LIPS || globalThis.FACEMESH_LIPS;

  if (typeof FaceMeshCtor !== 'function' || typeof CameraCtor !== 'function' || typeof drawConnectorsFn !== 'function') {
    throw new Error('MediaPipe FaceMesh dependencies not available');
  }

  const faceMesh = new FaceMeshCtor({
    locateFile: (file) => chrome.runtime.getURL(`modules/mediapipe/${file}`),
  });
  faceMesh.setOptions({ ...defaultOptions, ...options });

  const canvasCtx = canvasElement.getContext('2d');

  const resizeCanvas = () => {
    const rect = videoElement.getBoundingClientRect();
    canvasElement.width = rect.width;
    canvasElement.height = rect.height;
  };

  videoElement.addEventListener('loadedmetadata', resizeCanvas);
  window.addEventListener('resize', resizeCanvas);

  faceMesh.onResults((results) => {
    resizeCanvas();

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length) {
      const landmarks = results.multiFaceLandmarks[0];
      drawConnectorsFn(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
      drawConnectorsFn(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#FF3030' });
      drawConnectorsFn(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, { color: '#FF3030' });
      drawConnectorsFn(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, { color: '#FF3030' });
      drawConnectorsFn(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#30FF30' });
      drawConnectorsFn(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, { color: '#30FF30' });
      drawConnectorsFn(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, { color: '#30FF30' });
      drawConnectorsFn(canvasCtx, landmarks, FACEMESH_FACE_OVAL, { color: '#E0E0E0' });
      drawConnectorsFn(canvasCtx, landmarks, FACEMESH_LIPS, { color: '#E0E0E0' });
      
      if (typeof onFaceFeatures === 'function') {
        const features = computeFaceFeatures(landmarks, canvasElement.width, canvasElement.height);
        onFaceFeatures(features);
      }
    } else {
      if (typeof onFaceFeatures === 'function') {
        onFaceFeatures(null);
      }
    }
  });

  // Start the camera feed using native getUserMedia.
  // This avoids MediaPipe's Camera helper which can time out in some extension contexts.
  let stopCamera = null;
  let frameLoopActive = true;

  try {
    const constraints = [
      { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
      { video: true, audio: false },
    ];

    let stream = null;
    for (const c of constraints) {
      try {
        console.log('Trying getUserMedia with constraints', c);
        stream = await navigator.mediaDevices.getUserMedia(c);
        break;
      } catch (e) {
        console.warn('getUserMedia failed with constraints', c, e);
      }
    }

    if (!stream) {
      throw new Error('Unable to acquire camera stream with any constraint set');
    }

    videoElement.srcObject = stream;
    videoElement.muted = true;
    videoElement.playsInline = true;
    await videoElement.play();

    stopCamera = () => {
      stream.getTracks().forEach((track) => track.stop());
      videoElement.pause();
      videoElement.srcObject = null;
    };

    const runFrame = async () => {
      if (!frameLoopActive) return;
      await faceMesh.send({ image: videoElement });
      requestAnimationFrame(runFrame);
    };

    runFrame();
  } catch (err) {
    console.error('Failed to start camera', err);
    throw err;
  }

  return () => {
    frameLoopActive = false;
    stopCamera?.();
    faceMesh.close();
    window.removeEventListener('resize', resizeCanvas);
  };
}


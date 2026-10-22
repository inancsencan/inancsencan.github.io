const circleCount = 240;
const circleColors = [
  [255, 111, 145],
  [255, 190, 92],
  [117, 220, 203],
  [148, 158, 255],
  [247, 229, 134],
];

let circles = [];
let cameraVideo;
let segmenter;
let maskCanvas;
let maskContext;
let maskPixels;
let cameraStatus = "Starting camera...";
let cameraFailed = false;

function setup() {
  const canvas = createCanvas(975, 650);
  canvas.parent("sketch-holder");
  pixelDensity(1);

  for (let i = 0; i < circleCount; i++) {
    circles.push({
      x: random(width),
      y: random(height),
      size: random(8, 27),
      nextSizeChange: 0,
      color: color(...random(circleColors)),
    });
  }

  startCamera();
}

function draw() {
  background(16, 20, 34);
  drawCamera();

  noStroke();
  for (const dot of circles) {
    if (isOverPerson(dot.x, dot.y)) {
      dot.x = constrain(dot.x + random(-1.8, 1.8), 0, width);
      dot.y = constrain(dot.y + random(-1.8, 1.8), 0, height);
    } else if (frameCount >= dot.nextSizeChange) {
      dot.size = random(7, 31);
      dot.nextSizeChange = frameCount + random(8, 35);
    }

    fill(dot.color);
    circle(dot.x, dot.y, dot.size);
  }

  if (cameraFailed || !maskPixels) {
    fill(255, 235);
    textSize(14);
    textAlign(LEFT, TOP);
    text(cameraStatus, 18, 18);
  }
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cameraFailed = true;
    cameraStatus = "Camera access requires HTTPS or localhost.";
    return;
  }

  try {
    cameraVideo = document.createElement("video");
    cameraVideo.autoplay = true;
    cameraVideo.muted = true;
    cameraVideo.playsInline = true;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    cameraVideo.srcObject = stream;
    await cameraVideo.play();

    segmenter = new SelfieSegmentation({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/${file}`,
    });
    segmenter.setOptions({ modelSelection: 1 });
    segmenter.onResults(updatePersonMask);

    maskCanvas = document.createElement("canvas");
    maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
    cameraStatus = "Camera ready. Loading person detector...";
    processCameraFrame();
  } catch (error) {
    cameraFailed = true;
    cameraStatus =
      error.name === "NotAllowedError"
        ? "Allow camera access to use the visualization."
        : "Unable to start the camera or person detector.";
    console.error("Camera/person detection could not start:", error);
  }
}

async function processCameraFrame() {
  if (cameraFailed || !segmenter || cameraVideo.readyState < 2) {
    if (!cameraFailed) requestAnimationFrame(processCameraFrame);
    return;
  }

  try {
    await segmenter.send({ image: cameraVideo });
    requestAnimationFrame(processCameraFrame);
  } catch (error) {
    cameraFailed = true;
    cameraStatus = "Person detection stopped. Reload the page to try again.";
    console.error("Person detection failed:", error);
  }
}

function updatePersonMask(results) {
  const mask = results.segmentationMask;
  const maskWidth = mask.width || mask.videoWidth;
  const maskHeight = mask.height || mask.videoHeight;

  if (!maskWidth || !maskHeight) return;

  if (maskCanvas.width !== maskWidth || maskCanvas.height !== maskHeight) {
    maskCanvas.width = maskWidth;
    maskCanvas.height = maskHeight;
  }

  maskContext.drawImage(mask, 0, 0, maskWidth, maskHeight);
  maskPixels = maskContext.getImageData(0, 0, maskWidth, maskHeight);
  cameraStatus = "";
}

function drawCamera() {
  if (!cameraVideo || cameraVideo.readyState < 2) return;

  const scale = max(
    width / cameraVideo.videoWidth,
    height / cameraVideo.videoHeight,
  );
  const videoWidth = cameraVideo.videoWidth * scale;
  const videoHeight = cameraVideo.videoHeight * scale;
  const offsetX = (width - videoWidth) / 2;
  const offsetY = (height - videoHeight) / 2;

  drawingContext.globalAlpha = 0.27;
  drawingContext.drawImage(cameraVideo, offsetX, offsetY, videoWidth, videoHeight);
  drawingContext.globalAlpha = 1;
}

function isOverPerson(x, y) {
  if (!maskPixels || !cameraVideo || cameraVideo.readyState < 2) return false;

  const scale = max(
    width / cameraVideo.videoWidth,
    height / cameraVideo.videoHeight,
  );
  const videoWidth = cameraVideo.videoWidth * scale;
  const videoHeight = cameraVideo.videoHeight * scale;
  const normalizedX = (x - (width - videoWidth) / 2) / videoWidth;
  const normalizedY = (y - (height - videoHeight) / 2) / videoHeight;

  if (
    normalizedX < 0 ||
    normalizedX > 1 ||
    normalizedY < 0 ||
    normalizedY > 1
  ) {
    return false;
  }

  const maskX = floor(normalizedX * (maskPixels.width - 1));
  const maskY = floor(normalizedY * (maskPixels.height - 1));
  const pixelIndex = (maskY * maskPixels.width + maskX) * 4;
  return maskPixels.data[pixelIndex] > 127;
}

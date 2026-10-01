// -------------------------
// CONFIG
// -------------------------

let initialLength = 32;
let currentString = "";

let generationCount = 0;
let generationInterval = 300; // ms
let lastGenerationTime = 0;

let baselineY;

let history = [];
let maxHistory = 16;
let historySpacing = 14;

let previousPoints = [];
let targetPoints = [];

let isPaused = false;

// -------------------------
// AUDIO
// -------------------------

let song;
let fft;
let amplitude;

let spectralCentroid = 0;
let spectralFlux = 0;

let fluxControl = 0;
let fluxPeak = 0.0001;
let fluxPeakDecay = 0.995;

let previousSpectrum = [];

let audioLevel = 0;

let lowEnergy = 0;
let middleEnergy = 0;
let highEnergy = 0;

let lowControl = 0;
let middleControl = 0;
let highControl = 0;

let lowPeak = 0.001;
let middlePeak = 0.001;
let highPeak = 0.001;

let peakDecay = 0.995;

// -------------------------
// STOCHASTIC RULES
// -------------------------

const rules = {
  A: [
    { symbol: "A", weight: 0.5 },
    { symbol: "B", weight: 0.2 },
    { symbol: "C", weight: 0.2 },
    { symbol: "D", weight: 0.1 },
  ],

  B: [
    { symbol: "B", weight: 0.35 },
    { symbol: "A", weight: 0.35 },
    { symbol: "D", weight: 0.15 },
    { symbol: "C", weight: 0.15 },
  ],

  C: [
    { symbol: "C", weight: 0.35 },
    { symbol: "A", weight: 0.35 },
    { symbol: "D", weight: 0.15 },
    { symbol: "B", weight: 0.15 },
  ],

  D: [
    { symbol: "A", weight: 0.45 },
    { symbol: "D", weight: 0.35 },
    { symbol: "B", weight: 0.1 },
    { symbol: "C", weight: 0.1 },
  ],
};

// -------------------------
// SETUP
// -------------------------

async function setup() {
  const canvas = createCanvas(900, 600);
  canvas.parent("sketch-holder");

  baselineY = height / 2;

  // Load audio
  song = await loadSound("audio/track.mp3");

  // Audio analyzers
  fft = new p5.FFT(1024);
  amplitude = new p5.Amplitude(0.8);

  song.connect(fft);
  song.connect(amplitude);

  // L-system
  initializeString();

  let initialPoints = buildLineFromString(currentString);

  previousPoints = copyPoints(initialPoints);

  targetPoints = copyPoints(initialPoints);

  saveHistory(initialPoints);

  lastGenerationTime = millis();

  console.log("Audio loaded:", song);
  console.log("Initial string:", currentString);
}

// -------------------------
// AUDIO ANALYSIS
// -------------------------

function analyzeAudio() {
  if (!song || !song.isPlaying()) {
    audioLevel = 0;

    lowEnergy = 0;
    middleEnergy = 0;
    highEnergy = 0;

    lowControl = 0;
    middleControl = 0;
    highControl = 0;

    spectralCentroid = 0;
    spectralFlux = 0;

    fluxControl = 0;

    previousSpectrum = [];

    return;
  }

  let spectrum = fft.analyze();

  spectralCentroid = calculateSpectralCentroid(spectrum);

  spectralFlux = calculateSpectralFlux(spectrum, previousSpectrum);

  previousSpectrum = [...spectrum];

  audioLevel = amplitude.getLevel();

  lowEnergy = getBandEnergy(spectrum, 50, 250);

  middleEnergy = getBandEnergy(spectrum, 250, 1200);

  highEnergy = getBandEnergy(spectrum, 1200, 4000);

  fluxPeak *= fluxPeakDecay;

  fluxPeak = max(fluxPeak, spectralFlux);

  let targetFlux = constrain(spectralFlux / fluxPeak, 0, 1);

  fluxControl = lerp(fluxControl, targetFlux, 0.25);

  // Slowly forget old peaks
  lowPeak *= peakDecay;
  middlePeak *= peakDecay;
  highPeak *= peakDecay;

  // Remember new peaks
  lowPeak = max(lowPeak, lowEnergy);
  middlePeak = max(middlePeak, middleEnergy);
  highPeak = max(highPeak, highEnergy);

  // Normalize to 0–1
  let targetLow = constrain(lowEnergy / lowPeak, 0, 1);

  let targetMiddle = constrain(middleEnergy / middlePeak, 0, 1);

  let targetHigh = constrain(highEnergy / highPeak, 0, 1);

  // Smooth the visible/control values
  lowControl = lerp(lowControl, targetLow, 0.15);

  middleControl = lerp(middleControl, targetMiddle, 0.15);

  highControl = lerp(highControl, targetHigh, 0.15);
}

// -------------------------
// HELPER FUNCTIONS
// -------------------------
function getBandEnergy(spectrum, minFrequency, maxFrequency) {
  let audioContext = getAudioContext();
  let nyquist = audioContext.sampleRate / 2;

  let startIndex = floor(map(minFrequency, 0, nyquist, 0, spectrum.length));

  let endIndex = floor(map(maxFrequency, 0, nyquist, 0, spectrum.length));

  startIndex = constrain(startIndex, 0, spectrum.length - 1);

  endIndex = constrain(endIndex, 0, spectrum.length - 1);

  let sumSquares = 0;
  let count = 0;

  for (let i = startIndex; i <= endIndex; i++) {
    let value = spectrum[i];

    sumSquares += value * value;
    count++;
  }

  if (count === 0) {
    return 0;
  }

  return sqrt(sumSquares / count);
}

function calculateSpectralCentroid(spectrum) {
  let audioContext = getAudioContext();
  let nyquist = audioContext.sampleRate / 2;

  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < spectrum.length; i++) {
    let frequency = map(i, 0, spectrum.length - 1, 0, nyquist);

    let magnitude = spectrum[i];

    weightedSum += frequency * magnitude;
    magnitudeSum += magnitude;
  }

  if (magnitudeSum === 0) {
    return 0;
  }

  let centroidHz = weightedSum / magnitudeSum;

  return constrain(centroidHz / nyquist, 0, 1);
}

function calculateSpectralFlux(spectrum, previous) {
  if (previous.length !== spectrum.length) {
    return 0;
  }

  let sumSquares = 0;
  let count = 0;

  for (let i = 0; i < spectrum.length; i++) {
    let difference = spectrum[i] - previous[i];

    // Only positive spectral changes
    if (difference > 0) {
      sumSquares += difference * difference;
      count++;
    }
  }

  if (count === 0) {
    return 0;
  }

  return sqrt(sumSquares / count);
}

// -------------------------
// INITIAL STRING
// -------------------------

function initializeString() {
  history = [];
  currentString = "";

  for (let i = 0; i < initialLength; i++) {
    currentString += "A";
  }

  generationCount = 0;
}

// -------------------------
// DRAW LOOP
// -------------------------

function draw() {
  background(0);

  analyzeAudio();

  if (!isPaused) {
    if (millis() - lastGenerationTime >= generationInterval) {
      generateNextGeneration();
      lastGenerationTime = millis();
    }
  }

  drawBaseline();
  drawHistory();

  if (previousPoints.length > 0 && targetPoints.length > 0) {
    let transitionProgress =
      (millis() - lastGenerationTime) / generationInterval;

    transitionProgress = constrain(transitionProgress, 0, 1);

    transitionProgress = smoothStep(transitionProgress);

    let displayPoints = interpolatePoints(
      previousPoints,
      targetPoints,
      transitionProgress,
    );

    drawSignalLine(displayPoints);
  }

  drawHUD();
  drawAudioMeters();
}

// -------------------------
// GENERATION
// -------------------------

function generateNextGeneration() {
  let nextString = "";

  for (let i = 0; i < currentString.length; i++) {
    let currentSymbol = currentString[i];

    nextString += rewriteSymbol(currentSymbol);
  }

  currentString = nextString;
  generationCount++;

  previousPoints = copyPoints(targetPoints);

  targetPoints = buildLineFromString(currentString);

  saveHistory(targetPoints);

  console.log("Generation", generationCount, currentString);
}

// -------------------------
// REWRITE
// -------------------------

function rewriteSymbol(symbol) {
  let options = rules[symbol];

  if (!options) {
    return symbol;
  }

  return weightedChoice(options);
}

function weightedChoice(options) {
  let totalWeight = 0;

  for (let option of options) {
    totalWeight += option.weight;
  }

  let r = random(totalWeight);
  let runningSum = 0;

  for (let option of options) {
    runningSum += option.weight;

    if (r <= runningSum) {
      return option.symbol;
    }
  }

  return options[options.length - 1].symbol;
}

// -------------------------
// STRING -> LINE
// -------------------------

function buildLineFromString(sequence) {
  let points = [];

  let xStep = width / max(1, sequence.length - 1);

  let currentY = baselineY;

  for (let i = 0; i < sequence.length; i++) {
    let symbol = sequence[i];

    let targetY = baselineY;

    if (symbol === "A") {
      targetY = baselineY;
    }

    if (symbol === "B") {
      targetY = baselineY - 90;
    }

    if (symbol === "C") {
      targetY = baselineY + 90;
    }

    if (symbol === "D") {
      targetY = baselineY + 25;
    }

    currentY = lerp(currentY, targetY, 0.65);

    points.push({
      x: i * xStep,
      y: currentY,
      symbol: symbol,
    });
  }

  return points;
}

// -------------------------
// GENERATION INTERPOLATION
// -------------------------

function interpolatePoints(fromPoints, toPoints, amount) {
  let result = [];

  let count = min(fromPoints.length, toPoints.length);

  for (let i = 0; i < count; i++) {
    result.push({
      x: lerp(fromPoints[i].x, toPoints[i].x, amount),

      y: lerp(fromPoints[i].y, toPoints[i].y, amount),
    });
  }

  return result;
}

function smoothStep(t) {
  return t * t * (3 - 2 * t);
}

// -------------------------
// COPY POINTS
// -------------------------

function copyPoints(points) {
  let result = [];

  for (let point of points) {
    result.push({
      x: point.x,
      y: point.y,
      symbol: point.symbol,
    });
  }

  return result;
}

// -------------------------
// GEOMETRIC SMOOTHING
// -------------------------

function smoothPoints(points, iterations = 2) {
  let result = copyPoints(points);

  for (let iteration = 0; iteration < iterations; iteration++) {
    let newPoints = [];

    newPoints.push({
      x: result[0].x,
      y: result[0].y,
    });

    for (let i = 0; i < result.length - 1; i++) {
      let p1 = result[i];
      let p2 = result[i + 1];

      let q = {
        x: lerp(p1.x, p2.x, 0.25),

        y: lerp(p1.y, p2.y, 0.25),
      };

      let r = {
        x: lerp(p1.x, p2.x, 0.75),

        y: lerp(p1.y, p2.y, 0.75),
      };

      newPoints.push(q);
      newPoints.push(r);
    }

    let lastPoint = result[result.length - 1];

    newPoints.push({
      x: lastPoint.x,
      y: lastPoint.y,
    });

    result = newPoints;
  }

  return result;
}

// -------------------------
// HISTORY
// -------------------------

function saveHistory(points) {
  let snapshot = copyPoints(points);

  history.unshift(snapshot);

  if (history.length > maxHistory) {
    history.pop();
  }
}

function drawHistory() {
  for (let i = 1; i < history.length; i++) {
    let points = history[i];

    let alpha = map(i, 1, maxHistory, 95, 5);

    let offset = i * historySpacing;

    drawHistoryLine(points, -offset, alpha);

    drawHistoryLine(points, offset, alpha);
  }
}

function drawHistoryLine(points, yOffset, alpha) {
  if (points.length < 2) return;

  let smooth = smoothPoints(points, 2);

  push();

  noFill();

  stroke(60, 140, 180, alpha);

  strokeWeight(1.2);

  beginShape();

  for (let point of smooth) {
    vertex(point.x, point.y + yOffset);
  }

  endShape();

  pop();
}

// -------------------------
// DRAWING
// -------------------------

function drawBaseline() {
  push();

  stroke(50);
  strokeWeight(1);

  line(0, baselineY, width, baselineY);

  pop();
}

function drawSignalLine(points) {
  if (points.length < 2) return;

  let smooth = smoothPoints(points, 2);

  push();

  noFill();

  stroke(0, 255, 255);

  strokeWeight(3);

  beginShape();

  for (let point of smooth) {
    vertex(point.x, point.y);
  }

  endShape();

  pop();
}

// -------------------------
// HUD / DEBUG
// -------------------------

function drawHUD() {
  push();

  fill(255);
  noStroke();
  textSize(16);

  text("Generation: " + generationCount, 20, 30);

  text("Length: " + currentString.length, 20, 55);

  text(currentString, 20, 80);

  text("Audio: " + (song.isPlaying() ? "PLAYING" : "PAUSED"), 20, 120);

  text("Amplitude: " + nf(audioLevel, 1, 3), 20, 145);

  text("Low: " + nf(lowControl, 1, 2), 20, 170);
  text("Middle: " + nf(middleControl, 1, 2), 20, 195);
  text("High: " + nf(highControl, 1, 2), 20, 220);

  text("Centroid: " + nf(spectralCentroid, 1, 3), 20, 245);

  text("Flux raw: " + nf(spectralFlux, 1, 6), 20, 270);

  text("Flux control: " + nf(fluxControl, 1, 2), 20, 295);

  pop();
}

// -------------------------
// DRAW AUDIO METERS
// -------------------------

function drawAudioMeters() {
  let x = 20;
  let y = 350;

  let barWidth = 190;
  let barHeight = 8;
  let gap = 20;

  push();

  noStroke();

  // background bars
  fill(40);

  for (let i = 0; i < 6; i++) {
    rect(x, y + i * gap, barWidth, barHeight);
  }

  // amplitude
  fill(255);
  rect(x, y, barWidth * constrain(audioLevel * 4, 0, 1), barHeight);

  // low
  rect(x, y + gap, barWidth * lowControl, barHeight);

  // middle
  rect(x, y + gap * 2, barWidth * middleControl, barHeight);

  // high
  rect(x, y + gap * 3, barWidth * highControl, barHeight);

  // centroid
  rect(x, y + gap * 4, barWidth * spectralCentroid, barHeight);

  // flux
  rect(x, y + gap * 5, barWidth * fluxControl, barHeight);

  pop();
}

// -------------------------
// CONTROLS
// -------------------------

async function keyPressed() {
  // SPACE
  if (key === " ") {
    isPaused = !isPaused;

    return false;
  }

  // PLAY / PAUSE
  if (key === "p" || key === "P") {
    if (!song) return false;

    if (song.isPlaying()) {
      song.pause();
    } else {
      await userStartAudio();
      song.play();
    }

    return false;
  }

  // RESET
  if (key === "r" || key === "R") {
    initializeString();

    let initialPoints = buildLineFromString(currentString);

    previousPoints = copyPoints(initialPoints);

    targetPoints = copyPoints(initialPoints);

    saveHistory(initialPoints);

    lastGenerationTime = millis();

    return false;
  }
}

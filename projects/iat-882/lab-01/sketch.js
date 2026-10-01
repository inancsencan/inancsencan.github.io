// =========================================================
// SIGNAL MACHINE
// Audio analysis + stochastic L-system visualizer
// =========================================================
//
// SYSTEM OVERVIEW
//
// 1. A fixed-length stochastic L-system continuously rewrites
//    a string made of A, B, C, and D symbols.
//
// 2. Each symbol is mapped to a vertical tendency, producing
//    a horizontal signal line across the canvas.
//
// 3. Consecutive L-system generations are interpolated so the
//    visual form morphs smoothly instead of jumping instantly.
//
// 4. Previous generations are stored as visual history and
//    drawn above and below the current signal as fading echoes.
//
// 5. An MP3 file is analyzed independently using amplitude,
//    frequency-band energy, spectral centroid, and spectral flux.
//
// 6. Audio features are currently displayed for debugging.
//    They will later modify the stochastic rule probabilities.
//
// =========================================================

// =========================================================
// CONFIGURATION
// =========================================================

// For the first prototype, spectral flux controls how
// stochastic the L-system is.
//
// Later this value will come from a user-selected dropdown.
const RULE_CONTROL_SOURCE = "flux";

// Canvas
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

// L-system
const INITIAL_STRING_LENGTH = 32;
const GENERATION_INTERVAL = 300; // milliseconds

// Symbol-to-line mapping
const UP_OFFSET = -90;
const DOWN_OFFSET = 90;
const QUIET_OFFSET = 25;
const SYMBOL_INTERPOLATION = 0.65;

// Visual history
const MAX_HISTORY = 16;
const HISTORY_SPACING = 14;
const HISTORY_NEAR_ALPHA = 95;
const HISTORY_FAR_ALPHA = 5;

// Geometric smoothing
const SMOOTHING_ITERATIONS = 2;

// Audio analysis
const FFT_SIZE = 1024;
const AMPLITUDE_SMOOTHING = 0.8;

// Frequency bands.
// These deliberately cover broad low, middle, and high regions
// rather than being designed for one particular musical genre.
const LOW_MIN_HZ = 50;
const LOW_MAX_HZ = 250;

const MIDDLE_MIN_HZ = 250;
const MIDDLE_MAX_HZ = 1200;

const HIGH_MIN_HZ = 1200;
const HIGH_MAX_HZ = 4000;

// Adaptive normalization.
// Peak values decay slowly so different tracks can produce
// comparable 0–1 control signals without fixed gain values.
const BAND_PEAK_DECAY = 0.995;
const BAND_CONTROL_SMOOTHING = 0.15;

const FLUX_PEAK_DECAY = 0.995;
const FLUX_CONTROL_SMOOTHING = 0.25;

// =========================================================
// L-SYSTEM STATE
// =========================================================

let currentString = "";

let generationCount = 0;
let lastGenerationTime = 0;

let isPaused = false;

// =========================================================
// VISUAL STATE
// =========================================================

let baselineY;

let previousPoints = [];
let targetPoints = [];

let history = [];

// =========================================================
// AUDIO STATE
// =========================================================

let song;
let fft;
let amplitude;

// Overall loudness
let audioLevel = 0;

// Raw frequency-band energy
let lowEnergy = 0;
let middleEnergy = 0;
let highEnergy = 0;

// Normalized 0–1 values used as potential generative controls
let lowControl = 0;
let middleControl = 0;
let highControl = 0;

// Running peaks used for adaptive normalization
let lowPeak = 0.001;
let middlePeak = 0.001;
let highPeak = 0.001;

// Spectral features
let spectralCentroid = 0;
let spectralFlux = 0;

// Previous FFT frame is required to calculate spectral change
let previousSpectrum = [];

// Normalized spectral-flux control
let fluxControl = 0;
let fluxPeak = 0.0001;

// =========================================================
// STOCHASTIC L-SYSTEM RULES
// =========================================================
//
// Every input symbol produces exactly one output symbol.
// Therefore, unlike many conventional L-systems, the string
// length remains constant across generations.
//
// The system still evolves because each rewrite is selected
// probabilistically.
//
// A = neutral / baseline tendency
// B = upward tendency
// C = downward tendency
// D = quieter / small downward tendency
//
// At this stage these probabilities are fixed.
// Later, audio features will bias these weights dynamically.
//
// =========================================================

const baseRules = {
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

// =========================================================
// SETUP
// =========================================================

async function setup() {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  canvas.parent("sketch-holder");

  baselineY = height / 2;

  // -------------------------------------------------------
  // Load and connect the audio source.
  //
  // p5.sound 0.4.x uses an asynchronous loading workflow,
  // so setup waits until the MP3 is available before creating
  // the analyzers.
  // -------------------------------------------------------

  song = await loadSound("audio/track.mp3");

  fft = new p5.FFT(FFT_SIZE);
  amplitude = new p5.Amplitude(AMPLITUDE_SMOOTHING);

  song.connect(fft);
  song.connect(amplitude);

  // -------------------------------------------------------
  // Initialize the first L-system state.
  // -------------------------------------------------------

  initializeString();

  const initialPoints = buildLineFromString(currentString);

  previousPoints = copyPoints(initialPoints);
  targetPoints = copyPoints(initialPoints);

  saveHistory(initialPoints);

  lastGenerationTime = millis();

  console.log("Audio loaded:", song);
  console.log("Initial string:", currentString);
}

// =========================================================
// MAIN DRAW LOOP
// =========================================================

function draw() {
  background(0);

  // Audio analysis runs every visual frame.
  // The L-system itself evolves at the slower generation rate.
  analyzeAudio();

  updateGeneration();

  drawBaseline();
  drawHistory();

  drawInterpolatedSignal();

  drawHUD();
  drawAudioMeters();
}

// =========================================================
// AUDIO ANALYSIS
// =========================================================

function analyzeAudio() {
  // When no audio is playing, visible/control values return
  // to zero rather than freezing at their previous values.
  //
  // Running peak values are intentionally preserved so
  // pausing and resuming does not completely recalibrate
  // the analyzer.
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

  const spectrum = fft.analyze();

  // -------------------------------------------------------
  // Overall amplitude
  // -------------------------------------------------------

  audioLevel = amplitude.getLevel();

  // -------------------------------------------------------
  // Frequency-band energy
  //
  // Band energy is measured using RMS rather than a simple
  // arithmetic mean. This gives stronger spectral components
  // more influence instead of diluting them across the band.
  // -------------------------------------------------------

  lowEnergy = getBandEnergy(spectrum, LOW_MIN_HZ, LOW_MAX_HZ);

  middleEnergy = getBandEnergy(spectrum, MIDDLE_MIN_HZ, MIDDLE_MAX_HZ);

  highEnergy = getBandEnergy(spectrum, HIGH_MIN_HZ, HIGH_MAX_HZ);

  updateBandControls();

  // -------------------------------------------------------
  // Spectral centroid
  //
  // Describes the frequency "center of gravity" of the
  // spectrum. Higher values generally correspond to a
  // spectrum weighted more strongly toward high frequencies.
  //
  // The result is currently normalized against the Nyquist
  // frequency and is kept primarily as a diagnostic value.
  // -------------------------------------------------------

  spectralCentroid = calculateSpectralCentroid(spectrum);

  // -------------------------------------------------------
  // Spectral flux
  //
  // Measures positive spectral change between consecutive
  // FFT frames. It can respond to transients, note attacks,
  // rhythmic events, and other sudden spectral changes.
  // -------------------------------------------------------

  spectralFlux = calculateSpectralFlux(spectrum, previousSpectrum);

  previousSpectrum = [...spectrum];

  updateFluxControl();
}

// =========================================================
// AUDIO NORMALIZATION
// =========================================================

function updateBandControls() {
  // Slowly reduce the stored peaks.
  //
  // This adaptive normalization allows tracks with very
  // different spectral balances and mastering levels to
  // produce useful relative control values.
  lowPeak *= BAND_PEAK_DECAY;
  middlePeak *= BAND_PEAK_DECAY;
  highPeak *= BAND_PEAK_DECAY;

  // Store new peaks whenever the current frame exceeds
  // the decayed previous maximum.
  lowPeak = max(lowPeak, lowEnergy);
  middlePeak = max(middlePeak, middleEnergy);
  highPeak = max(highPeak, highEnergy);

  // Convert raw measurements to relative 0–1 targets.
  const targetLow = constrain(lowEnergy / lowPeak, 0, 1);

  const targetMiddle = constrain(middleEnergy / middlePeak, 0, 1);

  const targetHigh = constrain(highEnergy / highPeak, 0, 1);

  // Smooth the controls so rapid FFT fluctuations do not
  // produce excessive jitter in later generative mappings.
  lowControl = lerp(lowControl, targetLow, BAND_CONTROL_SMOOTHING);

  middleControl = lerp(middleControl, targetMiddle, BAND_CONTROL_SMOOTHING);

  highControl = lerp(highControl, targetHigh, BAND_CONTROL_SMOOTHING);
}

function updateFluxControl() {
  // Flux is also normalized adaptively because its raw
  // magnitude depends strongly on the source material.
  fluxPeak *= FLUX_PEAK_DECAY;

  fluxPeak = max(fluxPeak, spectralFlux);

  const targetFlux = constrain(spectralFlux / fluxPeak, 0, 1);

  fluxControl = lerp(fluxControl, targetFlux, FLUX_CONTROL_SMOOTHING);
}

// =========================================================
// AUDIO FEATURE HELPERS
// =========================================================

function getBandEnergy(spectrum, minFrequency, maxFrequency) {
  const audioContext = getAudioContext();
  const nyquist = audioContext.sampleRate / 2;

  let startIndex = floor(map(minFrequency, 0, nyquist, 0, spectrum.length));

  let endIndex = floor(map(maxFrequency, 0, nyquist, 0, spectrum.length));

  startIndex = constrain(startIndex, 0, spectrum.length - 1);

  endIndex = constrain(endIndex, 0, spectrum.length - 1);

  let sumSquares = 0;
  let count = 0;

  for (let i = startIndex; i <= endIndex; i++) {
    const value = spectrum[i];

    sumSquares += value * value;
    count++;
  }

  if (count === 0) {
    return 0;
  }

  // RMS energy
  return sqrt(sumSquares / count);
}

function calculateSpectralCentroid(spectrum) {
  const audioContext = getAudioContext();
  const nyquist = audioContext.sampleRate / 2;

  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < spectrum.length; i++) {
    const frequency = map(i, 0, spectrum.length - 1, 0, nyquist);

    const magnitude = spectrum[i];

    weightedSum += frequency * magnitude;

    magnitudeSum += magnitude;
  }

  if (magnitudeSum === 0) {
    return 0;
  }

  const centroidHz = weightedSum / magnitudeSum;

  // Normalize frequency position to 0–1.
  return constrain(centroidHz / nyquist, 0, 1);
}

function calculateSpectralFlux(spectrum, previous) {
  // Flux cannot be calculated until a previous FFT frame
  // of the same size exists.
  if (previous.length !== spectrum.length) {
    return 0;
  }

  let sumSquares = 0;
  let count = 0;

  for (let i = 0; i < spectrum.length; i++) {
    const difference = spectrum[i] - previous[i];

    // Only increases in spectral energy are counted.
    // This emphasizes new spectral events rather than decay.
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

// =========================================================
// L-SYSTEM INITIALIZATION
// =========================================================

function initializeString() {
  history = [];
  currentString = "";

  for (let i = 0; i < INITIAL_STRING_LENGTH; i++) {
    currentString += "A";
  }

  generationCount = 0;
}

// =========================================================
// L-SYSTEM GENERATION
// =========================================================

function updateGeneration() {
  if (isPaused) {
    return;
  }

  if (millis() - lastGenerationTime < GENERATION_INTERVAL) {
    return;
  }

  generateNextGeneration();

  lastGenerationTime = millis();
}

function generateNextGeneration() {
  let nextString = "";

  // Parallel rewriting:
  //
  // Every symbol is read from the OLD generation and written
  // into a separate new string. Newly produced symbols cannot
  // be rewritten again during the same generation.
  for (let i = 0; i < currentString.length; i++) {
    const currentSymbol = currentString[i];

    nextString += rewriteSymbol(currentSymbol);
  }

  currentString = nextString;
  generationCount++;

  // The previous target becomes the starting shape for the
  // visual transition toward the newly generated form.
  previousPoints = copyPoints(targetPoints);

  targetPoints = buildLineFromString(currentString);

  // History stores true generation states, not intermediate
  // animation frames.
  saveHistory(targetPoints);

  console.log("Generation", generationCount, currentString);
}

// =========================================================
// STOCHASTIC REWRITING
// =========================================================

function rewriteSymbol(symbol) {
  const baseOptions = baseRules[symbol];

  if (!baseOptions) {
    return "A";
  }

  const controlValue = getRuleProbabilityControl();

  const dynamicOptions = createDynamicRuleWeights(baseOptions, controlValue);

  return weightedChoice(dynamicOptions);
}

function getRuleProbabilityControl() {
  // First prototype:
  // spectral flux controls stochasticity.
  //
  // Later this function will return whichever
  // audio feature the user selects in the UI.

  if (RULE_CONTROL_SOURCE === "flux") {
    return fluxControl;
  }

  return 0;
}

function createDynamicRuleWeights(baseOptions, controlValue) {
  const dynamicOptions = [];

  const amount = constrain(controlValue, 0, 1);

  for (const option of baseOptions) {
    // Deterministic state:
    // A has probability 1.
    // Every other symbol has probability 0.
    const deterministicWeight = option.symbol === "A" ? 1 : 0;

    // Interpolate between:
    //
    // control = 0 → deterministic A-only system
    // control = 1 → original stochastic rule weights
    const dynamicWeight = lerp(deterministicWeight, option.weight, amount);

    dynamicOptions.push({
      symbol: option.symbol,
      weight: dynamicWeight,
    });
  }

  return dynamicOptions;
}

function weightedChoice(options) {
  let totalWeight = 0;

  for (const option of options) {
    totalWeight += option.weight;
  }

  const randomValue = random(totalWeight);

  let runningSum = 0;

  for (const option of options) {
    runningSum += option.weight;

    if (randomValue <= runningSum) {
      return option.symbol;
    }
  }

  // Numerical fallback in case floating-point precision
  // prevents a previous comparison from succeeding.
  return options[options.length - 1].symbol;
}

// =========================================================
// SYMBOL STRING -> VISUAL LINE
// =========================================================

function buildLineFromString(sequence) {
  const points = [];

  // Because the first point starts at x = 0 and the final
  // point ends at x = width, the signal always spans the
  // entire canvas horizontally.
  const xStep = width / max(1, sequence.length - 1);

  let currentY = baselineY;

  for (let i = 0; i < sequence.length; i++) {
    const symbol = sequence[i];

    let targetY = baselineY;

    if (symbol === "A") {
      targetY = baselineY;
    }

    if (symbol === "B") {
      targetY = baselineY + UP_OFFSET;
    }

    if (symbol === "C") {
      targetY = baselineY + DOWN_OFFSET;
    }

    if (symbol === "D") {
      targetY = baselineY + QUIET_OFFSET;
    }

    // Neighboring symbol targets are partially interpolated.
    // This prevents each symbolic state from becoming a hard
    // independent vertical step.
    currentY = lerp(currentY, targetY, SYMBOL_INTERPOLATION);

    points.push({
      x: i * xStep,
      y: currentY,
      symbol: symbol,
    });
  }

  return points;
}

// =========================================================
// GENERATION-TO-GENERATION ANIMATION
// =========================================================

function drawInterpolatedSignal() {
  if (previousPoints.length === 0 || targetPoints.length === 0) {
    return;
  }

  let progress = (millis() - lastGenerationTime) / GENERATION_INTERVAL;

  progress = constrain(progress, 0, 1);

  // Smoothstep provides ease-in and ease-out so each new
  // generation visually morphs into the next rather than
  // changing abruptly.
  progress = smoothStep(progress);

  const displayPoints = interpolatePoints(
    previousPoints,
    targetPoints,
    progress,
  );

  drawSignalLine(displayPoints);
}

function interpolatePoints(fromPoints, toPoints, amount) {
  const result = [];

  const count = min(fromPoints.length, toPoints.length);

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

// =========================================================
// GEOMETRIC SMOOTHING
// =========================================================
//
// Chaikin corner-cutting is applied only during rendering.
//
// It does NOT alter the L-system string or generation state.
// The symbolic structure therefore remains discrete while
// its visual interpretation becomes smoother.
//
// =========================================================

function smoothPoints(points, iterations = SMOOTHING_ITERATIONS) {
  let result = copyPoints(points);

  for (let iteration = 0; iteration < iterations; iteration++) {
    const newPoints = [];

    // Preserve the first endpoint.
    newPoints.push({
      x: result[0].x,
      y: result[0].y,
    });

    for (let i = 0; i < result.length - 1; i++) {
      const p1 = result[i];
      const p2 = result[i + 1];

      const q = {
        x: lerp(p1.x, p2.x, 0.25),
        y: lerp(p1.y, p2.y, 0.25),
      };

      const r = {
        x: lerp(p1.x, p2.x, 0.75),
        y: lerp(p1.y, p2.y, 0.75),
      };

      newPoints.push(q);
      newPoints.push(r);
    }

    // Preserve the final endpoint.
    const lastPoint = result[result.length - 1];

    newPoints.push({
      x: lastPoint.x,
      y: lastPoint.y,
    });

    result = newPoints;
  }

  return result;
}

// =========================================================
// POINT UTILITIES
// =========================================================

function copyPoints(points) {
  const result = [];

  for (const point of points) {
    result.push({
      x: point.x,
      y: point.y,
      symbol: point.symbol,
    });
  }

  return result;
}

// =========================================================
// GENERATION HISTORY
// =========================================================

function saveHistory(points) {
  const snapshot = copyPoints(points);

  // Newest generation remains at index 0.
  history.unshift(snapshot);

  if (history.length > MAX_HISTORY) {
    history.pop();
  }
}

function drawHistory() {
  // history[0] is the current target generation and is drawn
  // separately as the main cyan signal.
  //
  // Older generations are mirrored upward and downward,
  // producing a temporal fade around the active line.
  for (let i = 1; i < history.length; i++) {
    const points = history[i];

    const alpha = map(i, 1, MAX_HISTORY, HISTORY_NEAR_ALPHA, HISTORY_FAR_ALPHA);

    const offset = i * HISTORY_SPACING;

    drawHistoryLine(points, -offset, alpha);

    drawHistoryLine(points, offset, alpha);
  }
}

function drawHistoryLine(points, yOffset, alpha) {
  if (points.length < 2) {
    return;
  }

  const smooth = smoothPoints(points);

  push();

  noFill();

  stroke(60, 140, 180, alpha);

  strokeWeight(1.2);

  beginShape();

  for (const point of smooth) {
    vertex(point.x, point.y + yOffset);
  }

  endShape();

  pop();
}

// =========================================================
// SIGNAL DRAWING
// =========================================================

function drawBaseline() {
  push();

  stroke(50);
  strokeWeight(1);

  line(0, baselineY, width, baselineY);

  pop();
}

function drawSignalLine(points) {
  if (points.length < 2) {
    return;
  }

  const smooth = smoothPoints(points);

  push();

  noFill();

  stroke(0, 255, 255);

  strokeWeight(3);

  beginShape();

  for (const point of smooth) {
    vertex(point.x, point.y);
  }

  endShape();

  pop();
}

// =========================================================
// DEBUG HUD
// =========================================================
//
// The HUD intentionally exposes both the generative state
// and the audio analysis while the system is being developed.
//
// It can later be hidden or converted into an optional
// interface without changing the underlying system.
//
// =========================================================

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

  text("Rule control: " + nf(getRuleProbabilityControl(), 1, 2), 20, 320);

  pop();
}

// =========================================================
// AUDIO DEBUG METERS
// =========================================================

function drawAudioMeters() {
  const x = 20;
  const y = 375;

  const barWidth = 190;
  const barHeight = 8;
  const gap = 20;

  push();
  noStroke();

  // Six meter backgrounds:
  //
  // 0 = amplitude
  // 1 = low
  // 2 = middle
  // 3 = high
  // 4 = spectral centroid
  // 5 = spectral flux
  fill(40);

  for (let i = 0; i < 6; i++) {
    rect(x, y + i * gap, barWidth, barHeight);
  }

  fill(255);

  // Amplitude is currently amplified only for visualization.
  // Its raw value remains unchanged in the audio analysis.
  rect(x, y, barWidth * constrain(audioLevel * 4, 0, 1), barHeight);

  rect(x, y + gap, barWidth * lowControl, barHeight);

  rect(x, y + gap * 2, barWidth * middleControl, barHeight);

  rect(x, y + gap * 3, barWidth * highControl, barHeight);

  rect(x, y + gap * 4, barWidth * spectralCentroid, barHeight);

  rect(x, y + gap * 5, barWidth * fluxControl, barHeight);

  pop();
}

// =========================================================
// KEYBOARD CONTROLS
// =========================================================
//
// SPACE = pause/resume L-system evolution
// P     = play/pause audio
// R     = reset the L-system to its initial string
//
// Keeping audio playback and generative evolution separate
// is useful during development because each subsystem can
// be inspected independently.
//
// =========================================================

async function keyPressed() {
  // Pause/resume L-system generations.
  if (key === " ") {
    isPaused = !isPaused;
    return false;
  }

  // Play/pause the MP3.
  if (key === "p" || key === "P") {
    if (!song) {
      return false;
    }

    if (song.isPlaying()) {
      song.pause();
    } else {
      await userStartAudio();
      song.play();
    }

    return false;
  }

  // Reset only the generative system.
  // Audio playback is deliberately left untouched.
  if (key === "r" || key === "R") {
    initializeString();

    const initialPoints = buildLineFromString(currentString);

    previousPoints = copyPoints(initialPoints);

    targetPoints = copyPoints(initialPoints);

    saveHistory(initialPoints);

    lastGenerationTime = millis();

    return false;
  }
}

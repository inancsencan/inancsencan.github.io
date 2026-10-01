// =========================================================
// SIGNAL MACHINE
// Audio-reactive stochastic L-system visualizer
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
//    current signal morphs smoothly instead of jumping.
//
// 4. The current signal is rendered to an offscreen graphics
//    layer. Periodic snapshots of that rendered layer are
//    captured and moved upward and downward while fading.
//
//    This temporal visualization is independent of the
//    L-system generation history. It stores rendered visual
//    states rather than symbolic generation states.
//
// 5. An MP3 file is analyzed using amplitude, frequency-band
//    energy, spectral centroid, and spectral flux.
//
// 6. Spectral flux currently controls the amount of
//    stochasticity in the L-system.
//
//    No audio:
//      deterministic A-only rewriting.
//
//    Stronger flux:
//      increasingly stochastic rewriting.
//
// =========================================================

// =========================================================
// CONFIGURATION
// =========================================================

// ---------------------------------------------------------
// Rule-control prototype
// ---------------------------------------------------------
//
// Later this will be replaced by a user-selectable mapping.
// For now, normalized spectral flux controls stochasticity.

const RULE_CONTROL_SOURCE = "flux";

// ---------------------------------------------------------
// Canvas
// ---------------------------------------------------------

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

// ---------------------------------------------------------
// L-system
// ---------------------------------------------------------

const INITIAL_STRING_LENGTH = 32;

// New symbolic generations are produced at this interval.
// Rendering still happens every visual frame.
const GENERATION_INTERVAL = 300; // milliseconds

// ---------------------------------------------------------
// Symbol-to-line mapping
// ---------------------------------------------------------

const UP_OFFSET = -90;
const DOWN_OFFSET = 90;
const QUIET_OFFSET = 25;

// Smooths neighboring symbolic target heights before the
// separate geometric smoothing stage.
const SYMBOL_INTERPOLATION = 0.65;

// ---------------------------------------------------------
// Geometric smoothing
// ---------------------------------------------------------

const SMOOTHING_ITERATIONS = 2;

// ---------------------------------------------------------
// Temporal snapshot visualization
// ---------------------------------------------------------
//
// The current signal is rendered into an offscreen layer.
// A snapshot of that layer is periodically captured.
//
// Each snapshot is then drawn twice:
//   one copy moves upward,
//   one copy moves downward.
//
// Both copies fade as they move away from the center.
//
// Because snapshots contain the already-rendered signal,
// future visual changes to the signal automatically become
// part of the temporal visualization.

const SNAPSHOT_INTERVAL = 100; // milliseconds

// Movement speed in pixels per second.
const SNAPSHOT_SPEED = 120;

// Alpha when a snapshot is first created.
const SNAPSHOT_START_ALPHA = 105;

// Alpha removed per second.
const SNAPSHOT_FADE_RATE = 70;

// Safety limit to prevent excessive image memory use.
const MAX_SNAPSHOTS = 20;

// ---------------------------------------------------------
// Audio analysis
// ---------------------------------------------------------

const FFT_SIZE = 1024;
const AMPLITUDE_SMOOTHING = 0.8;

// ---------------------------------------------------------
// Frequency bands
// ---------------------------------------------------------
//
// Broad frequency regions are used so the analyzer is not
// designed around one particular musical genre.

const LOW_MIN_HZ = 50;
const LOW_MAX_HZ = 250;

const MIDDLE_MIN_HZ = 250;
const MIDDLE_MAX_HZ = 1200;

const HIGH_MIN_HZ = 1200;
const HIGH_MAX_HZ = 4000;

// ---------------------------------------------------------
// Adaptive audio normalization
// ---------------------------------------------------------
//
// Peaks slowly decay so tracks with very different spectral
// balances can still produce useful relative 0–1 controls.

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

// Two symbolic-generation shapes are stored so the visible
// signal can smoothly interpolate between them.
let previousPoints = [];
let targetPoints = [];

// ---------------------------------------------------------
// Offscreen signal layer
// ---------------------------------------------------------
//
// Only the current signal is drawn here.
//
// HUD, controls, and debug graphics remain on the main canvas
// so they do not become part of temporal snapshots.

let signalLayer;

// ---------------------------------------------------------
// Temporal snapshots
// ---------------------------------------------------------

let temporalSnapshots = [];
let lastSnapshotTime = 0;

// =========================================================
// AUDIO STATE
// =========================================================

let song;
let fft;
let amplitude;

// ---------------------------------------------------------
// Overall loudness
// ---------------------------------------------------------

let audioLevel = 0;

// ---------------------------------------------------------
// Raw frequency-band energy
// ---------------------------------------------------------

let lowEnergy = 0;
let middleEnergy = 0;
let highEnergy = 0;

// ---------------------------------------------------------
// Normalized frequency controls
// ---------------------------------------------------------
//
// These are relative 0–1 values intended for later
// generative mappings.

let lowControl = 0;
let middleControl = 0;
let highControl = 0;

// ---------------------------------------------------------
// Adaptive band peaks
// ---------------------------------------------------------

let lowPeak = 0.001;
let middlePeak = 0.001;
let highPeak = 0.001;

// ---------------------------------------------------------
// Spectral features
// ---------------------------------------------------------

let spectralCentroid = 0;
let spectralFlux = 0;

// Previous FFT frame is required to measure spectral change.
let previousSpectrum = [];

// ---------------------------------------------------------
// Spectral-flux control
// ---------------------------------------------------------

let fluxControl = 0;
let fluxPeak = 0.0001;

// =========================================================
// STOCHASTIC L-SYSTEM RULES
// =========================================================
//
// Every symbol rewrites into exactly one symbol.
//
// Therefore the string remains the same length across
// generations. This avoids exponential growth while still
// allowing the symbolic state to evolve continuously.
//
// Visual meanings:
//
// A = neutral / baseline tendency
// B = upward tendency
// C = downward tendency
// D = quieter / small downward tendency
//
// These weights represent the system at maximum
// stochasticity.
//
// The active weights are dynamically interpolated between:
//
//   deterministic:
//     A = 1
//     B = 0
//     C = 0
//     D = 0
//
// and:
//
//   the stochastic distributions below.
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
  // Create the offscreen visual layer.
  // -------------------------------------------------------
  //
  // p5.Graphics uses a transparent background by default.
  // We clear it every frame and draw only the current signal.

  signalLayer = createGraphics(width, height);

  // -------------------------------------------------------
  // Load and connect audio.
  // -------------------------------------------------------

  song = await loadSound("audio/track.mp3");

  fft = new p5.FFT(FFT_SIZE);

  amplitude = new p5.Amplitude(AMPLITUDE_SMOOTHING);

  song.connect(fft);
  song.connect(amplitude);

  // -------------------------------------------------------
  // Initialize the L-system.
  // -------------------------------------------------------

  initializeString();

  const initialPoints = buildLineFromString(currentString);

  previousPoints = copyPoints(initialPoints);

  targetPoints = copyPoints(initialPoints);

  lastGenerationTime = millis();

  lastSnapshotTime = millis();

  console.log("Audio loaded:", song);

  console.log("Initial string:", currentString);
}

// =========================================================
// MAIN DRAW LOOP
// =========================================================

function draw() {
  background(0);

  // -------------------------------------------------------
  // 1. Analyze audio every visual frame.
  // -------------------------------------------------------

  analyzeAudio();

  // -------------------------------------------------------
  // 2. Update symbolic generation when its timer expires.
  // -------------------------------------------------------

  updateGeneration();

  // -------------------------------------------------------
  // 3. Calculate the smoothly interpolated current signal.
  // -------------------------------------------------------

  const displayPoints = getInterpolatedSignalPoints();

  // -------------------------------------------------------
  // 4. Render current signal to offscreen layer.
  // -------------------------------------------------------

  renderSignalLayer(displayPoints);

  // -------------------------------------------------------
  // 5. Capture temporal snapshots when appropriate.
  // -------------------------------------------------------

  updateSnapshotCapture();

  // -------------------------------------------------------
  // 6. Advance all stored snapshots every visual frame.
  // -------------------------------------------------------

  updateTemporalSnapshots();

  // -------------------------------------------------------
  // 7. Draw temporal echoes first so the current signal
  //    remains visually dominant.
  // -------------------------------------------------------

  drawTemporalSnapshots();

  // -------------------------------------------------------
  // 8. Draw fixed center reference line.
  //
  //    The baseline intentionally does NOT belong to the
  //    snapshot layer, so it remains stationary.
  // -------------------------------------------------------

  drawBaseline();

  // -------------------------------------------------------
  // 9. Draw the live signal at the center.
  // -------------------------------------------------------

  image(signalLayer, 0, 0);

  // -------------------------------------------------------
  // 10. Draw interface/debug information last.
  //
  //     HUD graphics never enter the snapshot system.
  // -------------------------------------------------------

  drawHUD();
  drawAudioMeters();
}

// =========================================================
// AUDIO ANALYSIS
// =========================================================

function analyzeAudio() {
  // When audio is not playing, current analysis/control
  // values return to zero.
  //
  // Peak calibration is intentionally preserved so pause /
  // resume does not reset normalization every time.

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
  // -------------------------------------------------------
  //
  // RMS is used instead of a simple arithmetic mean.
  // Strong spectral components therefore retain more
  // influence within each frequency region.

  lowEnergy = getBandEnergy(spectrum, LOW_MIN_HZ, LOW_MAX_HZ);

  middleEnergy = getBandEnergy(spectrum, MIDDLE_MIN_HZ, MIDDLE_MAX_HZ);

  highEnergy = getBandEnergy(spectrum, HIGH_MIN_HZ, HIGH_MAX_HZ);

  updateBandControls();

  // -------------------------------------------------------
  // Spectral centroid
  // -------------------------------------------------------
  //
  // Measures the spectrum's frequency center of gravity.
  // Higher values generally indicate more high-frequency
  // spectral emphasis.

  spectralCentroid = calculateSpectralCentroid(spectrum);

  // -------------------------------------------------------
  // Spectral flux
  // -------------------------------------------------------
  //
  // Measures positive spectral change relative to the
  // previous FFT frame.
  //
  // It can react to attacks, transitions, rhythmic events,
  // and other sudden changes in spectral content.

  spectralFlux = calculateSpectralFlux(spectrum, previousSpectrum);

  previousSpectrum = [...spectrum];

  updateFluxControl();
}

// =========================================================
// AUDIO NORMALIZATION
// =========================================================

function updateBandControls() {
  // Slowly forget old peaks.
  lowPeak *= BAND_PEAK_DECAY;
  middlePeak *= BAND_PEAK_DECAY;
  highPeak *= BAND_PEAK_DECAY;

  // Store stronger recent peaks.
  lowPeak = max(lowPeak, lowEnergy);

  middlePeak = max(middlePeak, middleEnergy);

  highPeak = max(highPeak, highEnergy);

  // Convert raw measurements into relative 0–1 targets.
  const targetLow = constrain(lowEnergy / lowPeak, 0, 1);

  const targetMiddle = constrain(middleEnergy / middlePeak, 0, 1);

  const targetHigh = constrain(highEnergy / highPeak, 0, 1);

  // Smooth the control signals to reduce frame-level jitter.
  lowControl = lerp(lowControl, targetLow, BAND_CONTROL_SMOOTHING);

  middleControl = lerp(middleControl, targetMiddle, BAND_CONTROL_SMOOTHING);

  highControl = lerp(highControl, targetHigh, BAND_CONTROL_SMOOTHING);
}

function updateFluxControl() {
  // Flux normalization follows the same adaptive-peak idea
  // used by the frequency bands.

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

  // Normalize position within the available spectrum.
  return constrain(centroidHz / nyquist, 0, 1);
}

function calculateSpectralFlux(spectrum, previous) {
  // Flux requires a previous FFT frame of equal length.

  if (previous.length !== spectrum.length) {
    return 0;
  }

  let sumSquares = 0;
  let count = 0;

  for (let i = 0; i < spectrum.length; i++) {
    const difference = spectrum[i] - previous[i];

    // Count only increases in spectral energy.
    //
    // This emphasizes newly appearing spectral events
    // rather than ordinary decay.

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

  // -------------------------------------------------------
  // Parallel rewriting
  // -------------------------------------------------------
  //
  // Every symbol is read from the OLD generation and written
  // into a separate new string.
  //
  // Newly produced symbols therefore cannot be rewritten
  // again during the same generation.

  for (let i = 0; i < currentString.length; i++) {
    const currentSymbol = currentString[i];

    nextString += rewriteSymbol(currentSymbol);
  }

  currentString = nextString;

  generationCount++;

  // The old target becomes the start of the visual morph.
  previousPoints = copyPoints(targetPoints);

  // Build the geometry for the new symbolic generation.
  targetPoints = buildLineFromString(currentString);

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

// ---------------------------------------------------------
// Current mapping prototype
// ---------------------------------------------------------
//
// Later this function will read the user's selected audio
// feature from the interface.

function getRuleProbabilityControl() {
  if (RULE_CONTROL_SOURCE === "flux") {
    return fluxControl;
  }

  return 0;
}

// ---------------------------------------------------------
// Deterministic -> stochastic interpolation
// ---------------------------------------------------------

function createDynamicRuleWeights(baseOptions, controlValue) {
  const dynamicOptions = [];

  const amount = constrain(controlValue, 0, 1);

  for (const option of baseOptions) {
    // Deterministic state:
    //
    // A = 100%
    // everything else = 0%

    const deterministicWeight = option.symbol === "A" ? 1 : 0;

    // Audio control continuously interpolates between the
    // deterministic state and the predefined stochastic rule.

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

  // Floating-point safety fallback.
  return options[options.length - 1].symbol;
}

// =========================================================
// SYMBOL STRING -> VISUAL LINE
// =========================================================

function buildLineFromString(sequence) {
  const points = [];

  // First point begins at x = 0.
  // Final point ends at x = width.

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

    // Partially approach each symbol's target.
    //
    // This provides local smoothing before Chaikin
    // geometric smoothing is applied later.

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
// GENERATION-TO-GENERATION INTERPOLATION
// =========================================================

function getInterpolatedSignalPoints() {
  if (previousPoints.length === 0 || targetPoints.length === 0) {
    return [];
  }

  let progress = (millis() - lastGenerationTime) / GENERATION_INTERVAL;

  progress = constrain(progress, 0, 1);

  // Smoothstep creates ease-in / ease-out motion between
  // consecutive symbolic generations.

  progress = smoothStep(progress);

  return interpolatePoints(previousPoints, targetPoints, progress);
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
// Chaikin corner-cutting is used only for rendering.
//
// The symbolic L-system state remains discrete and unchanged.
// Smoothing therefore changes only its visual interpretation.
//
// =========================================================

function smoothPoints(points, iterations = SMOOTHING_ITERATIONS) {
  let result = copyPoints(points);

  for (let iteration = 0; iteration < iterations; iteration++) {
    const newPoints = [];

    // Preserve first endpoint.
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

    // Preserve final endpoint.
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
// SIGNAL LAYER
// =========================================================
//
// The live signal is rendered once into an offscreen layer.
//
// The same rendered layer is:
//
//   1. displayed as the current central signal,
//   2. periodically copied into the temporal snapshot system.
//
// This means future changes to the signal's visual appearance
// automatically propagate into new temporal snapshots.
//
// =========================================================

function renderSignalLayer(points) {
  signalLayer.clear();

  if (points.length < 2) {
    return;
  }

  const smooth = smoothPoints(points);

  signalLayer.push();

  signalLayer.noFill();

  // -------------------------------------------------------
  // CURRENT SIGNAL VISUAL STYLE
  // -------------------------------------------------------
  //
  // Future changes to color, line weight, or other visual
  // properties should happen here.
  //
  // Because snapshots are captured from signalLayer, these
  // changes automatically become part of the temporal effect.

  signalLayer.stroke(0, 255, 255);

  signalLayer.strokeWeight(3);

  signalLayer.beginShape();

  for (const point of smooth) {
    signalLayer.vertex(point.x, point.y);
  }

  signalLayer.endShape();

  signalLayer.pop();
}

// =========================================================
// TEMPORAL SNAPSHOT SYSTEM
// =========================================================
//
// This replaces the earlier generation-history system.
//
// A snapshot is NOT an L-system generation.
//
// It is a rendered visual state of the live signal at a
// particular moment in time.
//
// Each snapshot:
//
//   - starts at the center,
//   - moves upward and downward simultaneously,
//   - fades continuously,
//   - disappears when fully transparent.
//
// The system therefore behaves more like a moving temporal
// echo / afterimage than a symbolic history visualization.
//
// =========================================================

// ---------------------------------------------------------
// Snapshot capture
// ---------------------------------------------------------

function updateSnapshotCapture() {
  // Do not continuously generate identical flat snapshots
  // when audio is stopped.
  //
  // Existing snapshots are still allowed to drift and fade.

  if (!song || !song.isPlaying()) {
    return;
  }

  if (millis() - lastSnapshotTime < SNAPSHOT_INTERVAL) {
    return;
  }

  captureSignalSnapshot();

  lastSnapshotTime = millis();
}

function captureSignalSnapshot() {
  // signalLayer.get() captures the already-rendered line.
  //
  // It does not need to know anything about symbols,
  // generations, smoothing, colors, or line thickness.

  const snapshotImage = signalLayer.get();

  temporalSnapshots.push({
    image: snapshotImage,

    offset: 0,

    alpha: SNAPSHOT_START_ALPHA,
  });

  // Prevent unlimited memory growth.
  if (temporalSnapshots.length > MAX_SNAPSHOTS) {
    temporalSnapshots.shift();
  }
}

// ---------------------------------------------------------
// Snapshot animation
// ---------------------------------------------------------

function updateTemporalSnapshots() {
  // Convert milliseconds to seconds so temporal motion is
  // approximately independent of frame rate.

  const seconds = deltaTime / 1000;

  for (const snapshot of temporalSnapshots) {
    snapshot.offset += SNAPSHOT_SPEED * seconds;

    snapshot.alpha -= SNAPSHOT_FADE_RATE * seconds;
  }

  // Remove snapshots after they become invisible.
  temporalSnapshots = temporalSnapshots.filter(
    (snapshot) => snapshot.alpha > 0,
  );
}

// ---------------------------------------------------------
// Snapshot rendering
// ---------------------------------------------------------

function drawTemporalSnapshots() {
  push();

  for (const snapshot of temporalSnapshots) {
    const alpha = constrain(snapshot.alpha, 0, 255);

    tint(255, alpha);

    // Upper temporal echo
    image(snapshot.image, 0, -snapshot.offset);

    // Lower temporal echo
    image(snapshot.image, 0, snapshot.offset);
  }

  noTint();

  pop();
}

// =========================================================
// FIXED BASELINE
// =========================================================
//
// The baseline is intentionally drawn on the main canvas
// rather than signalLayer.
//
// Therefore it does not become part of temporal snapshots.
//
// =========================================================

function drawBaseline() {
  push();

  stroke(50);
  strokeWeight(1);

  line(0, baselineY, width, baselineY);

  pop();
}

// =========================================================
// DEBUG HUD
// =========================================================
//
// The HUD exposes the current symbolic and audio states while
// the project is being developed.
//
// Because it is drawn directly to the main canvas after the
// temporal effect, it never appears in snapshots.
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

  const audioPlaying = song && song.isPlaying();

  text("Audio: " + (audioPlaying ? "PLAYING" : "PAUSED"), 20, 120);

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

  // Amplitude is multiplied only for HUD visualization.
  // The raw measurement itself remains unchanged.

  rect(x, y, barWidth * constrain(audioLevel * 4, 0, 1), barHeight);

  rect(x, y + gap, barWidth * lowControl, barHeight);

  rect(x, y + gap * 2, barWidth * middleControl, barHeight);

  rect(x, y + gap * 3, barWidth * highControl, barHeight);

  rect(x, y + gap * 4, barWidth * spectralCentroid, barHeight);

  rect(x, y + gap * 5, barWidth * fluxControl, barHeight);

  pop();
}

// =========================================================
// TEMPORAL RESET
// =========================================================

function resetTemporalSnapshots() {
  temporalSnapshots = [];

  lastSnapshotTime = millis();

  if (signalLayer) {
    signalLayer.clear();
  }
}

// =========================================================
// KEYBOARD CONTROLS
// =========================================================
//
// SPACE = pause/resume L-system generations
// P     = play/pause audio
// R     = reset L-system + temporal visualization
//
// Audio playback and L-system evolution remain separate
// controls so the subsystems can still be inspected during
// development.
//
// =========================================================

async function keyPressed() {
  // -------------------------------------------------------
  // SPACE
  // Pause/resume symbolic evolution.
  // -------------------------------------------------------

  if (key === " ") {
    isPaused = !isPaused;

    return false;
  }

  // -------------------------------------------------------
  // P
  // Play/pause MP3.
  // -------------------------------------------------------

  if (key === "p" || key === "P") {
    if (!song) {
      return false;
    }

    if (song.isPlaying()) {
      song.pause();
    } else {
      await userStartAudio();

      song.play();

      // Avoid immediately capturing a snapshot whose timer
      // has been accumulating during the paused period.
      lastSnapshotTime = millis();
    }

    return false;
  }

  // -------------------------------------------------------
  // R
  // Reset the generative visual state.
  //
  // Audio playback itself is intentionally not restarted.
  // -------------------------------------------------------

  if (key === "r" || key === "R") {
    initializeString();

    const initialPoints = buildLineFromString(currentString);

    previousPoints = copyPoints(initialPoints);

    targetPoints = copyPoints(initialPoints);

    lastGenerationTime = millis();

    resetTemporalSnapshots();

    return false;
  }
}

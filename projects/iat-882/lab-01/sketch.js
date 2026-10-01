// =========================================================
// SIGNAL MACHINE
// Audio-reactive stochastic L-system visualizer
// =========================================================
//
// SYSTEM OVERVIEW
//
// The system consists of four connected layers:
//
// 1. AUDIO ANALYSIS
//    An MP3 is analyzed for six features:
//    amplitude, low, middle, high, centroid, and flux.
//
// 2. MAPPING
//    HTML dropdowns assign any audio feature to one of five
//    generative / visual targets:
//
//      - Rule Probability
//      - Generation Timing
//      - Vertical Displacement
//      - Line Thickness
//      - Color
//
// 3. STOCHASTIC L-SYSTEM
//    A fixed-length symbolic string evolves through parallel
//    stochastic rewriting.
//
// 4. TEMPORAL VISUALIZATION
//    The live signal is periodically captured as a rendered
//    image. These snapshots drift upward and downward while
//    fading, producing temporal echoes.
//
// Thickness and color use AUDIO HISTORY rather than only the
// current audio value. Recent sound is spatially distributed
// from left to right across the signal.
//
// =========================================================

// =========================================================
// CONFIGURATION
// =========================================================

// ---------------------------------------------------------
// Canvas
// ---------------------------------------------------------

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

// ---------------------------------------------------------
// User-selected audio mappings
// ---------------------------------------------------------
//
// These values are updated by HTML <select> elements.

let ruleControlSource = "flux";
let timingControlSource = "none";
let displacementControlSource = "none";
let thicknessControlSource = "none";
let colorControlSource = "none";

// ---------------------------------------------------------
// L-system
// ---------------------------------------------------------

const INITIAL_STRING_LENGTH = 32;

// Used when Generation Timing = None.
const DEFAULT_GENERATION_INTERVAL = 300;

// Dynamic timing range when an audio source is assigned.
//
// low audio value  -> slower generations
// high audio value -> faster generations

const MIN_GENERATION_INTERVAL = 120;
const MAX_GENERATION_INTERVAL = 700;

const TIMING_SMOOTHING = 0.12;

// ---------------------------------------------------------
// Symbol-to-line geometry
// ---------------------------------------------------------

const UP_OFFSET = -90;
const DOWN_OFFSET = 90;
const QUIET_OFFSET = 25;

const SYMBOL_INTERPOLATION = 0.65;

// ---------------------------------------------------------
// Geometric smoothing
// ---------------------------------------------------------

const SMOOTHING_ITERATIONS = 2;

// ---------------------------------------------------------
// Line appearance
// ---------------------------------------------------------

const DEFAULT_LINE_WEIGHT = 3;

const MIN_LINE_WEIGHT = 1;
const MAX_LINE_WEIGHT = 8;

let startColor = {
  r: 0,
  g: 255,
  b: 255,
};

let endColor = {
  r: 255,
  g: 0,
  b: 255,
};

let thicknessMultiplier = 1;
let snapshotFadeDuration = 1.5;

// ---------------------------------------------------------
// Temporal snapshot visualization
// ---------------------------------------------------------

const SNAPSHOT_INTERVAL = 100; // ms

const SNAPSHOT_SPEED = 120; // px / second

const SNAPSHOT_START_ALPHA = 105;

const MAX_SNAPSHOTS = 20;

// ---------------------------------------------------------
// Audio analysis
// ---------------------------------------------------------

const FFT_SIZE = 1024;
const AMPLITUDE_SMOOTHING = 0.8;

// ---------------------------------------------------------
// Frequency regions
// ---------------------------------------------------------

const LOW_MIN_HZ = 50;
const LOW_MAX_HZ = 250;

const MIDDLE_MIN_HZ = 250;
const MIDDLE_MAX_HZ = 1200;

const HIGH_MIN_HZ = 1200;
const HIGH_MAX_HZ = 4000;

// ---------------------------------------------------------
// Adaptive normalization
// ---------------------------------------------------------

const BAND_PEAK_DECAY = 0.995;
const BAND_CONTROL_SMOOTHING = 0.15;

const FLUX_PEAK_DECAY = 0.995;
const FLUX_CONTROL_SMOOTHING = 0.25;

const CENTROID_PEAK_DECAY = 0.999;
const CENTROID_CONTROL_SMOOTHING = 0.12;

// ---------------------------------------------------------
// Spatial audio history
// ---------------------------------------------------------
//
// A sample is stored every 50 ms.
//
// 90 samples therefore represent roughly 4.5 seconds.
//
// Oldest samples are mapped to the left side of the line;
// newest samples appear on the right.

const AUDIO_HISTORY_LENGTH = 90;
const AUDIO_HISTORY_INTERVAL = 50;

// =========================================================
// SYSTEM STATE
// =========================================================

// ---------------------------------------------------------
// Master playback
// ---------------------------------------------------------
//
// There is now only one pause state.
//
// SPACE controls:
//   audio
//   audio analysis
//   L-system evolution
//   generation interpolation
//   snapshot capture
//   snapshot movement

let systemRunning = false;
let systemHasStarted = false;

let pauseStartedAt = 0;

// ---------------------------------------------------------
// HUD
// ---------------------------------------------------------

let showHUD = false;

// ---------------------------------------------------------
// L-system state
// ---------------------------------------------------------

let currentString = "";

let generationCount = 0;
let lastGenerationTime = 0;

let currentGenerationInterval = DEFAULT_GENERATION_INTERVAL;

// ---------------------------------------------------------
// Visual state
// ---------------------------------------------------------

let baselineY;

let previousPoints = [];
let targetPoints = [];

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
// Amplitude
// ---------------------------------------------------------

let audioLevel = 0;

// ---------------------------------------------------------
// Frequency-band energy
// ---------------------------------------------------------

let lowEnergy = 0;
let middleEnergy = 0;
let highEnergy = 0;

let lowControl = 0;
let middleControl = 0;
let highControl = 0;

let lowPeak = 0.001;
let middlePeak = 0.001;
let highPeak = 0.001;

// ---------------------------------------------------------
// Spectral centroid
// ---------------------------------------------------------

let spectralCentroid = 0;

let centroidControl = 0;
let centroidPeak = 0.01;

// ---------------------------------------------------------
// Spectral flux
// ---------------------------------------------------------

let spectralFlux = 0;

let fluxControl = 0;
let fluxPeak = 0.0001;

let previousSpectrum = [];

// =========================================================
// AUDIO HISTORY
// =========================================================
//
// Every feature gets its own recent-value buffer.
//
// This allows the user to switch Thickness or Color sources
// without rebuilding the audio history from scratch.

let audioHistory = {
  amplitude: [],
  low: [],
  middle: [],
  high: [],
  centroid: [],
  flux: [],
};

let lastAudioHistoryTime = 0;

// =========================================================
// STOCHASTIC L-SYSTEM RULES
// =========================================================
//
// Every input symbol produces exactly one output symbol.
//
// This keeps the string at a constant length and prevents
// exponential growth.
//
// Symbol meanings:
//
// A = baseline
// B = upward tendency
// C = downward tendency
// D = smaller downward tendency
//
// The values below represent MAXIMUM stochasticity.
//
// When Rule Probability control = 0:
//
//   A = 100%
//
// When control approaches 1:
//
//   the distributions below become fully active.
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

  // Connect HTML dropdowns to the sketch.
  setupControls();

  // -------------------------------------------------------
  // Offscreen signal layer
  // -------------------------------------------------------

  signalLayer = createGraphics(width, height);

  // -------------------------------------------------------
  // Audio
  // -------------------------------------------------------

  song = await loadSound("audio/track.mp3");

  fft = new p5.FFT(FFT_SIZE);

  amplitude = new p5.Amplitude(AMPLITUDE_SMOOTHING);

  song.connect(fft);
  song.connect(amplitude);

  // -------------------------------------------------------
  // Initial L-system
  // -------------------------------------------------------

  initializeString();

  const initialPoints = buildLineFromString(currentString);

  previousPoints = copyPoints(initialPoints);

  targetPoints = copyPoints(initialPoints);

  // -------------------------------------------------------
  // Initial audio history
  // -------------------------------------------------------

  resetAudioHistory();

  const now = millis();

  lastGenerationTime = now;
  lastSnapshotTime = now;
  lastAudioHistoryTime = now;

  pauseStartedAt = now;

  console.log("Audio loaded:", song);

  console.log("Initial string:", currentString);
}

// =========================================================
// MAIN DRAW LOOP
// =========================================================

function draw() {
  background(0);

  // -------------------------------------------------------
  // All time-dependent systems update only while running.
  // -------------------------------------------------------

  if (systemRunning) {
    analyzeAudio();

    updateAudioHistory();

    updateGenerationTiming();

    updateGeneration();

    updateSnapshotCapture();

    updateTemporalSnapshots();
  }

  // -------------------------------------------------------
  // Current visual state
  // -------------------------------------------------------
  //
  // getInterpolatedSignalPoints() uses an effective clock,
  // so generation morphing also freezes during pause.

  let displayPoints = getInterpolatedSignalPoints();

  // Vertical displacement is a global/current audio mapping.
  displayPoints = applyVerticalDisplacement(displayPoints);

  // Render the styled signal to its offscreen layer.
  renderSignalLayer(displayPoints);

  // -------------------------------------------------------
  // Final compositing order
  // -------------------------------------------------------

  drawTemporalSnapshots();

  drawBaseline();

  image(signalLayer, 0, 0);

  // HUD exists only while H is held.
  if (showHUD) {
    drawHUD();
    drawAudioMeters();
  }
}

// =========================================================
// HTML CONTROL CONNECTIONS
// =========================================================

function setupControls() {
  const ruleSelect = document.getElementById("rule-source");

  const timingSelect = document.getElementById("timing-source");

  const displacementSelect = document.getElementById("displacement-source");

  const thicknessSelect = document.getElementById("thickness-source");

  const colorSelect = document.getElementById("color-source");

  const fadeDurationSlider = document.getElementById("fade-duration");

  const fadeDurationValue = document.getElementById("fade-duration-value");

  snapshotFadeDuration = Number(fadeDurationSlider.value);

  fadeDurationSlider.addEventListener("input", function () {
    snapshotFadeDuration = Number(this.value);

    fadeDurationValue.textContent = snapshotFadeDuration.toFixed(1) + " s";
  });

  const startColorPicker = document.getElementById("color-start");

  const endColorPicker = document.getElementById("color-end");

  startColor = hexToRgb(startColorPicker.value);

  endColor = hexToRgb(endColorPicker.value);

  startColorPicker.addEventListener("input", function () {
    startColor = hexToRgb(this.value);
  });

  endColorPicker.addEventListener("input", function () {
    endColor = hexToRgb(this.value);
  });

  ruleControlSource = ruleSelect.value;

  timingControlSource = timingSelect.value;

  displacementControlSource = displacementSelect.value;

  thicknessControlSource = thicknessSelect.value;

  colorControlSource = colorSelect.value;

  const thicknessMultiplierSlider = document.getElementById(
    "thickness-multiplier",
  );

  const thicknessMultiplierValue = document.getElementById(
    "thickness-multiplier-value",
  );

  thicknessMultiplier = Number(thicknessMultiplierSlider.value);

  thicknessMultiplierSlider.addEventListener("input", function () {
    thicknessMultiplier = Number(this.value);

    thicknessMultiplierValue.textContent = thicknessMultiplier.toFixed(1) + "×";
  });

  ruleSelect.addEventListener("change", function () {
    ruleControlSource = this.value;
  });

  timingSelect.addEventListener("change", function () {
    timingControlSource = this.value;
  });

  displacementSelect.addEventListener("change", function () {
    displacementControlSource = this.value;
  });

  thicknessSelect.addEventListener("change", function () {
    thicknessControlSource = this.value;
  });

  colorSelect.addEventListener("change", function () {
    colorControlSource = this.value;
  });
}

// =========================================================
// AUDIO ANALYSIS
// =========================================================

function analyzeAudio() {
  if (!song || !song.isPlaying()) {
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

  lowEnergy = getBandEnergy(spectrum, LOW_MIN_HZ, LOW_MAX_HZ);

  middleEnergy = getBandEnergy(spectrum, MIDDLE_MIN_HZ, MIDDLE_MAX_HZ);

  highEnergy = getBandEnergy(spectrum, HIGH_MIN_HZ, HIGH_MAX_HZ);

  updateBandControls();

  // -------------------------------------------------------
  // Spectral centroid
  // -------------------------------------------------------

  spectralCentroid = calculateSpectralCentroid(spectrum);

  updateCentroidControl();

  // -------------------------------------------------------
  // Spectral flux
  // -------------------------------------------------------

  spectralFlux = calculateSpectralFlux(spectrum, previousSpectrum);

  previousSpectrum = [...spectrum];

  updateFluxControl();
}

// =========================================================
// AUDIO NORMALIZATION
// =========================================================

function updateBandControls() {
  lowPeak *= BAND_PEAK_DECAY;

  middlePeak *= BAND_PEAK_DECAY;

  highPeak *= BAND_PEAK_DECAY;

  lowPeak = max(lowPeak, lowEnergy);

  middlePeak = max(middlePeak, middleEnergy);

  highPeak = max(highPeak, highEnergy);

  const targetLow = constrain(lowEnergy / lowPeak, 0, 1);

  const targetMiddle = constrain(middleEnergy / middlePeak, 0, 1);

  const targetHigh = constrain(highEnergy / highPeak, 0, 1);

  lowControl = lerp(lowControl, targetLow, BAND_CONTROL_SMOOTHING);

  middleControl = lerp(middleControl, targetMiddle, BAND_CONTROL_SMOOTHING);

  highControl = lerp(highControl, targetHigh, BAND_CONTROL_SMOOTHING);
}

// ---------------------------------------------------------
// Centroid normalization
// ---------------------------------------------------------
//
// Raw centroid values occupy only a small portion of the
// theoretical 0–1 Nyquist range.
//
// A slowly decaying recent peak converts them into a more
// usable relative control signal.
//
// spectralCentroid remains the raw measurement.
// centroidControl is the normalized mapping value.

function updateCentroidControl() {
  centroidPeak *= CENTROID_PEAK_DECAY;

  centroidPeak = max(centroidPeak, spectralCentroid);

  const targetCentroid = constrain(spectralCentroid / centroidPeak, 0, 1);

  centroidControl = lerp(
    centroidControl,
    targetCentroid,
    CENTROID_CONTROL_SMOOTHING,
  );
}

// ---------------------------------------------------------
// Flux normalization
// ---------------------------------------------------------

function updateFluxControl() {
  fluxPeak *= FLUX_PEAK_DECAY;

  fluxPeak = max(fluxPeak, spectralFlux);

  const targetFlux = constrain(spectralFlux / fluxPeak, 0, 1);

  fluxControl = lerp(fluxControl, targetFlux, FLUX_CONTROL_SMOOTHING);
}

// =========================================================
// AUDIO VALUE RESOLVER
// =========================================================
//
// All five generative targets use this one resolver.
//
// Therefore the interface can assign any of the six
// normalized audio features to any target.
//
// "none" always returns zero.
//
// =========================================================

function getAudioControlValue(source) {
  if (source === "amplitude") {
    return constrain(audioLevel * 4, 0, 1);
  }

  if (source === "low") {
    return lowControl;
  }

  if (source === "middle") {
    return middleControl;
  }

  if (source === "high") {
    return highControl;
  }

  if (source === "centroid") {
    return centroidControl;
  }

  if (source === "flux") {
    return fluxControl;
  }

  return 0;
}

// =========================================================
// AUDIO HISTORY
// =========================================================
//
// Global targets use the CURRENT value:
//
//   rule probability
//   generation timing
//   vertical displacement
//
// Spatial targets use RECENT AUDIO HISTORY:
//
//   line thickness
//   color
//
// =========================================================

function resetAudioHistory() {
  for (const key in audioHistory) {
    audioHistory[key] = new Array(AUDIO_HISTORY_LENGTH).fill(0);
  }
}

function updateAudioHistory() {
  if (millis() - lastAudioHistoryTime < AUDIO_HISTORY_INTERVAL) {
    return;
  }

  pushAudioHistoryValue("amplitude", getAudioControlValue("amplitude"));

  pushAudioHistoryValue("low", lowControl);

  pushAudioHistoryValue("middle", middleControl);

  pushAudioHistoryValue("high", highControl);

  pushAudioHistoryValue("centroid", centroidControl);

  pushAudioHistoryValue("flux", fluxControl);

  lastAudioHistoryTime = millis();
}

function pushAudioHistoryValue(feature, value) {
  const history = audioHistory[feature];

  history.push(constrain(value, 0, 1));

  if (history.length > AUDIO_HISTORY_LENGTH) {
    history.shift();
  }
}

// ---------------------------------------------------------
// Spatial history lookup
// ---------------------------------------------------------
//
// position = 0 → oldest audio
// position = 1 → newest audio
//
// Values between stored samples are linearly interpolated,
// preventing visible step changes along the signal.

function getAudioHistoryValue(source, position) {
  if (source === "none" || !audioHistory[source]) {
    return 0;
  }

  const history = audioHistory[source];

  if (history.length === 0) {
    return 0;
  }

  const index = constrain(position, 0, 1) * (history.length - 1);

  const indexA = floor(index);

  const indexB = min(indexA + 1, history.length - 1);

  const localAmount = index - indexA;

  return lerp(history[indexA], history[indexB], localAmount);
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

  return constrain(centroidHz / nyquist, 0, 1);
}

function calculateSpectralFlux(spectrum, previous) {
  if (previous.length !== spectrum.length) {
    return 0;
  }

  let sumSquares = 0;
  let count = 0;

  for (let i = 0; i < spectrum.length; i++) {
    const difference = spectrum[i] - previous[i];

    // Only newly increasing spectral energy contributes.
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
// GENERATION TIMING
// =========================================================

function updateGenerationTiming() {
  // No mapping:
  // preserve the original fixed generation interval.

  if (timingControlSource === "none") {
    currentGenerationInterval = lerp(
      currentGenerationInterval,
      DEFAULT_GENERATION_INTERVAL,
      TIMING_SMOOTHING,
    );

    return;
  }

  const control = getAudioControlValue(timingControlSource);

  // Higher audio control means faster evolution.

  const targetInterval = lerp(
    MAX_GENERATION_INTERVAL,
    MIN_GENERATION_INTERVAL,
    control,
  );

  currentGenerationInterval = lerp(
    currentGenerationInterval,
    targetInterval,
    TIMING_SMOOTHING,
  );
}

// =========================================================
// L-SYSTEM GENERATION
// =========================================================

function updateGeneration() {
  if (millis() - lastGenerationTime < currentGenerationInterval) {
    return;
  }

  generateNextGeneration();

  lastGenerationTime = millis();
}

function generateNextGeneration() {
  let nextString = "";

  // Parallel rewriting:
  //
  // every output symbol is derived only from the previous
  // generation, never from newly created symbols.

  for (let i = 0; i < currentString.length; i++) {
    const currentSymbol = currentString[i];

    nextString += rewriteSymbol(currentSymbol);
  }

  currentString = nextString;

  generationCount++;

  previousPoints = copyPoints(targetPoints);

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

function getRuleProbabilityControl() {
  return getAudioControlValue(ruleControlSource);
}

function createDynamicRuleWeights(baseOptions, controlValue) {
  const dynamicOptions = [];

  const amount = constrain(controlValue, 0, 1);

  for (const option of baseOptions) {
    // Deterministic state:
    //
    // A = 100%
    // everything else = 0%

    const deterministicWeight = option.symbol === "A" ? 1 : 0;

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

  return options[options.length - 1].symbol;
}

// =========================================================
// SYMBOL STRING -> BASE GEOMETRY
// =========================================================
//
// This stage creates the BASE shape.
//
// Audio-controlled Vertical Displacement is applied later,
// during rendering.
//
// Keeping these stages separate allows displacement to react
// every frame without rewriting the L-system.
//
// =========================================================

function buildLineFromString(sequence) {
  const points = [];

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
// VERTICAL DISPLACEMENT
// =========================================================
//
// None:
//   the original ±90 px geometry is preserved.
//
// Audio source selected:
//   0 → collapse toward baseline
//   1 → full original displacement
//
// This transformation happens every frame and therefore
// reacts continuously rather than only once per generation.
//
// =========================================================

function getDisplacementScale() {
  if (displacementControlSource === "none") {
    return 1;
  }

  return getAudioControlValue(displacementControlSource);
}

function applyVerticalDisplacement(points) {
  const scale = getDisplacementScale();

  const result = [];

  for (const point of points) {
    const distanceFromBaseline = point.y - baselineY;

    result.push({
      x: point.x,

      y: baselineY + distanceFromBaseline * scale,

      symbol: point.symbol,
    });
  }

  return result;
}

// =========================================================
// GENERATION-TO-GENERATION INTERPOLATION
// =========================================================

function getInterpolatedSignalPoints() {
  if (previousPoints.length === 0 || targetPoints.length === 0) {
    return [];
  }

  // During pause we use the moment at which pause started.
  // This freezes the visual morph rather than allowing millis()
  // to silently advance it in the background.

  const now = systemRunning ? millis() : pauseStartedAt;

  let progress = (now - lastGenerationTime) / currentGenerationInterval;

  progress = constrain(progress, 0, 1);

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
// Chaikin corner cutting modifies only the rendered geometry,
// not the underlying symbolic L-system.
//
// =========================================================

function smoothPoints(points, iterations = SMOOTHING_ITERATIONS) {
  let result = copyPoints(points);

  for (let iteration = 0; iteration < iterations; iteration++) {
    const newPoints = [];

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
// The smoothed signal is drawn as many short line segments
// instead of one beginShape().
//
// This allows color and stroke weight to change continuously
// along the x-axis.
//
// Because Chaikin smoothing creates many closely spaced
// points, the individual segments still appear as one smooth
// continuous line.
//
// =========================================================

function renderSignalLayer(points) {
  signalLayer.clear();

  if (points.length < 2) {
    return;
  }

  const smooth = smoothPoints(points);

  signalLayer.push();

  signalLayer.strokeCap(ROUND);

  for (let i = 0; i < smooth.length - 1; i++) {
    const p1 = smooth[i];

    const p2 = smooth[i + 1];

    // Normalized horizontal position.
    const t = i / max(1, smooth.length - 2);

    // -----------------------------------------------------
    // Thickness
    // -----------------------------------------------------

    const lineWeight = getSpatialLineWeight(t);

    // -----------------------------------------------------
    // Color
    // -----------------------------------------------------

    const lineColor = getSpatialLineColor(t);

    signalLayer.stroke(lineColor.r, lineColor.g, lineColor.b);

    signalLayer.strokeWeight(lineWeight);

    signalLayer.line(p1.x, p1.y, p2.x, p2.y);
  }

  signalLayer.pop();
}

// =========================================================
// SPATIAL THICKNESS
// =========================================================
//
// None:
//   constant 3 px line.
//
// Audio source:
//   recent audio history is mapped across x.
//
// Old audio -> left.
// New audio -> right.
//
// =========================================================

function getSpatialLineWeight(position) {
  let baseWeight = DEFAULT_LINE_WEIGHT;

  if (thicknessControlSource !== "none") {
    const value = getAudioHistoryValue(thicknessControlSource, position);

    baseWeight = lerp(MIN_LINE_WEIGHT, MAX_LINE_WEIGHT, value);
  }

  return baseWeight * thicknessMultiplier;
}

// =========================================================
// SPATIAL COLOR
// =========================================================

function hexToRgb(hex) {
  const value = hex.replace("#", "");

  return {
    r: parseInt(value.substring(0, 2), 16),

    g: parseInt(value.substring(2, 4), 16),

    b: parseInt(value.substring(4, 6), 16),
  };
}

// =========================================================

function getSpatialLineColor(position) {
  if (colorControlSource === "none") {
    return startColor;
  }

  const value = getAudioHistoryValue(colorControlSource, position);

  return {
    r: lerp(startColor.r, endColor.r, value),

    g: lerp(startColor.g, endColor.g, value),

    b: lerp(startColor.b, endColor.b, value),
  };
}

// =========================================================
// TEMPORAL SNAPSHOT SYSTEM
// =========================================================

function updateSnapshotCapture() {
  if (millis() - lastSnapshotTime < SNAPSHOT_INTERVAL) {
    return;
  }

  captureSignalSnapshot();

  lastSnapshotTime = millis();
}

function captureSignalSnapshot() {
  const snapshotImage = signalLayer.get();

  temporalSnapshots.push({
    image: snapshotImage,

    offset: 0,

    alpha: SNAPSHOT_START_ALPHA,
  });

  if (temporalSnapshots.length > MAX_SNAPSHOTS) {
    temporalSnapshots.shift();
  }
}

function updateTemporalSnapshots() {
  const seconds = deltaTime / 1000;

  const fadeRate = SNAPSHOT_START_ALPHA / snapshotFadeDuration;

  for (const snapshot of temporalSnapshots) {
    snapshot.offset += SNAPSHOT_SPEED * seconds;

    snapshot.alpha -= fadeRate * seconds;
  }

  temporalSnapshots = temporalSnapshots.filter(
    (snapshot) => snapshot.alpha > 0,
  );
}

function drawTemporalSnapshots() {
  push();

  for (const snapshot of temporalSnapshots) {
    const alpha = constrain(snapshot.alpha, 0, 255);

    tint(255, alpha);

    image(snapshot.image, 0, -snapshot.offset);

    image(snapshot.image, 0, snapshot.offset);
  }

  noTint();

  pop();
}

// =========================================================
// BASELINE
// =========================================================

function drawBaseline() {
  push();

  stroke(50);

  strokeWeight(1);

  line(0, baselineY, width, baselineY);

  pop();
}

// =========================================================
// MASTER PLAY / PAUSE
// =========================================================
//
// SPACE now controls the entire system.
//
// First press:
//   starts audio and generative animation.
//
// Pause:
//   pauses audio,
//   freezes generation timing,
//   freezes interpolation,
//   stops snapshot creation,
//   freezes snapshot movement.
//
// Resume:
//   all internal clocks are shifted by the paused duration,
//   allowing animation to continue from the exact point at
//   which it stopped.
//
// =========================================================

async function toggleSystemPlayback() {
  if (!song) {
    return;
  }

  // -------------------------------------------------------
  // PAUSE
  // -------------------------------------------------------

  if (systemRunning) {
    pauseStartedAt = millis();

    if (song.isPlaying()) {
      song.pause();
    }

    systemRunning = false;

    return;
  }

  // -------------------------------------------------------
  // FIRST START
  // -------------------------------------------------------

  if (!systemHasStarted) {
    await userStartAudio();

    song.play();

    systemRunning = true;

    systemHasStarted = true;

    const now = millis();

    lastGenerationTime = now;

    lastSnapshotTime = now;

    lastAudioHistoryTime = now;

    return;
  }

  // -------------------------------------------------------
  // RESUME
  // -------------------------------------------------------

  const resumeTime = millis();

  const pausedDuration = resumeTime - pauseStartedAt;

  // Shift time-based systems forward by exactly the amount
  // of time spent paused.

  lastGenerationTime += pausedDuration;

  lastSnapshotTime += pausedDuration;

  lastAudioHistoryTime += pausedDuration;

  await userStartAudio();

  song.play();

  systemRunning = true;
}

// =========================================================
// DEBUG HUD
// =========================================================
//
// Hold H to display.
//
// The HUD is development instrumentation rather than part of
// the final visual composition.
//
// All displayed audio features are control values intended
// for mapping, not raw FFT magnitudes.
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

  text("System: " + (systemRunning ? "PLAYING" : "PAUSED"), 20, 120);

  text("Amplitude: " + nf(getAudioControlValue("amplitude"), 1, 2), 20, 145);

  text("Low: " + nf(lowControl, 1, 2), 20, 170);

  text("Middle: " + nf(middleControl, 1, 2), 20, 195);

  text("High: " + nf(highControl, 1, 2), 20, 220);

  text("Centroid: " + nf(centroidControl, 1, 2), 20, 245);

  text("Flux: " + nf(fluxControl, 1, 2), 20, 270);

  text(
    "Generation interval: " + nf(currentGenerationInterval, 1, 0) + " ms",
    20,
    305,
  );

  text("Displacement: " + nf(getDisplacementScale(), 1, 2), 20, 330);

  text("Rule: " + ruleControlSource, 20, 365);

  text("Timing: " + timingControlSource, 20, 390);

  text("Displacement: " + displacementControlSource, 20, 415);

  text("Thickness: " + thicknessControlSource, 20, 440);

  text("Color: " + colorControlSource, 20, 465);

  pop();
}

// =========================================================
// AUDIO DEBUG METERS
// =========================================================

function drawAudioMeters() {
  const x = 20;
  const y = 490;

  const barWidth = 190;
  const barHeight = 8;
  const gap = 17;

  const values = [
    getAudioControlValue("amplitude"),

    lowControl,

    middleControl,

    highControl,

    centroidControl,

    fluxControl,
  ];

  push();

  noStroke();

  // Background bars
  fill(40);

  for (let i = 0; i < values.length; i++) {
    rect(x, y + i * gap, barWidth, barHeight);
  }

  // Control values
  fill(255);

  for (let i = 0; i < values.length; i++) {
    rect(
      x,
      y + i * gap,

      barWidth * constrain(values[i], 0, 1),

      barHeight,
    );
  }

  pop();
}

// =========================================================
// RESET
// =========================================================

function resetSystemVisuals() {
  initializeString();

  const initialPoints = buildLineFromString(currentString);

  previousPoints = copyPoints(initialPoints);

  targetPoints = copyPoints(initialPoints);

  temporalSnapshots = [];

  resetAudioHistory();

  if (signalLayer) {
    signalLayer.clear();
  }

  const now = millis();

  lastGenerationTime = now;

  lastSnapshotTime = now;

  lastAudioHistoryTime = now;
}

// =========================================================
// KEYBOARD CONTROLS
// =========================================================
//
// SPACE = master play / pause
// H     = hold to show HUD
// R     = reset generative visual state
//
// =========================================================

async function keyPressed() {
  // -------------------------------------------------------
  // MASTER PLAY / PAUSE
  // -------------------------------------------------------

  if (key === "P" || key === "p" || keyCode === 32) {
    await toggleSystemPlayback();

    return false;
  }

  // -------------------------------------------------------
  // HUD
  // -------------------------------------------------------

  if (key === "h" || key === "H") {
    showHUD = true;

    return false;
  }

  // -------------------------------------------------------
  // RESET
  // -------------------------------------------------------

  if (key === "r" || key === "R") {
    resetSystemVisuals();

    return false;
  }
}

function keyReleased() {
  if (key === "h" || key === "H") {
    showHUD = false;

    return false;
  }
}

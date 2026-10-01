let axiom = "F+G-F-G";

let angle = 90;
let segmentLength = 8;
let secondaryLength = 5;

const rules = {
  F: "F+G-F",
  G: "G-F+G",
};

let currentString = axiom;

// Playback
let playbackIndex = 0;
let isPlaying = false;
let playbackStartTime = 0;
let playbackDuration = 5000;

// Pitch
let basePitch = 60;
let playbackPitch = basePitch;
let pitchStep = 2;

// Debug
let showDebugCircles = false;

// -------------------------
// L-SYSTEM GENERATION
// -------------------------

function applyRule(character) {
  if (rules[character]) {
    return rules[character];
  }

  return character;
}

function generateNextIteration() {
  let nextString = "";

  for (let i = 0; i < currentString.length; i++) {
    let currentCharacter = currentString[i];
    nextString += applyRule(currentCharacter);
  }

  currentString = nextString;
}

function generate(iterations) {
  currentString = axiom;

  console.log("Iteration 0:", currentString);

  for (let i = 1; i <= iterations; i++) {
    generateNextIteration();
    console.log(`Iteration ${i}:`, currentString);
  }

  console.log("Sequence length:", currentString.length);
}

// -------------------------
// P5 SETUP
// -------------------------

function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");

  colorMode(HSB, 360, 100, 100, 1);
  background(0);

  generate(2);
}

// -------------------------
// PLAYBACK
// -------------------------

async function startPlayback() {
  await userStartAudio();

  playbackIndex = 0;
  playbackStartTime = millis();
  playbackPitch = basePitch;
  isPlaying = true;

  console.log("Playback started");
}

function draw() {
  if (isPlaying) {
    let elapsed = millis() - playbackStartTime;
    let progress = elapsed / playbackDuration;
    progress = constrain(progress, 0, 1);

    let targetIndex = floor(progress * currentString.length);

    while (
      playbackIndex < targetIndex &&
      playbackIndex < currentString.length
    ) {
      processAudioSymbol(currentString[playbackIndex]);
      playbackIndex++;
    }

    if (elapsed >= playbackDuration) {
      isPlaying = false;
      console.log("Playback finished");
    }
  }

  renderVisualState(playbackIndex);
}

// -------------------------
// AUDIO PROCESSING
// -------------------------

function processAudioSymbol(symbol) {
  if (symbol === "F") {
    playNote(playbackPitch);
  }

  if (symbol === "G") {
    playNote(playbackPitch + 7);
  }

  if (symbol === "+") {
    playbackPitch += pitchStep;
  }

  if (symbol === "-") {
    playbackPitch -= pitchStep;
  }
}

function playNote(midiPitch) {
  const audioContext = getAudioContext();

  const noteOscillator = audioContext.createOscillator();
  const noteGain = audioContext.createGain();

  noteOscillator.type = "sine";
  noteOscillator.frequency.value = midiToFrequency(midiPitch);

  noteOscillator.connect(noteGain);
  noteGain.connect(audioContext.destination);

  const now = audioContext.currentTime;

  noteGain.gain.setValueAtTime(0, now);
  noteGain.gain.linearRampToValueAtTime(0.15, now + 0.01);
  noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  noteOscillator.start(now);
  noteOscillator.stop(now + 0.1);
}

function midiToFrequency(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// -------------------------
// VISUAL RENDERING
// -------------------------

function renderVisualState(symbolCount) {
  background(0);

  let x = width / 2;
  let y = height / 2;
  let heading = 0;
  let renderPitch = basePitch;
  let debugCount = 0;

  for (let i = 0; i < symbolCount; i++) {
    let symbol = currentString[i];

    if (symbol === "F") {
      let nextX = x + cos(radians(heading)) * segmentLength;

      let nextY = y + sin(radians(heading)) * segmentLength;

      let hueValue = pitchToHue(renderPitch);

      push();
      stroke(hueValue, 80, 100);
      strokeWeight(2);
      line(x, y, nextX, nextY);
      pop();

      x = nextX;
      y = nextY;

      debugCount++;

      if (showDebugCircles) {
        drawDebugCircle(debugCount);
      }
    }

    if (symbol === "G") {
      let nextX = x + cos(radians(heading)) * secondaryLength;

      let nextY = y + sin(radians(heading)) * secondaryLength;

      let hueValue = pitchToHue(renderPitch + 7);

      push();
      stroke(hueValue, 80, 100);
      strokeWeight(2);
      line(x, y, nextX, nextY);
      pop();

      x = nextX;
      y = nextY;

      debugCount++;

      if (showDebugCircles) {
        drawDebugCircle(debugCount);
      }
    }

    if (symbol === "+") {
      heading += angle;
      renderPitch += pitchStep;
    }

    if (symbol === "-") {
      heading -= angle;
      renderPitch -= pitchStep;
    }
  }
}

function pitchToHue(midiPitch) {
  let constrainedPitch = constrain(midiPitch, 48, 84);
  return map(constrainedPitch, 48, 84, 180, 330);
}

// -------------------------
// DEBUG CIRCLES
// -------------------------

function drawDebugCircle(index) {
  let spacing = 12;
  let startX = 20;
  let startY = 20;
  let diameter = 6;

  let maxColumns = floor((width - 40) / spacing);
  maxColumns = max(1, maxColumns);

  let zeroBasedIndex = index - 1;
  let column = zeroBasedIndex % maxColumns;
  let row = floor(zeroBasedIndex / maxColumns);

  let x = startX + column * spacing;
  let y = startY + row * spacing;

  push();
  noStroke();
  fill(0, 100, 100);
  circle(x, y, diameter);
  pop();
}

// -------------------------
// CONTROLS
// -------------------------

function keyPressed() {
  if (key === " ") {
    startPlayback();
    return false;
  }

  if (key === "c" || key === "C") {
    showDebugCircles = true;
    return false;
  }
}

function keyReleased() {
  if (key === "c" || key === "C") {
    showDebugCircles = false;
    return false;
  }
}

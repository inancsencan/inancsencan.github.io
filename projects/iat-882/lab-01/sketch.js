let axiom = "F--F--F";
let angle = 60;
let segmentLength = 5;

const rules = {
  F: "F+F--F+F",
};

let currentString = axiom;

// Playback
let playbackIndex = 0;
let isPlaying = false;
let playbackStartTime = 0;
let playbackDuration = 5000;

// Turtle
let turtleX = 0;
let turtleY = 0;
let turtleAngle = 0;

// Debug
let noteDebugCount = 0;

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

  background(0);

  stroke(255);
  strokeWeight(2);

  // Keep this at 2 while debugging sound.
  generate(2);

  resetTurtle();
}

// -------------------------
// TURTLE
// -------------------------

function resetTurtle() {
  turtleX = width / 2;
  turtleY = height / 2;
  turtleAngle = 0;
}

// -------------------------
// PLAYBACK
// -------------------------

async function startPlayback() {
  await userStartAudio();

  background(0);

  noteDebugCount = 0;
  playbackIndex = 0;
  playbackStartTime = millis();
  isPlaying = true;

  resetTurtle();
}

function draw() {
  if (!isPlaying) {
    return;
  }

  let elapsed = millis() - playbackStartTime;
  let progress = elapsed / playbackDuration;

  // Prevent progress from going beyond 1.
  progress = constrain(progress, 0, 1);

  let targetIndex = floor(progress * currentString.length);

  while (playbackIndex < targetIndex && playbackIndex < currentString.length) {
    let symbol = currentString[playbackIndex];

    processSymbol(symbol);

    playbackIndex++;
  }

  if (elapsed >= playbackDuration) {
    isPlaying = false;

    console.log("Playback finished");
  }
}

// -------------------------
// SYMBOL INTERPRETATION
// -------------------------

function processSymbol(symbol) {
  if (symbol === "F") {
    let nextX = turtleX + cos(radians(turtleAngle)) * segmentLength;

    let nextY = turtleY + sin(radians(turtleAngle)) * segmentLength;

    // Draw the segment.
    push();
    stroke(255);
    strokeWeight(2);
    line(turtleX, turtleY, nextX, nextY);
    pop();

    turtleX = nextX;
    turtleY = nextY;

    // Same event also produces sound.
    playNote();
  }

  if (symbol === "+") {
    turtleAngle += angle;
  }

  if (symbol === "-") {
    turtleAngle -= angle;
  }
}

// -------------------------
// SOUND
// -------------------------

function playNote() {
  noteDebugCount++;

  // Visual debug
  push();
  fill(255, 0, 0);
  noStroke();
  circle(20 + noteDebugCount * 12, 20, 6);
  pop();

  // Audio
  const audioContext = getAudioContext();

  const noteOscillator = audioContext.createOscillator();
  const noteGain = audioContext.createGain();

  noteOscillator.type = "sine";
  noteOscillator.frequency.value = 220;

  noteOscillator.connect(noteGain);
  noteGain.connect(audioContext.destination);

  const now = audioContext.currentTime;

  noteGain.gain.setValueAtTime(0, now);
  noteGain.gain.linearRampToValueAtTime(0.15, now + 0.01);
  noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  noteOscillator.start(now);
  noteOscillator.stop(now + 0.1);
}

// -------------------------
// CONTROLS
// -------------------------

function keyPressed() {
  if (key === " ") {
    startPlayback();

    // Prevent Space from scrolling the webpage.
    return false;
  }
}

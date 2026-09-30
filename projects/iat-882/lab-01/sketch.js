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
let maxHistory = 20;
let historySpacing = 7;

let amplitudeScale = 18;
let maxVerticalOffset = 180;

let isPaused = false;

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

function setup() {
  const canvas = createCanvas(900, 600);
  canvas.parent("sketch-holder");

  baselineY = height / 2;

  initializeString();

  let initialPoints = buildLineFromString(currentString);
  saveHistory(initialPoints);

  lastGenerationTime = millis();

  console.log("Initial string:", currentString);
}

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

  if (!isPaused) {
    if (millis() - lastGenerationTime >= generationInterval) {
      generateNextGeneration();
      lastGenerationTime = millis();
    }
  }

  drawBaseline();
  drawHistory();

  if (history.length > 0) {
    drawSignalLine(history[0]);
  }

  drawHUD();
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

  let points = buildLineFromString(currentString);
  saveHistory(points);

  console.log("Generation", generationCount, currentString);
}

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

  // fallback
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

    if (symbol === "B") {
      targetY = baselineY - 90;
    }

    if (symbol === "C") {
      targetY = baselineY + 90;
    }

    if (symbol === "D") {
      targetY = baselineY + 25;
    }

    if (symbol === "A") {
      targetY = baselineY;
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

//save history
function saveHistory(points) {
  let snapshot = [];

  for (let point of points) {
    snapshot.push({
      x: point.x,
      y: point.y,
      symbol: point.symbol,
    });
  }

  history.unshift(snapshot);

  if (history.length > maxHistory) {
    history.pop();
  }
}

//draw history
function drawHistory() {
  for (let i = 1; i < history.length; i++) {
    let points = history[i];

    let alpha = map(i, 1, maxHistory, 90, 0);

    let offset = i * historySpacing;

    drawHistoryLine(points, -offset, alpha);
    drawHistoryLine(points, offset, alpha);
  }
}

function drawHistoryLine(points, yOffset, alpha) {
  if (points.length < 2) return;

  push();

  noFill();
  stroke(60, 140, 180, alpha);
  strokeWeight(1);

  beginShape();

  for (let point of points) {
    vertex(point.x, point.y + yOffset);
  }

  endShape();

  pop();
}

function getInfluence(symbol) {
  if (symbol === "A") return 0.0;
  if (symbol === "B") return -0.9;
  if (symbol === "C") return 0.9;
  if (symbol === "D") return 0.0;

  return 0.0;
}

function getDamping(symbol) {
  if (symbol === "A") return 0.92;
  if (symbol === "B") return 0.94;
  if (symbol === "C") return 0.94;
  if (symbol === "D") return 0.72;

  return 0.9;
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

  push();

  noFill();
  stroke(0, 255, 255);
  strokeWeight(3);

  beginShape();

  for (let point of points) {
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

  pop();
}

// -------------------------
// CONTROLS
// -------------------------

function keyPressed() {
  if (key === " ") {
    isPaused = !isPaused;
    return false;
  }

  if (key === "r" || key === "R") {
    initializeString();

    let initialPoints = buildLineFromString(currentString);
    saveHistory(initialPoints);

    lastGenerationTime = millis();

    return false;
  }
}

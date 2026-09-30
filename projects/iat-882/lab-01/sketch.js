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

  previousPoints = copyPoints(initialPoints);
  targetPoints = copyPoints(initialPoints);

  saveHistory(initialPoints);

  lastGenerationTime = millis();

  console.log("Initial string:", currentString);
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

  pop();
}

// -------------------------
// CONTROLS
// -------------------------

function keyPressed() {
  // SPACE
  if (key === " ") {
    isPaused = !isPaused;

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

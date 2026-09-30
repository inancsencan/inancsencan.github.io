let axiom = "F";

const rules = {
  F: "F+F-F",
};

let currentString = axiom;

let iterations = 4;

let baselineY;
let leftMargin = 80;
let rightMargin = 80;

let fakeAmplitude = 80;
let waveSpeed = 0.04;

let history = [];
let maxHistory = 28;

// -------------------------
// L-SYSTEM
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
    nextString += applyRule(currentString[i]);
  }

  currentString = nextString;
}

function generate(iterationCount) {
  currentString = axiom;

  for (let i = 0; i < iterationCount; i++) {
    generateNextIteration();
  }

  console.log(currentString);
}

// -------------------------
// P5
// -------------------------

function setup() {
  const canvas = createCanvas(900, 600);
  canvas.parent("sketch-holder");

  colorMode(HSB, 360, 100, 100, 1);

  baselineY = height / 2;

  generate(iterations);
}

function draw() {
  background(0);

  let points = buildSignalLine();

  saveHistory(points);

  drawHistory();
  drawSignalLine(points);
}

// -------------------------
// SIGNAL LINE
// -------------------------

function buildSignalLine() {
  let points = [];

  let drawableWidth = width - leftMargin - rightMargin;

  let fCount = 0;

  for (let i = 0; i < currentString.length; i++) {
    if (currentString[i] === "F") {
      fCount++;
    }
  }

  let xStep = drawableWidth / max(1, fCount - 1);

  let x = leftMargin;
  let phaseOffset = 0;

  for (let i = 0; i < currentString.length; i++) {
    let symbol = currentString[i];

    if (symbol === "+") {
      phaseOffset += 0.8;
    }

    if (symbol === "-") {
      phaseOffset -= 0.8;
    }

    if (symbol === "F") {
      let wave = sin(frameCount * waveSpeed + phaseOffset) * fakeAmplitude;

      points.push({
        x: x,
        y: baselineY + wave,
      });

      x += xStep;
    }
  }

  return points;
}

// -------------------------
// DRAW CURRENT LINE
// -------------------------

function drawSignalLine(points) {
  noFill();

  stroke(190, 80, 100);
  strokeWeight(3);

  beginShape();

  for (let point of points) {
    vertex(point.x, point.y);
  }

  endShape();
}

// -------------------------
// HISTORY / FADE
// -------------------------

function saveHistory(points) {
  let snapshot = [];

  for (let point of points) {
    snapshot.push({
      x: point.x,
      y: point.y,
    });
  }

  history.unshift(snapshot);

  if (history.length > maxHistory) {
    history.pop();
  }
}

function drawHistory() {
  for (let i = 0; i < history.length; i++) {
    let points = history[i];

    let alpha = map(i, 0, maxHistory, 0.35, 0);

    let verticalOffset = i * 4;

    // Upper echo
    drawEcho(points, -verticalOffset, alpha);

    // Lower echo
    drawEcho(points, verticalOffset, alpha);
  }
}

function drawEcho(points, yOffset, alpha) {
  noFill();

  stroke(220, 60, 100, alpha);
  strokeWeight(1);

  beginShape();

  for (let point of points) {
    vertex(point.x, point.y + yOffset);
  }

  endShape();
}

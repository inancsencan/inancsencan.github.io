let axiom = "F--F--F";
let angle = 60;
let segmentLength = 5;

const rules = {
  F: "F+F--F+F",
};

let currentString = axiom;

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
}

function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");

  background(0);
  stroke(255);
  strokeWeight(2);

  generate(4);

  drawLSystem(currentString);
}

function drawLSystem(sequence) {
  translate(width / 2, height / 2);

  for (let i = 0; i < sequence.length; i++) {
    let symbol = sequence[i];

    if (symbol === "F") {
      line(0, 0, segmentLength, 0);
      translate(segmentLength, 0);
    }

    if (symbol === "+") {
      rotate(radians(angle));
    }

    if (symbol === "-") {
      rotate(radians(-angle));
    }
  }
}

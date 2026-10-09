console.log("This will get weird very soon, believe me!");

let fakeCanvasX;
let fakeCanvasY;
let fakeCanvasSize;

let contentWidth;
let contentX;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // draw fake canvas
  fakeCanvas();

  // resize canvas if page is too small for the fake canvas to fit the page
  const pageHeight = fakeCanvasY + fakeCanvasSize + 300;
  resizeCanvas(windowWidth, max(windowHeight, pageHeight), true);
}

function draw() {
  background("#1f1e1e");

  drawFakePage();
}

// function to draw the fake canvas and resize the window accordingly
function fakeCanvas() {
  // check whichever is minimum (window or fake frame)
  contentWidth = min(704, windowWidth - 40);

  // center the page content
  contentX = (windowWidth - contentWidth) / 2;

  // resize the fake canvas accordingly
  fakeCanvasX = contentX;
  fakeCanvasSize = min(800, contentWidth);
  fakeCanvasY = 276;
}

// make a convincing fake page
function drawFakePage() {
  // Header
  noStroke();
  fill("#f8f6f6");
  textAlign(LEFT, BASELINE);
  textSize(16);
  textStyle(BOLD);
  text("Inanc", contentX, 56);

  textStyle(NORMAL);
  fill("#8c8c8e");
  textSize(14);
  textAlign(RIGHT, BASELINE);
  text("Home", contentX + contentWidth - 86, 56);
  text("Projects", contentX + contentWidth, 56);

  stroke("#e19f2c");
  strokeWeight(1);
  line(contentX, 80, contentX + contentWidth, 80);

  // Page content
  noStroke();
  fill("#8c8c8e");
  textAlign(LEFT, BASELINE);
  textSize(13);
  text("← IAT 806", contentX, 119);

  fill("#f8f6f6");
  const title = "Lab 02 — Interactive Drawing";
  let titleSize = 40;

  textStyle(BOLD);
  textSize(titleSize);

  while (textWidth(title) > contentWidth && titleSize > 24) {
    titleSize -= 1;
    textSize(titleSize);
  }

  text(title, contentX, 174);

  fill("#8c8c8e");
  textSize(17);
  textStyle(NORMAL);
  text("Creating interactive visuals with p5.js.", contentX, 230);

  fill(0);
  rect(fakeCanvasX, fakeCanvasY, fakeCanvasSize, fakeCanvasSize);

  // Notes and the return link follow the canvas, as on the original page.
  noStroke();
  fill("#f8f6f6");
  textSize(21);
  textStyle(BOLD);
  text("Notes", contentX, fakeCanvasY + fakeCanvasSize + 52);

  fill("#f8f6f6");
  textSize(14);
  textStyle(NORMAL);
  textLeading(17.5);

  text(
    "I made the circle go along the X-axis and bounce back when it hits the edge of the canvas. The circle's Y position is controlled by the mouse's Y position. I also added a feature where the circle changes color every second to a random color. Circle radius increases according to its distance to the edges of the canvas, in a square ratio. Additionally, when mouse is pressed, the travel direction of the circle is reversed. I also added a vertical line to visualize the movement. Background refreshes gradually to create a fading effect.",
    contentX,
    fakeCanvasY + fakeCanvasSize + 80,
    contentWidth,
  );

  fill("#e19f2c");
  textSize(13);
  text("← Back to IAT 806", contentX, fakeCanvasY + fakeCanvasSize + 225);
}

// update canvas when window is resized
function windowResized() {
  fakeCanvas();
}

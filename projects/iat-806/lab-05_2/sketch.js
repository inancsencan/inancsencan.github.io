console.log("Particle Painting");

// Global variables
let balls = [];
let ballsPerFrame = 5;

// Mouse interaction states
let isPainting = false;
let isStirring = false;
let isSwirling = false;

// Brush colors
let brushColor;
let targetBrushColor;

// Separate layer to store the painting
let paintLayer;

function setup() {
  let canvas = createCanvas(800, 800);

  // Hide the mouse cursor over the canvas
  canvas.elt.style.cursor = "none";
  // Prevent right-click context menu
  canvas.elt.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });
  // Prevent middle-click auto-scrolling
  canvas.elt.addEventListener("auxclick", function (event) {
    if (event.button === 1) {
      event.preventDefault();
    }
  });

  // Create a separate layer for painting
  paintLayer = createGraphics(width, height);

  // Set the painting background
  paintLayer.background(20);

  // Initialize brush colors
  brushColor = lerpColor(
    color(random(255), random(255), random(255)),
    color(255),
    0.6,
  );

  targetBrushColor = lerpColor(
    color(random(255), random(255), random(255)),
    color(255),
    0.6,
  );

  background(20);
}

function draw() {
  // Generate a new target color every 60 frames
  if (frameCount % 60 === 0) {
    targetBrushColor = lerpColor(
      color(random(255), random(255), random(255)),
      color(255),
      0.0,
    );
  }

  // Gradually transition between colors
  brushColor = lerpColor(brushColor, targetBrushColor, 0.01);

  // Create new balls while LMB is pressed
  if (isPainting) {
    for (let i = 0; i < ballsPerFrame; i++) {
      let ballX = mouseX;
      let ballY = mouseY;
      let ballColor = brushColor;
      let ballR = 5;
      let ballSpeed = 2;

      let ball = new Ball(ballX, ballY, ballColor, ballR, ballSpeed);
      balls.push(ball);
    }
  }

  // Update all existing balls
  for (let ball of balls) {
    ball.update();
  }

  // Display the painting on the main canvas
  image(paintLayer, 0, 0);

  // Check whether the mouse is inside the canvas
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    // Draw a preview of the current brush color
    fill(brushColor);
    stroke(255);
    strokeWeight(1);
    circle(mouseX, mouseY, 20);
  }
}

// Ball class
class Ball {
  constructor(x, y, c, r, s) {
    // Ball attributes
    this.x = x;
    this.y = y;
    this.color = c;
    this.r = r;

    // Initial velocity
    this.xDir = random(-s, s);
    this.yDir = random(-s, s);
  }

  // Update ball behaviors
  update() {
    // Drag with RMB
    if (isStirring) {
      this.dragWithMouse(0.05, 150);
    } else {
      this.dragWithMouse(0, 80);
    }

    // Swirl with MMB
    if (isSwirling) {
      this.stir(0.2);
    } else {
      this.stir(0);
    }

    // Apply friction, movement, and growth
    this.slowDown(0.99);
    this.move();
    this.grow(0.08, 15);

    // Draw the ball
    this.show();
  }

  // Gradually reduce velocity until the ball stops
  slowDown(friction) {
    this.xDir *= friction;
    this.yDir *= friction;

    if (abs(this.xDir) < 0.01) {
      this.xDir = 0;
    }

    if (abs(this.yDir) < 0.01) {
      this.yDir = 0;
    }
  }

  // Gradually increase size up to a maximum
  grow(amount, maxSize) {
    this.r += amount;
    this.r = min(this.r, maxSize);
  }

  // Move nearby balls in a circular motion
  stir(strength) {
    let dx = this.x - mouseX;
    let dy = this.y - mouseY;
    let d = dist(this.x, this.y, mouseX, mouseY);

    let radius = 120;

    if (d > 0 && d < radius) {
      let influence = 1 - d / radius;

      // Perpendicular direction for circular movement
      let stirX = -dy / d;
      let stirY = dx / d;

      this.xDir += stirX * strength * influence;
      this.yDir += stirY * strength * influence;
    }
  }

  // Pull nearby balls in the direction of mouse movement
  dragWithMouse(strength, radius) {
    let d = dist(this.x, this.y, mouseX, mouseY);

    if (d < radius) {
      // Calculate mouse movement
      let mouseDX = mouseX - pmouseX;
      let mouseDY = mouseY - pmouseY;

      // Limit sudden movements
      mouseDX = constrain(mouseDX, -20, 20);
      mouseDY = constrain(mouseDY, -20, 20);

      // Stronger influence closer to the mouse
      let influence = 1 - d / radius;

      // Apply force to velocity
      this.xDir += mouseDX * strength * influence;
      this.yDir += mouseDY * strength * influence;
    }
  }

  // Update position using velocity
  move() {
    this.x += this.xDir;
    this.y += this.yDir;
  }

  // Draw the ball on the painting layer
  show() {
    if (this.xDir != 0 && this.yDir != 0) {
      paintLayer.noStroke();
      paintLayer.fill(this.color);
      paintLayer.circle(this.x, this.y, this.r);
    }
  }
}

// Activate mouse interactions
function mousePressed(event) {
  if (event.button === 0) {
    isPainting = true;
  }

  if (event.button === 1) {
    isSwirling = true;
  }

  if (event.button === 2) {
    isStirring = true;
  }

  return false;
}

// Deactivate mouse interactions
function mouseReleased(event) {
  if (event.button === 0) {
    isPainting = false;
  }

  if (event.button === 1) {
    isSwirling = false;
  }

  if (event.button === 2) {
    isStirring = false;
  }

  return false;
}

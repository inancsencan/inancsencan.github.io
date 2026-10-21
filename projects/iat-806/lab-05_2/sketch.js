console.log("Particle Inertia");

// Store all the balls in an array
let balls = [];

// Number of balls created per frame
let ballsPerFrame = 5;

// States. Just states.
let isPainting = false;
let isStirring = false;

function setup() {
  // Create the canvas
  let canvas = createCanvas(800, 800);

  // Prevent the right-click menu from appearing over the canvas
  canvas.elt.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  // Set the initial background color
  background(20);
}

function draw() {
  // Draw a transparent background to create fading trails
  background(20, 10);

  // Create new balls only while the left mouse button is pressed
  if (isPainting) {
    // Create a fixed number of balls every frame
    for (let i = 0; i < ballsPerFrame; i++) {
      // New balls start at the mouse position
      let ballX = mouseX;
      let ballY = mouseY;

      // Give each ball a random color
      let ballColor = color(random(255), random(255), random(255));

      // Define the diameter and initial speed
      let ballR = 3;
      let ballSpeed = 2;

      // Create a new ball object
      let ball = new Ball(ballX, ballY, ballColor, ballR, ballSpeed);

      // Add the new ball to the array
      balls.push(ball);
    }
  }

  // Update every ball, including older ones
  for (let ball of balls) {
    ball.update();
  }
}

// Blueprint for creating individual balls
class Ball {
  constructor(x, y, c, r, s) {
    // Store the ball's initial attributes
    this.x = x;
    this.y = y;
    this.color = c;
    this.r = r;
    this.s = s;

    // Give each ball a random initial velocity
    this.xDir = random(-s, s);
    this.yDir = random(-s, s);
  }

  // Run the ball's behaviors every frame
  update() {
    // Apply the stirring force only when RMB is pressed
    this.stir(isStirring ? 0.2 : 0);

    // Gradually reduce velocity
    this.slowDown(0.98);

    // Update position
    this.move();

    // Draw the ball
    this.show();
  }

  // Reduce the ball's velocity through friction
  slowDown(friction) {
    // Multiply the velocity by a friction factor
    this.xDir *= friction;
    this.yDir *= friction;

    // Stop very small movements completely
    if (abs(this.xDir) < 0.01) {
      this.xDir = 0;
    }

    if (abs(this.yDir) < 0.01) {
      this.yDir = 0;
    }
  }

  // Stir nearby particles in a circular motion around the mouse
  stir(strength) {
    // Calculate the distance from the ball to the mouse
    let dx = this.x - mouseX;
    let dy = this.y - mouseY;
    let d = dist(this.x, this.y, mouseX, mouseY);

    // Define the area affected by the stirring
    let radius = 120;

    // Only affect balls inside the stirring area
    if (d > 0 && d < radius) {
      // Make the force stronger near the mouse
      let influence = 1 - d / radius;

      // Calculate the direction perpendicular to the mouse-ball line
      let stirX = -dy / d;
      let stirY = dx / d;

      // Add the stirring force to the ball's velocity
      this.xDir += stirX * strength * influence;
      this.yDir += stirY * strength * influence;
    }
  }

  // Move the ball according to its current velocity
  move() {
    this.x += this.xDir;
    this.y += this.yDir;
  }

  // Draw the ball on the canvas
  show() {
    noStroke();
    fill(this.color);
    circle(this.x, this.y, this.r);
  }
}

// Track which mouse button is pressed
function mousePressed(event) {
  if (event.button === 0) {
    isPainting = true;
  }

  if (event.button === 2) {
    isStirring = true;
  }

  return false;
}

// Stop the corresponding interaction when released
function mouseReleased(event) {
  if (event.button === 0) {
    isPainting = false;
  }

  if (event.button === 2) {
    isStirring = false;
  }

  return false;
}

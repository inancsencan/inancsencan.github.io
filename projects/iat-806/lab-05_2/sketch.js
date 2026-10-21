console.log("Particle Inertia");

// Store all the balls in an array
let balls = [];

// Number of balls created per frame
let ballsPerFrame = 5;

function setup() {
  // Create the canvas
  createCanvas(800, 800);

  // Set the initial background color
  background(20);
}

function draw() {
  // Draw a transparent background to create fading trails
  background(20, 10);

  // Create new balls only while the left mouse button is pressed
  if (mouseIsPressed) {
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
    this.slowDown(0.98);
    this.move();
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

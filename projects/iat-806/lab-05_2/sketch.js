//our general list of balls
let balls = [];

//speed of ball generation
let ballsPerSecond = 100;

//counter to use later
let spawnCounter = 0;

function setup() {
  createCanvas(800, 800);
  background(20);
}

function draw() {
  background(20, 10);

  // Create new balls while the mouse is pressed
  if (mouseIsPressed) {
    background(120, 50);
    let ballColor = color(random(255), random(255), random(255));
    let ball = new Ball(mouseX, mouseY, ballColor, 3, 2);

    balls.push(ball);
  }

  // Update all existing balls
  for (let ball of balls) {
    ball.update();
  }
}

class Ball {
  constructor(x, y, c, r, s) {
    this.x = x;
    this.y = y;
    this.color = c;
    this.r = r;
    this.s = s;
    this.xDir = random(-s, s);
    this.yDir = random(-s, s);
    this.personality = random([-1, 1]);
  }

  update() {
    this.move();
    this.reactToMouse(0.05);
    this.show();
    //this.reset();
  }

  move() {
    this.x += this.xDir;
    this.y += this.yDir;
  }

  show() {
    noStroke();
    fill(this.color);
    circle(this.x, this.y, this.r);
  }

  reset() {
    if (this.x > width || this.x < 0 || this.y > height || this.y < 0) {
      this.x = mouseX;
      this.y = mouseY;
    }
  }

  // Moves the ball toward or away from the mouse
  // depending on its personality.
  reactToMouse(strength) {
    let dx = mouseX - this.x;
    let dy = mouseY - this.y;

    this.x += dx * strength * this.personality;
    this.y += dy * strength * this.personality;
  }
}

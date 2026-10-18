console.log("what are you??");

let balls = [];
let numBalls = 2000;

async function setup() {
  createCanvas(800, 800);

  for (let i = 0; i < numBalls; i++) {
    let ballX = 400;
    let ballY = 500;
    let ballColor = color(random(255), random(255), random(255));
    let ballR = 8;
    let ballSpeed = 10;
    let ball = new Ball(ballX, ballY, ballColor, ballR, ballSpeed);
    balls.push(ball);
  }
}

function draw() {
  background(20);

  for (let ball of balls) {
    ball.move();
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
  }

  update() {
    this.move();
    this.show();
    this.reset();
  }

  move() {
    // move the ball
    this.x += this.xDir;
    this.y += this.yDir;
  }
  // methods: functions inside classes
  show() {
    // draw the ball
    let speed2 = map(
      Math.abs(this.xDir * this.yDir),
      0,
      this.s * this.s,
      0,
      255,
    );
    fill(speed2);
    circle(this.x, this.y, this.r);
  }

  reset() {
    if (this.x > width || this.x < 0 || this.y > height || this.y < 0) {
      this.x = mouseX;
      this.y = mouseY;
    }
  }
}

function mousePressed() {
  //resizeCanvas(mouseX, mouseY);
}

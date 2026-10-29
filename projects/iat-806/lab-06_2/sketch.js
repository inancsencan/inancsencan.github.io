//single ball used for initial testing, maybe use for debugging later
let ball1;

let myBalls = [];
let ballCount = 1000;
let randomColor;
let initColor;
let growColor;
let shrinkColor;

function setup() {
  initColor = color(255, 255, 255);
  growColor = color(255, 0, 0);
  shrinkColor = color(0, 0, 255);
  createCanvas(600, 600);

  for (let i = 0; i < ballCount; i++) {
    ball1 = createRandomBall();
    myBalls.push(ball1);
  }
}

function draw() {
  background(0);

  for (let i = 0; i < ballCount; i++) {
    myBalls[i].update(5, myBalls[i].c, "neutral");
  }
  //older code for single ball testing
  /* if (ball1) {
    if (mouseX < width / 2 - 50) {
      ball1.update(5, growColor, "growing");
    } else if (mouseX >= width / 2 - 50 && mouseX < width / 2 + 50) {
      ball1.update(5, ball1.c, "neutral");
    } else {
      ball1.update(5, shrinkColor, "shrinking");
    }
  } */
}

function createRandomBall() {
  let posX = random(0, width);
  let posY = random(0, height);
  let randomC = color(random(0, 255), random(0, 255), random(0, 255));
  let ballT = new Ball(posX, posY, 5, randomC);
  return ballT;
}

/* function mousePressed() {
  ball1 = new Ball(width / 2, height / 2, 50, initColor);
} */

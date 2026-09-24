console.log("I believe I can do this.. maybe..??");

let circleX = 400;
let circleY = 400;
let directionX = 1;
let speedX = 5;
let circleSize = 100;

function setup() {
  createCanvas(800, 800);
}

function draw() {
  background(20, 20, 20, 20);
  fill(255, 0, 0);
  stroke(255);
  strokeWeight(4);
  let circleY = mouseY;
  let radius = circleSize / 2;
  line(circleX, 0, circleX, height);
  circle(circleX, circleY, circleSize);
  if (circleX >= width - radius || circleX <= radius) {
    directionX = directionX * -1;
  }

  circleX = circleX + directionX * speedX;
}

function mousePressed() {
  //circleX = 0;
  directionX = directionX * -1;
}

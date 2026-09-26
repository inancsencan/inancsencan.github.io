console.log("I believe I can do this.. maybe..??");

let circleX = 400;
let circleY = 400;
let directionX = 1;
let speedX = 5;
let circleSize = 100;
let sizeVariation;

function setup() {
  createCanvas(800, 800);
}

function draw() {
  background(20, 20, 20, 20);
  stroke(255);
  strokeWeight(4);
  let circleY = mouseY;

  line(circleX, 0, circleX, height);
  //size variation
  sizeVariation = Math.abs((circleX - 400) / 200) ** 2 + 1;
  circle(circleX, circleY, circleSize * sizeVariation);
  let radius = (circleSize / 2) * sizeVariation;
  if (circleX >= width - radius || circleX <= radius) {
    directionX = directionX * -1;
  }

  circleX = circleX + directionX * speedX;
}

function mousePressed() {
  //circleX = 0;
  directionX = directionX * -1;
}

setInterval(function () {
  console.log("This runs every second");
  fill(random(255), random(255), random(255));
}, 1000);

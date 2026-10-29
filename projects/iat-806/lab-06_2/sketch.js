let ball1;

function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(0);
  if (ball1) {
    ball1.update(5);
  }
}

function mousePressed() {
  ball1 = new Ball(width / 2, height / 2, 50, color(255, 0, 0));
}

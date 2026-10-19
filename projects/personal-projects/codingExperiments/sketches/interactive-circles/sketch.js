let circleColor;

function setup() {
  const canvas = createCanvas(800, 600);

  // Place the canvas inside our HTML container
  canvas.parent("sketch-container");

  circleColor = color(100, 220, 230);
}

function draw() {
  background(20);

  // Draw a grid of circles
  noFill();
  stroke(70);
  strokeWeight(1);

  for (let x = 50; x < width; x += 50) {
    for (let y = 50; y < height; y += 50) {
      circle(x, y, 25);
    }
  }

  // Draw interactive circle
  noStroke();
  fill(circleColor);

  circle(mouseX, mouseY, 80);
}

function mousePressed() {
  // Only respond to clicks inside the canvas
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    circleColor = color(random(100, 255), random(100, 255), random(100, 255));
  }
}

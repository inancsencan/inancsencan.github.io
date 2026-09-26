console.log(
  "I know this is the worst way to do this :D but I will revisit this when we learn arrays and objects. I will also add more balls to the simulation.",
);

let ball1X, ball2X, ball3X, ball4X, ball5X;
let ball1Y, ball2Y, ball3Y, ball4Y, ball5Y;
let speed1X, speed2X, speed3X, speed4X, speed5X;
let speed1Y, speed2Y, speed3Y, speed4Y, speed5Y;
let minSpeed = 3;
let maxSpeed = 10;
let radius = 50;
let scoreMultiplier = 0.1;
let score;
let playerX,
  playerY,
  playerRadius = 50;
let timer = 0;
let gameOver = false;
let backgroundImage;
let playerImage;
let ballImage;

async function setup() {
  backgroundImage = await loadImage("background.png");
  playerImage = await loadImage("player.jpg");
  ballImage = await loadImage("ball.jpg");
  const canvas = createCanvas(800, 800);
  canvas.parent("sketch-holder");
  ball1X = ball2X = ball3X = ball4X = ball5X = width / 2;
  ball1Y = ball2Y = ball3Y = ball4Y = ball5Y = height / 2;
  speed1X = speed2X = speed3X = speed4X = speed5X = 5;
  speed1Y = speed2Y = speed3Y = speed4Y = speed5Y = 5;
  score = 0;
}

function draw() {
  if (gameOver) {
    tint(110);
    image(backgroundImage, 0, 0, width, height);
    noTint();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(52);
    text("Game Over", width / 2, height / 2 - 25);
    textSize(36);
    text("Score: " + int(score), width / 2, height / 2 + 35);
    return;
  }

  //frame count
  timer = timer + 1;
  //console.log(timer);

  // Draw a dimmed image so the game elements remain easy to see.
  tint(110);
  image(backgroundImage, 0, 0, width, height);
  noTint();

  if (playerRadius < 30) {
    gameOver = true;
    return;
  }

  // move
  ball1X = ball1X + speed1X;
  ball1Y = ball1Y + speed1Y;
  ball2X = ball2X + speed2X;
  ball2Y = ball2Y + speed2Y;
  ball3X = ball3X + speed3X;
  ball3Y = ball3Y + speed3Y;
  ball4X = ball4X + speed4X;
  ball4Y = ball4Y + speed4Y;
  ball5X = ball5X + speed5X;
  ball5Y = ball5Y + speed5Y;

  //calculate distance between player and balls
  let distance1 = dist(playerX, playerY, ball1X, ball1Y);
  let distance2 = dist(playerX, playerY, ball2X, ball2Y);
  let distance3 = dist(playerX, playerY, ball3X, ball3Y);
  let distance4 = dist(playerX, playerY, ball4X, ball4Y);
  let distance5 = dist(playerX, playerY, ball5X, ball5Y);

  //increase player radius gradually if the distance is more than the sum of the radii of the player and the ball
  if (
    distance1 > playerRadius + radius &&
    distance2 > playerRadius + radius &&
    distance3 > playerRadius + radius &&
    distance4 > playerRadius + radius &&
    distance5 > playerRadius + radius
  ) {
    playerRadius = playerRadius + 0.3;
  }
  //decrease player radius gradually if the distance is less than the sum of the radii of the player and the ball
  if (
    distance1 < playerRadius + radius ||
    distance2 < playerRadius + radius ||
    distance3 < playerRadius + radius ||
    distance4 < playerRadius + radius ||
    distance5 < playerRadius + radius
  ) {
    playerRadius = playerRadius - 1 * (timer / 500);
  }

  //score based on time * player, additively
  let scoreAdd = playerRadius * scoreMultiplier;
  score = score + scoreAdd;
  fill(255);
  textSize(32);
  textAlign(RIGHT, TOP);
  text("Score: " + int(score), width - 20, 20);

  if (playerRadius < 30) {
    gameOver = true;
  }

  // draw player
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(playerX, playerY, playerRadius, 0, TWO_PI);
  drawingContext.clip();
  image(
    playerImage,
    playerX - playerRadius,
    playerY - playerRadius,
    playerRadius * 2,
    playerRadius * 2,
  );
  drawingContext.restore();
  noFill();
  stroke(255);
  strokeWeight(3);
  circle(playerX, playerY, playerRadius * 2);
  noStroke();
  playerX = mouseX;
  playerY = mouseY;

  // bounce off the left and right walls, and flip growing/shrinking
  if (ball1X >= width - radius || ball1X < radius) {
    speed1X = speed1X * -1;
    speed1X = speed1X * random(0.5, 1.5);
    speed1Y = speed1Y * random(-0.5, 1.5);
  }
  if (ball2X >= width - radius || ball2X < radius) {
    speed2X = speed2X * -1;
    speed2X = speed2X * random(0.5, 1.5);
    speed2Y = speed2Y * random(-0.5, 1.5);
  }
  if (ball3X >= width - radius || ball3X < radius) {
    speed3X = speed3X * -1;
    speed3X = speed3X * random(0.5, 1.5);
    speed3Y = speed3Y * random(-0.5, 1.5);
  }
  if (ball4X >= width - radius || ball4X < radius) {
    speed4X = speed4X * -1;
    speed4X = speed4X * random(0.5, 1.5);
    speed4Y = speed4Y * random(-0.5, 1.5);
  }
  if (ball5X >= width - radius || ball5X < radius) {
    speed5X = speed5X * -1;
    speed5X = speed5X * random(0.5, 1.5);
    speed5Y = speed5Y * random(-0.5, 1.5);
  }

  // bounce off the top and bottom walls
  if (ball1Y >= height - radius || ball1Y < radius) {
    speed1Y = speed1Y * -1;
    speed1X = speed1X * random(-0.5, 1.5);
    speed1Y = speed1Y * random(0.5, 1.5);
  }
  if (ball2Y >= height - radius || ball2Y < radius) {
    speed2Y = speed2Y * -1;
    speed2X = speed2X * random(-0.5, 1.5);
    speed2Y = speed2Y * random(0.5, 1.5);
  }
  if (ball3Y >= height - radius || ball3Y < radius) {
    speed3Y = speed3Y * -1;
    speed3X = speed3X * random(-0.5, 1.5);
    speed3Y = speed3Y * random(0.5, 1.5);
  }
  if (ball4Y >= height - radius || ball4Y < radius) {
    speed4Y = speed4Y * -1;
    speed4X = speed4X * random(-0.5, 1.5);
    speed4Y = speed4Y * random(0.5, 1.5);
  }
  if (ball5Y >= height - radius || ball5Y < radius) {
    speed5Y = speed5Y * -1;
    speed5X = speed5X * random(-0.5, 1.5);
    speed5Y = speed5Y * random(0.5, 1.5);
  }

  //max speed limits
  if (speed1X > maxSpeed) {
    speed1X = maxSpeed;
  }
  if (speed1X < -maxSpeed) {
    speed1X = -maxSpeed;
  }
  if (speed1Y > maxSpeed) {
    speed1Y = maxSpeed;
  }
  if (speed1Y < -maxSpeed) {
    speed1Y = -maxSpeed;
  }
  if (speed2X > maxSpeed) {
    speed2X = maxSpeed;
  }
  if (speed2X < -maxSpeed) {
    speed2X = -maxSpeed;
  }
  if (speed2Y > maxSpeed) {
    speed2Y = maxSpeed;
  }
  if (speed2Y < -maxSpeed) {
    speed2Y = -maxSpeed;
  }
  if (speed3X > maxSpeed) {
    speed3X = maxSpeed;
  }
  if (speed3X < -maxSpeed) {
    speed3X = -maxSpeed;
  }
  if (speed3Y > maxSpeed) {
    speed3Y = maxSpeed;
  }
  if (speed3Y < -maxSpeed) {
    speed3Y = -maxSpeed;
  }
  if (speed4X > maxSpeed) {
    speed4X = maxSpeed;
  }
  if (speed4X < -maxSpeed) {
    speed4X = -maxSpeed;
  }
  if (speed4Y > maxSpeed) {
    speed4Y = maxSpeed;
  }
  if (speed4Y < -maxSpeed) {
    speed4Y = -maxSpeed;
  }
  if (speed5X > maxSpeed) {
    speed5X = maxSpeed;
  }
  if (speed5X < -maxSpeed) {
    speed5X = -maxSpeed;
  }
  if (speed5Y > maxSpeed) {
    speed5Y = maxSpeed;
  }
  if (speed5Y < -maxSpeed) {
    speed5Y = -maxSpeed;
  }

  //min speed limits
  if (speed1X < minSpeed && speed1X > 0) {
    speed1X = minSpeed;
  }
  if (speed1Y < minSpeed && speed1Y > 0) {
    speed1Y = minSpeed;
  }
  if (speed1X > -minSpeed && speed1X < 0) {
    speed1X = -minSpeed;
  }
  if (speed1Y > -minSpeed && speed1Y < 0) {
    speed1Y = -minSpeed;
  }
  if (speed2X < minSpeed && speed2X > 0) {
    speed2X = minSpeed;
  }
  if (speed2Y < minSpeed && speed2Y > 0) {
    speed2Y = minSpeed;
  }
  if (speed2X > -minSpeed && speed2X < 0) {
    speed2X = -minSpeed;
  }
  if (speed2Y > -minSpeed && speed2Y < 0) {
    speed2Y = -minSpeed;
  }
  if (speed3X < minSpeed && speed3X > 0) {
    speed3X = minSpeed;
  }
  if (speed3Y < minSpeed && speed3Y > 0) {
    speed3Y = minSpeed;
  }
  if (speed3X > -minSpeed && speed3X < 0) {
    speed3X = -minSpeed;
  }
  if (speed3Y > -minSpeed && speed3Y < 0) {
    speed3Y = -minSpeed;
  }
  if (speed4X < minSpeed && speed4X > 0) {
    speed4X = minSpeed;
  }
  if (speed4Y < minSpeed && speed4Y > 0) {
    speed4Y = minSpeed;
  }
  if (speed4X > -minSpeed && speed4X < 0) {
    speed4X = -minSpeed;
  }
  if (speed4Y > -minSpeed && speed4Y < 0) {
    speed4Y = -minSpeed;
  }
  if (speed5X < minSpeed && speed5X > 0) {
    speed5X = minSpeed;
  }
  if (speed5Y < minSpeed && speed5Y > 0) {
    speed5Y = minSpeed;
  }
  if (speed5X > -minSpeed && speed5X < 0) {
    speed5X = -minSpeed;
  }
  if (speed5Y > -minSpeed && speed5Y < 0) {
    speed5Y = -minSpeed;
  }

  //initiate balls
  if (timer > 0) {
    drawTexturedBall(ball1X, ball1Y, 255, 0, 0);
  }
  if (timer > 100) {
    drawTexturedBall(ball2X, ball2Y, 0, 0, 255);
  }
  if (timer > 200) {
    drawTexturedBall(ball3X, ball3Y, 255, 255, 0);
  }
  if (timer > 300) {
    drawTexturedBall(ball4X, ball4Y, 0, 255, 0);
  }
  if (timer > 400) {
    drawTexturedBall(ball5X, ball5Y, 255, 0, 255);
  }
}

function drawTexturedBall(x, y, redValue, greenValue, blueValue) {
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(x, y, radius, 0, TWO_PI);
  drawingContext.clip();
  tint(redValue, greenValue, blueValue);
  image(ballImage, x - radius, y - radius, radius * 2, radius * 2);
  noTint();
  drawingContext.restore();
  noFill();
  stroke(redValue, greenValue, blueValue);
  strokeWeight(3);
  circle(x, y, radius * 2);
  noStroke();
}

function mousePressed() {
  //mousePressed
}

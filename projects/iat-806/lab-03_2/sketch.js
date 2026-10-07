let backgroundImage;
let snd;

let started = false;
let paused = false;

let timeFrame = 0;

// intro animation timing
let danceStart = 1000;

// List of characters
let characters = ["luffy", "nami", "zoro", "sanji", "robin"];

let currentCharacter = 0;

async function setup() {
  createCanvas(500, 400);

  backgroundImage = await loadImage("background.png");
  snd = await loadSound("sounds/sound0.mp3");
}

function draw() {
  background(0);

  // Draw start screen
  if (!started) {
    drawStartScreen();
    return;
  }

  if (!paused) {
    // Intro / dance switch
    if (timeFrame < danceStart) {
      drawIntro();
    } else {
      drawDance();
    }
  }
  // Draw pause screen
  else {
    drawPauseScreen();
  }

  // Draw frame count
  fill(120);
  textAlign(LEFT, TOP);
  textSize(12);
  text("Frame Count: " + timeFrame, 10, 10);
}

// Start screen

function drawStartScreen() {
  background(20);

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(24);
  text("PRESS P TO PLAY", width / 2, height / 2);
}

// Intro animation

function drawIntro() {
  tint(180);
  image(backgroundImage, 0, 0, width, height);
  noTint();

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(28);
  text("INTRO", width / 2, height / 2);

  timeFrame++;
}

// DANCE!

function drawDance() {
  background(255);

  let characterName = characters[currentCharacter];

  fill(0);
  textAlign(CENTER, CENTER);

  textSize(40);
  text("DANCE MODE", width / 2, 110);

  textSize(32);
  text(characterName.toUpperCase(), width / 2, 190);

  textSize(16);
  text("LEFT / RIGHT ARROW", width / 2, 250);

  timeFrame++;
}

// Pause screen

function drawPauseScreen() {
  fill(0, 160);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(28);
  text("PAUSED", width / 2, height / 2);
}

// Key actions
function keyPressed() {
  // P = PLAY / PAUSE
  if (key === "p" || key === "P") {
    if (!started) {
      started = true;
      paused = false;
      snd.play();
    } else if (!paused) {
      paused = true;
      snd.pause();
    } else {
      paused = false;
      snd.play();
    }
    return false;
  }

  if (started && timeFrame >= danceStart) {
    // RIGHT ARROW
    if (key === "ArrowRight") {
      currentCharacter++;

      if (currentCharacter >= characters.length) {
        currentCharacter = 0;
      }

      console.log("character:", characters[currentCharacter]);
    }

    // LEFT ARROW
    if (key === "ArrowLeft") {
      currentCharacter--;

      if (currentCharacter < 0) {
        currentCharacter = characters.length - 1;
      }

      console.log("character:", characters[currentCharacter]);
    }
  }

  return false;
}

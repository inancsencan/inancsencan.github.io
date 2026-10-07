let backgroundImage;
let logoImage;
let snd;

let started = false;
let paused = false;

let timeFrame = 0;
let animationSpeed = 11;
let currentTintStep = -1;
let currentBackgroundTint = [255, 255, 255];

// intro animation timing
let danceStart = 1000;

// frames list
let characterFrames = {};

// List of characters
let characters = ["luffy", "nami", "zoro", "sanji", "robin"];

let currentCharacter = 0;

async function setup() {
  createCanvas(1000, 800);

  backgroundImage = await loadImage("background.png");
  logoImage = await loadImage("logo.png");
  snd = await loadSound("sounds/sound0.mp3");
  snd.loop(true);

  //load character frames
  for (let character of characters) {
    characterFrames[character] = await loadCharacterFrames(character, 8);
  }
}

function draw() {
  //background(0);

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
  /* fill(120);
  textAlign(LEFT, TOP);
  textSize(12);
  text("Frame Count: " + timeFrame, 10, 10); */
}

// Load character frames
async function loadCharacterFrames(characterName, frameTotal) {
  let loadedFrames = [];

  for (let i = 1; i <= frameTotal; i++) {
    let number = String(i).padStart(2, "0");
    let path = `frames/${characterName}/${number}.png`;

    loadedFrames.push(await loadImage(path));
  }

  return loadedFrames;
}

function applyRandomTint(minimumChannel, holdFrames) {
  let tintStep = floor(timeFrame / holdFrames);

  if (tintStep !== currentTintStep) {
    currentBackgroundTint = [
      random(minimumChannel, 255),
      random(minimumChannel, 255),
      random(minimumChannel, 255),
    ];
    currentTintStep = tintStep;
  }

  tint(...currentBackgroundTint);
}

// Draw logo
function drawLogo() {
  let logoWidth = 700;
  let logoHeight = (logoImage.height * logoWidth) / logoImage.width;
  image(
    logoImage,
    (width - logoWidth) / 2,
    (height - logoHeight) / 2,
    logoWidth,
    logoHeight,
  );
}
// Start screen

function drawStartScreen() {
  image(backgroundImage, 0, 0, width, height);
  drawLogo();

  push();
  rectMode(CENTER);
  noStroke();
  fill(0, 160);
  rect(width / 2, 700, 370, 62, 8);

  stroke(20, 220);
  strokeWeight(6);
  fill(255, 225, 135);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(28);
  text("TAP OR PRESS P TO PLAY", width / 2, 700);
  pop();
}

// Intro animation

function drawIntro() {
  // Draw background with tint effect
  applyRandomTint(160, 90);
  image(backgroundImage, 0, 0, width, height);
  noTint();

  // Draw logo
  drawLogo();

  // Draw progress bar
  let barWidth = 500;
  let barHeight = 14;
  let barX = (width - barWidth) / 2;
  let barY = height - 60;
  let progress = constrain((timeFrame + 1) / danceStart, 0, 1);

  noStroke();
  fill(0, 150);
  rect(barX, barY, barWidth, barHeight);
  fill(255);
  rect(barX, barY, barWidth * progress, barHeight);

  push();
  stroke(0, 180);
  strokeWeight(4);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("Use arrow keys to change character", width / 2, height - 22);
  pop();

  timeFrame++;
}

// DANCE!
function drawDance() {
  let characterName = characters[currentCharacter];

  // Active character
  let frames = characterFrames[characterName];

  // Pick animation frame
  let animationFrame = floor(timeFrame / animationSpeed) % frames.length;

  // Bounce
  let bounce = abs(sin(timeFrame * 0.15)) * 30;

  push();
  translate(0, -bounce);

  // Draw background with a stronger tint effect
  applyRandomTint(0, 15);
  imageMode(CENTER);
  image(backgroundImage, width / 2, height / 2, width * 1.1, height * 1.1);
  imageMode(CORNER);
  noTint();

  // Draw character animation
  image(frames[animationFrame], 350, 115);

  pop();

  // Debug for dance mode
  /* fill(255);
  textAlign(CENTER, CENTER);

  textSize(24);
  text(characterName.toUpperCase(), width / 2, 40);

  textSize(14);
  text("LEFT / RIGHT ARROW", width / 2, 370);
 */
  timeFrame++;
}

// Pause screen

function drawPauseScreen() {
  push();
  stroke(20, 220);
  strokeWeight(8);
  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(48);
  fill(255, 225, 135);
  text("PAUSED", width / 2, 700);
  pop();
}

// Key actions
function togglePlayback() {
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
}

async function togglePlaybackFromInput() {
  if (!started || paused) {
    await userStartAudio();
  }

  togglePlayback();
}

function handlePlaybackInput() {
  togglePlaybackFromInput().catch((error) => {
    console.error("Unable to start audio playback:", error);
  });

  return false;
}

function mousePressed() {
  return handlePlaybackInput();
}

function touchStarted() {
  return handlePlaybackInput();
}

function keyPressed() {
  // P = PLAY / PAUSE
  if (key === "p" || key === "P") {
    handlePlaybackInput();
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

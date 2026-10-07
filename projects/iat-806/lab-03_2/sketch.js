let backgroundImage;
let snd;

let started = false;
let paused = false;

let timeFrame = 0;
let animationSpeed = 6;

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
  snd = await loadSound("sounds/sound0.mp3");

  //load character frames
  for (let character of characters) {
    characterFrames[character] = await loadCharacterFrames(character, 8);
  }
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

  // Active character
  let frames = characterFrames[characterName];

  // Pick animation frame
  let animationFrame = floor(timeFrame / animationSpeed) % frames.length;

  // Draw character animation
  image(frames[animationFrame], 180, 115);

  // Debug for dance mode
  fill(0);
  textAlign(CENTER, CENTER);

  textSize(24);
  text(characterName.toUpperCase(), width / 2, 40);

  textSize(14);
  text("LEFT / RIGHT ARROW", width / 2, 370);

  timeFrame++;
}

// Pause screen

function drawPauseScreen() {
  fill(0, 160);
  rect(0, 0, width, height);

  fill(255, 100);
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

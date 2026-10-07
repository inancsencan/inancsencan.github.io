let backgroundImage;
let snd;

let started = false;
let paused = false;

// intro animation timing
let danceStart = 5;

// Timeline sistemi
let playStartedAt = 0;
let accumulatedTime = 0;

// One Piece karakterleri
let characters = ["luffy", "nami", "zoro", "sanji", "robin"];

let currentCharacter = 0;

async function setup() {
  createCanvas(500, 400);

  backgroundImage = await loadImage("background.png");
  snd = await loadSound("sounds/sound0.mp3");
}

function draw() {
  background(0);

  // Henüz başlamadıysa başlangıç ekranı
  if (!started) {
    drawStartScreen();
    return;
  }

  // Kendi timeline zamanımız
  let t = getTimelineTime();

  // Intro / dance geçişi
  if (t < danceStart) {
    drawIntro(t);
  } else {
    drawDance(t);
  }

  // Pause göstergesi
  if (paused) {
    drawPauseScreen();
  }
}

// --------------------------------------------------
// TIMELINE
// --------------------------------------------------

function getTimelineTime() {
  // Pause durumundaysa zaman ilerlemez
  if (paused) {
    return accumulatedTime;
  }

  // Çalıyorsa geçen süreyi hesapla
  return accumulatedTime + (millis() - playStartedAt) / 1000;
}

// --------------------------------------------------
// START SCREEN
// --------------------------------------------------

function drawStartScreen() {
  background(20);

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(24);
  text("PRESS P TO PLAY", width / 2, height / 2);
}

// --------------------------------------------------
// INTRO
// --------------------------------------------------

function drawIntro(t) {
  tint(180);
  image(backgroundImage, 0, 0, width, height);
  noTint();

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(28);
  text("INTRO", width / 2, height / 2);

  textSize(14);
  text(t.toFixed(1) + " s", width / 2, height / 2 + 40);
}

// --------------------------------------------------
// DANCE MODE
// --------------------------------------------------

function drawDance(t) {
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

  textSize(14);
  text(t.toFixed(1) + " s", width / 2, 290);
}

// --------------------------------------------------
// PAUSE SCREEN
// --------------------------------------------------

function drawPauseScreen() {
  fill(0, 160);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(28);
  text("PAUSED", width / 2, height / 2);
}

// --------------------------------------------------
// KEYBOARD
// --------------------------------------------------

function keyPressed() {
  // P = PLAY / PAUSE
  if (key === "p" || key === "P") {
    if (!started) {
      started = true;
      paused = false;

      accumulatedTime = 0;
      playStartedAt = millis();

      snd.play();
    } else if (!paused) {
      accumulatedTime += (millis() - playStartedAt) / 1000;

      paused = true;
      snd.pause();
    } else {
      paused = false;
      playStartedAt = millis();

      snd.play();
    }

    return false;
  }

  // Sadece dance mode'da karakter değiştir
  let t = getTimelineTime();

  if (started && t >= danceStart) {
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

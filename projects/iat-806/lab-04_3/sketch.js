// IAT 806 · Lab 04 starter: the dancer grid from Week 4, ready for your website.
// Run with Live Server. Uses p5 2.x (async setup, await loadImage).

let maleDance = []; // the 8 dance poses
let femaleDance = []; // TODO: load the jump poses into this array
let maleRun = [];
let femaleRun = [];
let numFrames = 8;

let crowdAudio;
let trackAudioFiles = [];
let audioSequenceStarted = false;
let trackAudio;
let audioSequenceStartTime = null;
let backgroundFrames = [];
const backgroundFrameRate = 8;

let numCols = 30;
let numRows = 30;
let colWidth;
let rowHeight;

// crowd area
let topOffset = 180;
let sideOffset = 160;

//background image
let backgroundImage;

// 2D arrays: one color and one speed for every cell in the grid
let speeds = [];

// setting dancerGender at the beginning to keep it consistent
let dancerGender = [];
let dancerMode = [];
let dancerDirection = [];
let dancerMisdirection = [];

// scattering dancers
let dancerOffsets = [];

// mouse holding toggle
let leftMouseDown = false;
const mouseGapRadius = 120;

//crowd position variations
let varX = [];
let varY = [];
let crowdVar = 50;

async function setup() {
  // resized canvas
  const canvas = createCanvas(900, 900);
  crowdAudio = new Audio("sounds/crowd.mp3");
  trackAudioFiles = [
    "sounds/tracks/ArchEnemy - Ravenous.mp3",
    "sounds/tracks/Children Of Bodom - Are You Dead Yet.mp3",
    "sounds/tracks/Children Of Bodom - Everytime I Die000.mp3",
    "sounds/tracks/Orbit Culture - Vultures of North.mp3",
    "sounds/tracks/Orbit Culture - Saw.mp3",
  ];
  window.addEventListener("keydown", handleAudioShortcut);
  document
    .getElementById("start-audio")
    .addEventListener("click", startAudioSequence);

  // load background image
  backgroundImage = await loadImage("background.png");
  for (let i = 1; i <= 8; i++) {
    backgroundFrames.push(await loadImage("bg_frames/bg" + i + ".png"));
  }

  // puts the canvas inside <div id="sketch-holder"> in index.html
  canvas.parent("sketch-holder");

  // define distance between each character
  rowHeight = (height - topOffset) / numRows;
  colWidth = (width - sideOffset * 2) / numCols;

  for (let i = 0; i < numCols; i++) {
    // adding 2nd layers of arrays
    speeds[i] = [];
    dancerGender[i] = [];
    dancerMode[i] = [];
    dancerDirection[i] = [];
    dancerMisdirection[i] = [];
    dancerOffsets[i] = [];

    //crowd position variations turned into 2d array
    varX[i] = [];
    varY[i] = [];
    for (let j = 0; j < numRows; j++) {
      // random speeds
      speeds[i][j] = random(5, 10);

      // assign gender once, not every frame
      dancerGender[i][j] = (i + j) % 2 === 0 ? "male" : "female";

      // default mode
      dancerMode[i][j] = "dance";
      dancerDirection[i][j] = 1;
      dancerMisdirection[i][j] = random(-Math.PI / 12, Math.PI / 12);

      // dancer offset randomization
      dancerOffsets[i][j] = createVector(0, 0);
      varX[i][j] = random(-crowdVar, crowdVar);
      varY[i][j] = random(-crowdVar, crowdVar);
    }
  }

  // filling animation arrays
  for (let i = 0; i < numFrames; i++) {
    maleDance.push(await loadImage("dance_frames/male/dance" + i + ".png"));
    femaleDance.push(await loadImage("dance_frames/female/dance" + i + ".png"));
    maleRun.push(await loadImage("run_frames/male/run" + i + ".png"));
    femaleRun.push(await loadImage("run_frames/female/run" + i + ".png"));
  }
}

// mouse holding functions
function mousePressed(event) {
  leftMouseDown = event.button === 0;
}

function mouseReleased(event) {
  if (event.button === 0) {
    leftMouseDown = false;
  }
}

function handleAudioShortcut(event) {
  if (event.key.toLowerCase() === "p" && !event.repeat) {
    startAudioSequence();
  }
}

async function startAudioSequence() {
  if (audioSequenceStarted) {
    return;
  }

  audioSequenceStarted = true;
  const status = document.getElementById("audio-status");

  try {
    crowdAudio.currentTime = 0;
    await crowdAudio.play();
    audioSequenceStartTime = millis();
    status.textContent =
      "Crowd audio playing. A random track starts in 15 seconds.";

    setTimeout(
      async () => {
        crowdAudio.pause();
        const randomTrackFile = random(trackAudioFiles);
        trackAudio = new Audio(randomTrackFile);
        try {
          await trackAudio.play();
          status.textContent = "Random track playing.";
        } catch (error) {
          status.textContent =
            "The music track could not start. Check the browser console for details.";
          console.error("Unable to play the selected music track:", error);
        }
      },
      Math.max(0, 15000 - (millis() - audioSequenceStartTime)),
    );
  } catch (error) {
    audioSequenceStarted = false;
    audioSequenceStartTime = null;
    crowdAudio.pause();
    crowdAudio.currentTime = 0;
    status.textContent =
      "Audio could not start. Check the browser console for details.";
    console.error("Unable to start the audio sequence:", error);
  }
}

function draw() {
  // default background
  let currentBackground = backgroundImage;

  //animate bg images
  if (audioSequenceStartTime !== null) {
    let elapsedAfterCrowd = millis() - audioSequenceStartTime - 15000;
    if (elapsedAfterCrowd >= 0) {
      let frameIndex =
        Math.floor((elapsedAfterCrowd / 1000) * backgroundFrameRate) %
        backgroundFrames.length;
      currentBackground = backgroundFrames[frameIndex];
    }
  }
  image(currentBackground, 0, 0, width, height);

  let mousePosition = createVector(mouseX, mouseY);
  let offsetEase = 1 - Math.exp(-deltaTime / 700);
  let swayTime = millis() / 1000;
  let dancers = [];

  // scatter crowd a little randomly
  for (let i = 0; i < numCols; i++) {
    for (let j = 0; j < numRows; j++) {
      let dancerAnchor = createVector(
        sideOffset + i * colWidth + varX[i][j],
        topOffset + j * rowHeight + varY[i][j],
      );
      // picks current frame based on frame index
      let currentFrame = getCurrentFrame(i, j);
      let dancerPosition = createVector(
        dancerAnchor.x + colWidth,
        dancerAnchor.y + (colWidth * currentFrame.height) / currentFrame.width,
      );
      let mouseToDancer = p5.Vector.sub(dancerPosition, mousePosition);
      let targetOffset = createVector(0, 0);
      let distanceToMouse = mouseToDancer.mag();

      if (distanceToMouse < mouseGapRadius) {
        if (distanceToMouse === 0) {
          mouseToDancer.set(0, -1);
        }
        targetOffset = mouseToDancer.setMag(mouseGapRadius - distanceToMouse);
      }

      if (leftMouseDown && distanceToMouse < mouseGapRadius) {
        let swayPhase = swayTime * 3 + i * 0.7 + j * 1.1;
        let moshpitTarget = p5.Vector.sub(mousePosition, dancerPosition)
          .rotate(dancerMisdirection[i][j])
          .add(createVector(Math.sin(swayPhase) * 8, Math.cos(swayPhase) * 8));
        targetOffset = moshpitTarget;
      }

      let previousOffset = dancerOffsets[i][j].copy();
      dancerOffsets[i][j].lerp(targetOffset, offsetEase);
      let movementX = dancerOffsets[i][j].x - previousOffset.x;
      let movementY = dancerOffsets[i][j].y - previousOffset.y;
      let movementSpeed =
        (Math.hypot(movementX, movementY) / Math.max(deltaTime, 1)) * 1000;

      dancerMode[i][j] = movementSpeed > 8 ? "move" : "dance";
      if (Math.abs(movementX) > 0.1) {
        dancerDirection[i][j] = movementX > 0 ? 1 : -1;
      }

      let displacement = dancerOffsets[i][j].copy();
      dancers.push({
        col: i,
        row: j,
        displacement,
        yPosition: dancerPosition.y + displacement.y,
      });
    }
  }

  // sort dancers by yPosition
  dancers.sort((a, b) => a.yPosition - b.yPosition);
  for (const dancer of dancers) {
    let { col, row } = dancer;

    push();
    translate(sideOffset, topOffset);
    translate(varX[col][row], varY[col][row]);
    translate(dancer.displacement.x, dancer.displacement.y);
    animate(
      getCurrentFrame(col, row),
      col * colWidth,
      row * rowHeight,
      colWidth,
      undefined,
      dancerDirection[col][row] < 0,
    );
    pop();
  }
}

// pick current frame by action and gender
function getCurrentFrame(col, row) {
  let frames;

  if (dancerMode[col][row] === "move") {
    frames = dancerGender[col][row] === "male" ? maleRun : femaleRun;
  } else {
    frames = dancerGender[col][row] === "male" ? maleDance : femaleDance;
  }

  return frames[getFrameIndex(speeds[col][row])];
}

// draws one dancer: which pose, where, and how big
function animate(
  currentFrame,
  xPosition,
  yPosition,
  imageWidth,
  imageHeight,
  flipHorizontal = false,
) {
  let originalWidth = currentFrame.width;
  let originalHeight = currentFrame.height;
  if (imageWidth && !imageHeight) {
    //if only imageWidth is provided
    let scale = imageWidth / originalWidth;
    imageHeight = originalHeight * scale;
  } else if (!imageWidth && imageHeight) {
    //if only imageHeight is provided
    let scale = imageHeight / originalHeight;
    imageWidth = originalWidth * scale;
  } else if (!imageWidth && !imageHeight) {
    //if neither imageWidth nor imageHeight is provided
    imageWidth = originalWidth;
    imageHeight = originalHeight;
  } else {
    //if imageWidth != imageHeight, we can scale the image to fit within the specified dimensions while maintaining its aspect ratio
    let widthScale = imageWidth / originalWidth;
    let heightScale = imageHeight / originalHeight;
    let scale = Math.min(widthScale, heightScale);
    imageWidth = originalWidth * scale;
    imageHeight = originalHeight * scale;
  }

  if (flipHorizontal) {
    push();
    translate(xPosition + imageWidth, yPosition);
    scale(-1, 1);
    image(currentFrame, -imageWidth, 0, imageWidth * 2, imageHeight * 2);
    pop();
  } else {
    image(currentFrame, xPosition, yPosition, imageWidth * 2, imageHeight * 2);
  }
}

// which pose to show right now. speed = draw-frames per pose: smaller = faster
function getFrameIndex(speed) {
  let slowFrame = Math.floor(frameCount / speed);
  let index = slowFrame % numFrames;

  return index;
}

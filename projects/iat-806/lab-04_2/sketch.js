// frame arrays
let monikaDance = [];
let monikaDanceCreepy = [];
let monikaJump = [];
let monikaJumpCreepy = [];

// define images
let chatImage;
let backgroundImage;

// sound effect variables
let hoverSound;
let backgroundSound;
let lastHoveredCol = -1;
let lastHoveredRow = -1;
let audioEnabled = false;
let backgroundSoundStarted = false;

// frame count per move, might make it parametric later
let numFrames = 8;

// min and max speed
let minSpeed = 2;
let maxSpeed = 20;
// define column and row variables
let numCols = 9;
let numRows = 9;
const gridWidth = 900;
const gridHeight = 900;
const extraCanvasHeight = 200;

// dimensions of each cell
let colWidth;
let rowHeight;

let colors = [];
// track animation progress individually
let animationProgress = [];
let animationSets = [];
let lastAnimationSteps = [];

async function setup() {
  createCanvas(gridWidth, gridHeight + extraCanvasHeight);

  for (let i = 0; i < numCols; i++) {
    // create new array for each index as a 2nd dimension
    colors[i] = [];
    animationProgress[i] = [];
    animationSets[i] = [];
    lastAnimationSteps[i] = [];
    for (let j = 0; j < numRows; j++) {
      colors[i][j] = color(random(255), random(255), random(255));

      // record animation progress for each cell
      animationProgress[i][j] = 0;
      lastAnimationSteps[i][j] = -1;
    }
  }
  for (let i = 0; i < numFrames; i++) {
    // let fileName = `dance_frames/dance${i}.png`; (this also works)
    let fileName = "monika_dance/dance" + i + ".png";
    monikaDance.push(await loadImage(fileName));
    fileName = "monika_jump/jump" + i + ".png";
    monikaJump.push(await loadImage(fileName));
  }
  for (let i = 8; i < numFrames * 2; i++) {
    fileName = "monika_dance/dance" + i + ".png";
    monikaDanceCreepy.push(await loadImage(fileName));
    fileName = "monika_jump/jump" + i + ".png";
    monikaJumpCreepy.push(await loadImage(fileName));
  }

  // load images
  chatImage = await loadImage("images/chat.png");
  backgroundImage = await loadImage("images/background.png");

  // load hover sound effect
  hoverSound = await loadSound("sounds/boop.mp3");
  backgroundSound = await loadSound("sounds/dokidoki.mp3");
}

// check which cell is hovered
function getHoveredCell() {
  let hoveredCol;
  // The grid occupies only the original 900x900 area of the canvas.
  if (mouseX >= 0 && mouseX < gridWidth) {
    hoveredCol = Math.floor(mouseX / (gridWidth / numCols));
  } else {
    hoveredCol = -1;
  }
  let hoveredRow;
  if (mouseY >= 0 && mouseY < gridHeight) {
    hoveredRow = Math.floor(mouseY / (gridHeight / numRows));
  } else {
    hoveredRow = -1;
  }
  // returns an array
  return [hoveredCol, hoveredRow];
}

// audio plays only after mouse is pressed and mouse is inside borders
// also there is a try/catch thing here, will see how it works
async function mousePressed() {
  try {
    await userStartAudio();
    audioEnabled = true;
    if (!backgroundSoundStarted && backgroundSound) {
      backgroundSound.play();
      backgroundSoundStarted = true;
    }
    // assign array coming from getHoveredCell to new one here
    let [hoveredCol, hoveredRow] = getHoveredCell();
    // check when hovered cell changes
    lastHoveredCol = hoveredCol;
    lastHoveredRow = hoveredRow;
    if (hoveredCol !== -1 && hoveredRow !== -1 && hoverSound) {
      hoverSound.play();
    }
  } catch (error) {
    console.error("Unable to enable hover audio:", error);
  }
}

// when mouse is moved, if hovered cell changes, play sound effect
// we can do it in draw() as well like in each frame, but lets try it this way
function mouseMoved() {
  let [hoveredCol, hoveredRow] = getHoveredCell();

  if (hoveredCol === lastHoveredCol && hoveredRow === lastHoveredRow) {
    return;
  }

  lastHoveredCol = hoveredCol;
  lastHoveredRow = hoveredRow;

  if (hoveredCol !== -1 && hoveredRow !== -1 && audioEnabled && hoverSound) {
    hoverSound.play();
  }
}

function draw() {
  // draw background
  imageMode(CORNER);
  image(backgroundImage, 0, 0, width, height);

  // we can actually move this to the setup since it is not interactive anymore, but we will keep it here
  colWidth = gridWidth / numCols;
  rowHeight = gridHeight / numRows;
  let maxDistance = dist(0, 0, gridWidth, gridHeight);
  // get the hovered cell indices
  let [hoveredCol, hoveredRow] = getHoveredCell();
  // main nested loop
  for (let i = 0; i < numCols; i++) {
    for (let j = 0; j < numRows; j++) {
      // using center of each cell
      let xPosition = i * colWidth + colWidth / 2;
      let yPosition = j * rowHeight + rowHeight / 2;
      // distance to mouse position
      let distTemp = dist(mouseX, mouseY, xPosition, yPosition);
      // map distance to speed and constrain it between min and max
      let speedTemp = constrain(
        map(distTemp, 0, 500, maxSpeed, minSpeed),
        minSpeed,
        maxSpeed,
      );
      // map distance to frames2Chance, but division is good enough here
      let frames2Chance = constrain(distTemp / maxDistance, 0, 1);
      animationProgress[i][j] =
        (animationProgress[i][j] + deltaTime / ((1000 / 60) * speedTemp)) %
        numFrames;
      // frameIndex stays the same because math.floor
      let frameIndex = Math.floor(animationProgress[i][j]);
      // check if current frameIndex is the same as lastAnimationStep, then switch frame sets by chance
      if (frameIndex !== lastAnimationSteps[i][j]) {
        if (random() < frames2Chance) {
          animationSets[i][j] = monikaDanceCreepy;
        } else {
          animationSets[i][j] = monikaDance;
        }
        lastAnimationSteps[i][j] = frameIndex;
      }
      // hovered cell is skipped to be drawn later
      if (i === hoveredCol && j === hoveredRow) {
        continue;
      }

      let cellColor = colors[i][j];
      noStroke();
      fill(red(cellColor), green(cellColor), blue(cellColor), 100);
      rect(
        xPosition - colWidth / 2,
        yPosition - rowHeight / 2,
        colWidth,
        rowHeight,
      );
      animate(
        animationSets[i][j],
        frameIndex,
        xPosition,
        yPosition,
        colWidth,
        rowHeight,
      );

      // Debug coordinates
      /* fill(255);
      textAlign(CENTER, CENTER);
      textSize(14);
      text(`[${i}][${j}]`, xPosition, yPosition); */
    }
  }

  if (hoveredCol !== -1 && hoveredRow !== -1) {
    let targetX = hoveredCol * colWidth + colWidth / 2;
    let targetY = hoveredRow * rowHeight + rowHeight / 2;
    let targetFrameIndex = Math.floor(
      animationProgress[hoveredCol][hoveredRow],
    );
    let hoveredAnimation =
      animationSets[hoveredCol][hoveredRow] === monikaDanceCreepy
        ? monikaJumpCreepy
        : monikaJump;

    // drawing the hovered cell which was skipped
    // using push/pop, translate, and scale, to scale everything from center
    push();
    translate(targetX, targetY);
    scale(3);
    let hoveredColor = colors[hoveredCol][hoveredRow];
    fill(red(hoveredColor), green(hoveredColor), blue(hoveredColor), 150);
    stroke(255);
    rect(-colWidth / 2, -rowHeight / 2, colWidth, rowHeight);
    noStroke();
    animate(hoveredAnimation, targetFrameIndex, 0, 0, colWidth, rowHeight);
    pop();
  }

  // load chat image
  imageMode(CORNER);
  tint(255, 225);
  image(chatImage, 0, gridHeight, gridWidth, extraCanvasHeight);
  noTint();
}

// animate function
function animate(
  frames,
  frameIndex,
  xPosition,
  yPosition,
  imageWidth,
  imageHeight,
) {
  let currentFrame = frames[frameIndex];
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

  imageMode(CENTER);
  image(currentFrame, xPosition, yPosition, imageWidth, imageHeight);
}

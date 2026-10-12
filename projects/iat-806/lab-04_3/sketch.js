// IAT 806 · Lab 04 starter: the dancer grid from Week 4, ready for your website.
// Run with Live Server. Uses p5 2.x (async setup, await loadImage).

let maleDance = []; // the 8 dance poses
let femaleDance = []; // TODO: load the jump poses into this array
let numFrames = 8;

let numCols = 30;
let numRows = 30;
let colWidth;
let rowHeight;
const mouseGapRadius = 120;

// crowd area
let topOffset = 160;
let sideOffset = 160;

//background image
let backgroundImage;

// 2D arrays: one color and one speed for every cell in the grid
let colors = [];
let speeds = [];
let dancerOffsets = [];
let leftMouseDown = false;

//crowd position variations
let varX = [];
let varY = [];

async function setup() {
  // resized canvas
  const canvas = createCanvas(900, 900);

  // load background image
  backgroundImage = await loadImage("background.png");

  // puts the canvas inside <div id="sketch-holder"> in index.html
  canvas.parent("sketch-holder");

  // define distance between each character
  rowHeight = (height - topOffset) / numRows;
  colWidth = (width - sideOffset * 2) / numCols;

  for (let i = 0; i < numCols; i++) {
    colors[i] = [];
    speeds[i] = [];
    dancerOffsets[i] = [];
    //crowd position variations turned into 2d array
    varX[i] = [];
    varY[i] = [];
    for (let j = 0; j < numRows; j++) {
      colors[i][j] = [random(1, 255), random(1, 255), random(1, 255)];
      speeds[i][j] = random(1, 10);
      dancerOffsets[i][j] = createVector(0, 0);
      varX[i][j] = random(0, colWidth);
      varY[i][j] = random(0, rowHeight);
    }
  }

  for (let i = 0; i < numFrames; i++) {
    let fileName = "dance_frames/male/dance" + i + ".png";
    maleDance.push(await loadImage(fileName));
  }
}

function mousePressed(event) {
  leftMouseDown = event.button === 0;
}

function mouseReleased(event) {
  if (event.button === 0) {
    leftMouseDown = false;
  }
}

function draw() {
  image(backgroundImage, 0, 0, width, height);
  //numCols = Math.floor(map(mouseX, 0, width, 2, 20));
  // dist the mouse position and the position of the dancing profs

  let mousePosition = createVector(mouseX, mouseY);
  let offsetEase = 1 - Math.exp(-deltaTime / 700);
  let swayTime = millis() / 1000;
  let dancers = [];
  for (let i = 0; i < numCols; i++) {
    for (let j = 0; j < numRows; j++) {
      let dancerAnchor = createVector(
        sideOffset + i * colWidth + varX[i][j],
        topOffset + j * rowHeight + varY[i][j],
      );
      let currentFrame = maleDance[getFrameIndex(speeds[i][j])];
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
        let moshpitTarget = p5.Vector.sub(mousePosition, dancerPosition).add(
          createVector(Math.sin(swayPhase) * 8, Math.cos(swayPhase) * 8),
        );
        targetOffset = moshpitTarget;
      }

      dancerOffsets[i][j].lerp(targetOffset, offsetEase);
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
      maleDance,
      speeds[col][row],
      col * colWidth,
      row * rowHeight,
      colWidth,
    );
    pop();
  }
}

// draws one dancer: which poses, how fast, where, and how big
function animate(frames, speed, xPosition, yPosition, imageWidth, imageHeight) {
  let index = getFrameIndex(speed);
  let currentFrame = frames[index];
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

  image(currentFrame, xPosition, yPosition, imageWidth * 2, imageHeight * 2);
}

// which pose to show right now. speed = draw-frames per pose: smaller = faster
function getFrameIndex(speed) {
  let slowFrame = Math.floor(frameCount / speed);
  let index = slowFrame % numFrames;

  return index;
}

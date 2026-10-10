let frames = [];
let frames2 = [];

let numFrames = 8;

// define column and row variables
let numCols = 9;
let numRows = 9;

let colWidth;
let rowHeight;

let colors = [];
// track animation progress individually
let animationProgress = [];
let animationSets = [];
let lastAnimationSteps = [];

async function setup() {
  createCanvas(900, 900);

  for (let i = 0; i < numCols; i++) {
    colors[i] = [];
    animationProgress[i] = [];
    animationSets[i] = [];
    lastAnimationSteps[i] = [];
    for (let j = 0; j < numRows; j++) {
      colors[i][j] = color(random(255), random(255), random(255));
      animationProgress[i][j] = 0;
      lastAnimationSteps[i][j] = -1;
    }
  }

  for (let i = 0; i < numFrames; i++) {
    // let fileName = `dance_frames/dance${i}.png`;
    let fileName = "dance_frames/dance" + i + ".png";
    frames.push(await loadImage(fileName));
    fileName = "dance_frames2/dance" + i + ".png";
    frames2.push(await loadImage(fileName));
  }
}

function draw() {
  background(0);

  colWidth = width / numCols;
  rowHeight = height / numRows;
  let maxDistance = dist(0, 0, width, height);
  let hoveredCol =
    mouseX >= 0 && mouseX < width ? Math.floor(mouseX / colWidth) : -1;
  let hoveredRow =
    mouseY >= 0 && mouseY < height ? Math.floor(mouseY / rowHeight) : -1;

  for (let i = 0; i < numCols; i++) {
    for (let j = 0; j < numRows; j++) {
      let xPosition = i * colWidth + colWidth / 2;
      let yPosition = j * rowHeight + rowHeight / 2;
      let distTemp = dist(mouseX, mouseY, xPosition, yPosition);
      let speedTemp = map(distTemp, 0, 500, 2, 20);
      let frames2Chance = constrain(distTemp / maxDistance, 0, 1);
      animationProgress[i][j] =
        (animationProgress[i][j] + deltaTime / ((1000 / 60) * speedTemp)) %
        frames.length;
      let frameIndex = Math.floor(animationProgress[i][j]);
      if (frameIndex !== lastAnimationSteps[i][j]) {
        animationSets[i][j] = random() < frames2Chance ? frames2 : frames;
        lastAnimationSteps[i][j] = frameIndex;
      }

      if (i === hoveredCol && j === hoveredRow) {
        continue;
      }

      push();
      translate(xPosition, yPosition);
      fill(colors[i][j]);
      ellipse(0, 0, colWidth, rowHeight);
      animate(animationSets[i][j], frameIndex, 0, 0, colWidth, rowHeight);

      // Debug coordinates
      /* push();
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(14);
      text(`[${i}][${j}]`, 0, 0);
      pop(); */
      pop();
    }
  }

  if (hoveredCol !== -1 && hoveredRow !== -1) {
    let targetX = hoveredCol * colWidth + colWidth / 2;
    let targetY = hoveredRow * rowHeight + rowHeight / 2;
    let targetFrameIndex = Math.floor(
      animationProgress[hoveredCol][hoveredRow],
    );

    push();
    translate(targetX, targetY);
    scale(1.3);
    fill(colors[hoveredCol][hoveredRow]);
    ellipse(0, 0, colWidth, rowHeight);
    animate(
      animationSets[hoveredCol][hoveredRow],
      targetFrameIndex,
      0,
      0,
      colWidth,
      rowHeight,
    );
    pop();
  }
}

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

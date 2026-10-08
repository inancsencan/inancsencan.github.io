let frames = [];
let frames2 = [];

let numFrames = 8;

// define column and row variables
let numCols = 20;
let numRows = 20;

let colWidth;
let rowHeight;

let colors = [];
let speeds = [];

async function setup() {
  createCanvas(900, 900);

  for (let i = 0; i < numCols; i++) {
    colors[i] = [];
    speeds[i] = [];
    for (let j = 0; j < numRows; j++) {
      colors[i][j] = color(random(255), random(255), random(255));
      speeds[i][j] = random(5, 15);
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

  let posX = constrain(mouseX, 0, width);
  let posY = constrain(mouseY, 0, height);
  numCols = int(map(posX, 0, width, 5, 20));
  numRows = int(map(posY, 0, height, 5, 20));

  colWidth = width / numCols;
  rowHeight = height / numRows;

  for (let i = 0; i < numCols; i++) {
    for (let j = 0; j < numRows; j++) {
      fill(colors[i][j]);
      ellipse(
        i * colWidth + colWidth / 2,
        j * rowHeight + rowHeight / 2,
        colWidth,
        rowHeight,
      );
      animate(
        frames,
        speeds[i][j],
        i * colWidth + colWidth / 2,
        j * rowHeight + rowHeight / 2,
        colWidth,
        rowHeight,
      );
    }
  }

  /* animate(frames, 15, 670, width / 2, 300, 150);
  animate(frames, 5, 410, width / 2, undefined, 300);
  animate(frames, 10, 150, width / 2, 200, 300); */
}

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

  imageMode(CENTER);
  image(currentFrame, xPosition, yPosition, imageWidth, imageHeight);
}

function getFrameIndex(speed) {
  let slowFrame = Math.floor(frameCount / speed);
  let index = slowFrame % frames.length;
  return index;
}

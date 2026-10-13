// TODO for myself
// after some time, when "just monika" starts playing, monika covers the scene

// - Interactions -
// Press "left mouse button" to start playing the audio
// Move mouse to hover over "different" characters
// Has hovering sound effect
// Randomized cell bg colours, with alpha
// Randomized initial character selection
// Something happens to the characters slowly...?
// Hovered character jumps with excitement! Wonder which one is being picked :)
// Chat dialogue is... interesting.
// Scene changes when going to the next audio track..
// Is this all, or something changes after some time? Who knows...

// frame arrays
let monikaDance = [];
let monikaDanceCreepy = [];
let monikaJump = [];
let monikaJumpCreepy = [];
let natsukiDance = [];
let natsukiDanceCreepy = [];
let yuriDance = [];
let yuriDanceCreepy = [];
let sayoriDance = [];
let sayoriDanceCreepy = [];

// define images
let chatImage;
let monikaImage;
let startImage;

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
const monikaImageStartTime = 11 * 60 + 55;

// define stages for background
const backgroundStages = [
  { time: 0, imagePath: "images/background.png" },
  { time: 2 * 60 + 9, imagePath: "images/background2.png" },
];

// dimensions of each cell
let colWidth;
let rowHeight;

let colors = [];
let stageBackgrounds = [];
let sketchStartTime;
let dialogueTimeline = [];

// track animation progress individually
let animationProgress = [];
let animationSets = [];
let creepyStates = [];
let creepyStateChangeTimes = [];
let currentDialogueKey = null;
let dialogueStartedAt = 0;
const dialogueCharacterInterval = 35;

async function setup() {
  // defines canvas
  const canvas = createCanvas(gridWidth, gridHeight + extraCanvasHeight);

  // puts the canvas inside <div id="sketch-holder"> in index.html
  canvas.parent("sketch-holder");

  for (let i = 0; i < numCols; i++) {
    // create new array for each index as a 2nd dimension
    colors[i] = [];
    animationProgress[i] = [];
    animationSets[i] = [];
    creepyStates[i] = [];
    creepyStateChangeTimes[i] = [];
    for (let j = 0; j < numRows; j++) {
      colors[i][j] = color(random(255), random(255), random(255));

      // record animation progress for each cell
      animationProgress[i][j] = 0;
      creepyStates[i][j] = false;
      creepyStateChangeTimes[i][j] = random(1, 3);
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
    natsukiDanceCreepy.push(
      await loadImage("natsuki_dance/dance" + i + ".png"),
    );
    yuriDanceCreepy.push(await loadImage("yuri_dance/dance" + i + ".png"));
    sayoriDanceCreepy.push(await loadImage("sayori_dance/dance" + i + ".png"));
  }
  for (let i = 0; i < numFrames; i++) {
    natsukiDance.push(await loadImage("natsuki_dance/dance" + i + ".png"));
    yuriDance.push(await loadImage("yuri_dance/dance" + i + ".png"));
    sayoriDance.push(await loadImage("sayori_dance/dance" + i + ".png"));
  }

  const startingDanceSets = [monikaDance, natsukiDance, yuriDance, sayoriDance];
  for (let i = 0; i < numCols; i++) {
    for (let j = 0; j < numRows; j++) {
      animationSets[i][j] = random(startingDanceSets);
    }
  }

  // load images
  chatImage = await loadImage("images/chat.png");
  monikaImage = await loadImage("images/monikammmmm.png");
  startImage = await loadImage("images/start.png");
  const dialogueCsv = (await loadStrings("ddlc_timeline.csv")).join("\n");
  const csvRecords = parseCsv(dialogueCsv);
  const [headers, ...rows] = csvRecords;
  if (!headers) {
    throw new Error("Dialogue CSV is empty.");
  }
  const timeSecondsIndex = headers.indexOf("time_seconds");
  const typeIndex = headers.indexOf("type");
  const textIndex = headers.indexOf("text");
  if (timeSecondsIndex < 0 || typeIndex < 0 || textIndex < 0) {
    throw new Error("Dialogue CSV is missing a required header.");
  }
  dialogueTimeline = rows
    .filter((row) => row[typeIndex] === "dialogue")
    .map((row) => ({
      timeSeconds: Number(row[timeSecondsIndex]),
      text: row[textIndex] || "",
    }))
    .filter((dialogue) => Number.isFinite(dialogue.timeSeconds))
    .sort((a, b) => a.timeSeconds - b.timeSeconds);
  for (const stage of backgroundStages) {
    stageBackgrounds.push(await loadImage(stage.imagePath));
  }

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
    if (!audioEnabled) {
      sketchStartTime = millis();
    }
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
  // start timer when audio is enabled
  let elapsedTime = audioEnabled ? (millis() - sketchStartTime) / 1000 : 0;
  let currentStage = 0;

  //change stage when timestamp is reached
  for (let i = 1; i < backgroundStages.length; i++) {
    if (elapsedTime >= backgroundStages[i].time) {
      currentStage = i;
    }
  }
  // draw background
  imageMode(CORNER);
  image(stageBackgrounds[currentStage], 0, 0, width, height);

  // if play mode, draw everything
  if (audioEnabled == true) {
    // we can actually move this to the setup since it is not interactive anymore, but we will keep it here
    colWidth = gridWidth / numCols;
    rowHeight = gridHeight / numRows;

    // Chance of changing to each character's creepy dance increases with time.
    let creepyChance = constrain(elapsedTime / 690, 0, 1);
    console.log(creepyChance);

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
        animationProgress[i][j] =
          (animationProgress[i][j] + deltaTime / ((1000 / 60) * speedTemp)) %
          numFrames;
        // frameIndex stays the same because math.floor
        let frameIndex = Math.floor(animationProgress[i][j]);
        if (elapsedTime >= creepyStateChangeTimes[i][j]) {
          creepyStates[i][j] = random() < creepyChance;
          creepyStateChangeTimes[i][j] = elapsedTime + random(1, 3);
        }
        let currentAnimation = creepyStates[i][j]
          ? getCreepyDanceSet(animationSets[i][j])
          : animationSets[i][j];
        // hovered cell is skipped to be drawn later
        if (i === hoveredCol && j === hoveredRow) {
          continue;
        }
        let cellColor = colors[i][j];
        drawCharacterShape(
          currentAnimation,
          xPosition,
          yPosition,
          colWidth,
          rowHeight,
          cellColor,
          100,
        );
        animate(
          currentAnimation,
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
      let hoveredAnimation = monikaJump;

      // drawing the hovered cell which was skipped
      // using push/pop, translate, and scale, to scale everything from center

      push();
      translate(targetX, targetY);
      scale(3);
      drawCharacterShape(
        monikaDance,
        0,
        0,
        colWidth,
        rowHeight,
        colors[hoveredCol][hoveredRow],
        150,
        true,
      );
      animate(hoveredAnimation, targetFrameIndex, 0, 0, colWidth, rowHeight);
      pop();
    }
    console.log(audioEnabled);
    if (audioEnabled && elapsedTime >= monikaImageStartTime) {
      imageMode(CORNER);
      image(monikaImage, 0, 0, gridWidth, gridHeight);
    }

    // load chat image
    imageMode(CORNER);
    tint(255, 225);
    image(chatImage, 0, gridHeight, gridWidth, extraCanvasHeight);
    noTint();
    if (audioEnabled) {
      const dialogue = getDialogueAtTime(elapsedTime);
      if (dialogue) {
        drawDialogue(dialogue.text, dialogue);
      }
    }
    // if start mode, draw logo and dim background
  } else {
    imageMode(CENTER);
    background(0, 100);
    image(startImage, width / 2, height / 2, 800, 500);
  }
}

function getDialogueAtTime(elapsedTime) {
  let dialogue = null;
  for (const entry of dialogueTimeline) {
    if (entry.timeSeconds > elapsedTime) {
      break;
    }
    dialogue = entry;
  }
  return dialogue;
}

function parseCsv(csvText) {
  const records = [];
  let record = [];
  let field = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const character = csvText[i];
    if (character === '"') {
      if (insideQuotes && csvText[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === "," && !insideQuotes) {
      record.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && csvText[i + 1] === "\n") {
        i++;
      }
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  if (records.length > 0) {
    records[0][0] = records[0][0].replace(/^\uFEFF/, "");
  }
  return records;
}

function drawDialogue(dialogueText, dialogueKey = dialogueText) {
  if (dialogueKey !== currentDialogueKey) {
    currentDialogueKey = dialogueKey;
    dialogueStartedAt = millis();
  }
  const visibleCharacterCount = Math.min(
    dialogueText.length,
    Math.floor((millis() - dialogueStartedAt) / dialogueCharacterInterval) + 1,
  );

  push();
  textFont("Arial Rounded MT Bold, Arial, sans-serif");
  textStyle(BOLD);
  textSize(26);
  textLeading(34);
  textAlign(LEFT, TOP);
  stroke(0);
  strokeWeight(5);
  strokeJoin(ROUND);
  fill(255);
  text(
    dialogueText.slice(0, visibleCharacterCount),
    40,
    gridHeight + 40,
    gridWidth - 60,
    extraCanvasHeight - 48,
  );
  pop();
}

function getCreepyDanceSet(frames) {
  if (frames === monikaDance || frames === monikaDanceCreepy) {
    return monikaDanceCreepy;
  }
  if (frames === natsukiDance || frames === natsukiDanceCreepy) {
    return natsukiDanceCreepy;
  }
  if (frames === yuriDance || frames === yuriDanceCreepy) {
    return yuriDanceCreepy;
  }
  return sayoriDanceCreepy;
}

function drawCharacterShape(
  frames,
  xPosition,
  yPosition,
  shapeWidth,
  shapeHeight,
  cellColor,
  alpha,
  highlighted = false,
) {
  if (highlighted) {
    stroke(255);
  } else {
    noStroke();
  }
  fill(red(cellColor), green(cellColor), blue(cellColor), alpha);

  if (frames === sayoriDance || frames === sayoriDanceCreepy) {
    ellipse(xPosition, yPosition, shapeWidth, shapeHeight);
  } else if (frames === natsukiDance || frames === natsukiDanceCreepy) {
    triangle(
      xPosition,
      yPosition - shapeHeight / 2,
      xPosition - shapeWidth / 2,
      yPosition + shapeHeight / 2,
      xPosition + shapeWidth / 2,
      yPosition + shapeHeight / 2,
    );
  } else if (frames === yuriDance || frames === yuriDanceCreepy) {
    quad(
      xPosition,
      yPosition - shapeHeight / 2,
      xPosition + shapeWidth / 2,
      yPosition,
      xPosition,
      yPosition + shapeHeight / 2,
      xPosition - shapeWidth / 2,
      yPosition,
    );
  } else {
    rect(
      xPosition - shapeWidth / 2,
      yPosition - shapeHeight / 2,
      shapeWidth,
      shapeHeight,
    );
  }
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

// ========================================
// BODY BRIDGE — UPDATED TODO
// ========================================

// PHASE 1 — Basic Physics
// [x] Create Ball class
// [x] Add gravity and velocity
// [ ] Adjust automatic ball movement
// [ ] Reset ball after falling

// PHASE 2 — Body Interaction
// [x] Webcam and segmentation
// [x] Live and frozen silhouettes
// [ ] Mirror silhouette
// [ ] Store frozen collision mask
// [ ] Detect ball/silhouette collision
// [ ] Add bouncing and sliding

// PHASE 3 — Gameplay
// [ ] Create target bowl
// [ ] Detect ball entering the bowl
// [ ] Detect ball falling offscreen
// [ ] Add score and attempts
// [ ] Spawn/remove balls with push/splice
// [ ] Add game states (start/play/end)

// PHASE 4 — Interface
// [ ] Start screen and instructions
// [ ] Freeze silhouette before dropping ball
// [ ] Retry and restart controls

// PHASE 5 — Animated Silhouette (BONUS)
// [ ] Record 1-2 seconds of body movement
// [ ] Store sequence of segmentation masks
// [ ] Loop recorded silhouettes
// [ ] Make moving surfaces transfer momentum
// [ ] YEET THE BALL :D

// PHASE 6 — Submission
// [ ] Update index.html
// [ ] Add project to IAT 806 website
// [ ] Test on GitHub Pages
// [ ] Commit and submit


// define video as variable
let video;

// we need two segmentation variables: one for the mask,
let bodySegmentation;
let segmentation;

// play with the mask
let displayMask;
let frozenMask = null;
let frozenCollisionMask = null;

// store every raw pose the player captures
let recordedPoses = [];

// store the Silhouette objects used in the game
let silhouettes = [];

// allow up to three frozen poses per attempt
let maxSilhouettes = 3;

// Balls.
let balls = [];

// store the target bowl
let bowl;

// store the game manager
let game;

// store the interface manager
let ui;


// need async so we can use await inside setup()
async function setup() {
  // defines canvas
  const canvas = createCanvas(800, 600);

  // puts the canvas inside <div id="sketch-holder"> in index.html
  canvas.parent("sketch-holder");

  // create the game manager
  game = new GameManager();

  // create the interface manager
  ui = new UIManager();

  // load the transparent start-screen artwork
  await ui.loadAssets();

  // create the bowl near the bottom right corner
  bowl = new Bowl(width - 190, height - 145, 165, 120);

  // spawn first ball
  balls.push(new Ball(70, 110));

  // starts video capture, assigns it to video
  video = createCapture(VIDEO);

  // redefines the size of the video
  video.size(640, 480);

  // this will let the camera recognize the "person"
  let options = {
    maskType: "background",

    // mirror the detected silhouette horizontally
    flipped: true,
  };

  // hides the video. we will need the silhouette only anyways.
  video.hide();

  // assign the mask to the bodySegmentation variable
  bodySegmentation = await ml5.bodySegmentation("BodyPix", options);

  // starts the detection process, and calls gotResults when it is done
  bodySegmentation.detectStart(video, gotResults);
}


function draw() {
  // keep the start menu background the same
  if (game.state === "start") {
    // fill the start screen with a dark arcade color
    background(13, 18, 31);
  } else {
    // paint background white
    // background(255);

    // draw a dark laboratory grid instead of the old white background
    drawBackground();
  }

  // if segmentation exists, draw mask as black
  if ((game.state === "start" || game.state === "prepare") && displayMask) {
    //paint it pink
    // make the live silhouette bright enough on the dark grid
    tint(255, 50, 100, game.state === "start" ? 180 : 160);

    // draw the current mask
    image(displayMask, 0, 0, width, height);

    // revert the tint
    noTint();
  }

  // show only the live silhouette and menu artwork on the start screen
  if (game.state === "start") {
    // draw the menu artwork and its scripted instructions
    ui.draw(game, false, Boolean(displayMask));

    // skip drawing the ball and bowl on the start screen
    return;
  }

  // draw each frozen silhouette we have recorded
  for (let silhouette of silhouettes) {
    // draw this silhouette with its own color
    silhouette.show();
  }

  // draw the target bowl
  bowl.show();

  // check every ball in the array
  for (let ball of balls) {

    // only move the balls when the game is playing
    if (game.state === "playing") {

      // update the ball's position and velocity
      ball.update(frozenCollisionMask);

      // make the ball collide with the bowl walls
      bowl.collide(ball);

      // check if the ball touches the frozen silhouette
      if (ball.collidesWith(frozenCollisionMask)) {

        // remember that the ball touched the silhouette
        ball.hasTouched = true;
      }

      // check if the ball enters the target bowl
      if (bowl.catches(ball)) {

        // tell the game manager that we won
        game.win();

      // check if the ball leaves the screen
      } else if (
        ball.pos.y - ball.r > height ||
        ball.pos.x - ball.r > width ||
        ball.pos.x + ball.r < 0
      ) {

        // tell the game manager that we lost
        game.lose();
      }
    }

    // draw the ball
    ball.show();

    // add a bright outline so the dark ball stays visible on the grid
    push();

    // keep the middle of the circle clear
    noFill();

    // use a glowing orange color around the ball
    stroke(255, 190, 65);

    // make the circle edge easy to see
    strokeWeight(2);

    // draw a ring just outside the ball
    circle(ball.pos.x, ball.pos.y, ball.r * 2 + 3);

    // restore the previous drawing settings
    pop();
  }

  // update the timer if the game is playing
  game.updateTimer();

  // draw the interface on top of the gameplay
  ui.draw(game, Boolean(frozenCollisionMask), Boolean(displayMask));

  // only show the pose counter while preparing
  if (game.state === "prepare") {
    // keep the text style separate from the game
    push();

    // use a bright color that is visible on the grid
    fill(210, 248, 255);

    // do not draw text outlines
    noStroke();

    // choose a small text size
    textSize(13);

    // align the text to the bottom-left
    textAlign(LEFT, BASELINE);

    // show the pose limit and undo shortcut
    text("POSES: " + silhouettes.length + "/" + maxSilhouettes + "   CLICK: ADD   BACKSPACE: UNDO", 24, height - 18);

    // restore the previous drawing style
    pop();
  }
}


function gotResults(result) {
  segmentation = result;

  // Make a separate copy for visual presentation
  displayMask = result.mask.get();

  // resize the live silhouette to match the canvas
  displayMask.resize(width, height);

  // Convert black pixels to white
  displayMask.filter(INVERT);
}


function freezeMask() {
  // temporarily freezes the mask and records it in a variable
  if (game.state === "prepare" && displayMask && segmentation) {

    // stop recording after three poses
    if (recordedPoses.length >= maxSilhouettes) return;

    // save the visual silhouette
    frozenMask = displayMask.get();

    // save the original silhouette for collisions
    let newCollisionMask = segmentation.mask.get();

    // resize the collision mask to match the canvas
    newCollisionMask.resize(width, height);

    // remember this snapshot so we can build objects from it
    recordedPoses.push({
      // store the white visual image
      display: frozenMask,

      // store the actual solid collision image
      collision: newCollisionMask,
    });

    // rebuild the visible objects and their shared collision mask
    rebuildSilhouettes();
  }
}


// create a Silhouette object for every recorded pose
function rebuildSilhouettes() {
  // remove all the old Silhouette instances
  silhouettes.splice(0, silhouettes.length);

  // create a new instance for each saved pose using a loop
  for (let i = 0; i < recordedPoses.length; i++) {
    // get the saved images for this pose
    let pose = recordedPoses[i];

    // create and store a new Silhouette object
    silhouettes.push(new Silhouette(pose.display, pose.collision, i));
  }

  // check whether all poses have been removed
  if (silhouettes.length === 0) {
    // remove the shared collision mask
    frozenCollisionMask = null;

    // remove the last frozen visual image
    frozenMask = null;

    // stop here because there is nothing to combine
    return;
  }

  // make a temporary transparent image for combining masks
  let combined = createGraphics(width, height);

  // make sure it starts fully transparent
  combined.clear();

  // add every opaque body shape to the same image
  for (let silhouette of silhouettes) {
    // draw this silhouette's original collision mask
    combined.image(silhouette.collisionMask, 0, 0, width, height);
  }

  // save the merged image for our existing Ball collision code
  frozenCollisionMask = combined.get();

  // remove the temporary graphics buffer to save memory
  combined.remove();
}


function mousePressed() {
  // when the mouse is pressed, freeze the mask

  // check if the mouse is inside the canvas
  let insideCanvas =
    mouseX >= 0 &&
    mouseX < width &&
    mouseY > 80 &&
    mouseY < height;

  // only record when preparing
  if (game.state === "prepare" && insideCanvas) {

    // capture the current pose
    freezeMask();
  }
}


// reset the ball and recorded silhouette
function resetScene() {
  // remove the frozen visual silhouette
  frozenMask = null;

  // remove the frozen collision silhouette
  frozenCollisionMask = null;

  // remove all recorded poses for the next attempt
  recordedPoses.splice(0, recordedPoses.length);

  // remove all frozen Silhouette objects
  silhouettes.splice(0, silhouettes.length);

  // remove every existing ball from the array
  balls.splice(0, balls.length);

  // spawn a new ball below the HUD
  balls.push(new Ball(70, 110));
}


// this function runs whenever a key is pressed
function keyPressed(event) {

  // check if ENTER was pressed on the start screen
  if (event.key === "Enter" && game.state === "start") {

    // create a fresh scene
    resetScene();

    // start a new game
    game.beginNewGame();

    // prevent the key from affecting the webpage
    return false;
  }

  // check if BACKSPACE or DELETE was pressed
  if (event.key === "Backspace" || event.key === "Delete") {
    // only allow removing poses during preparation
    if (game.state === "prepare" && recordedPoses.length > 0) {
      // remove the most recently captured pose
      recordedPoses.splice(recordedPoses.length - 1, 1);

      // rebuild the objects and collision mask without that pose
      rebuildSilhouettes();
    }

    // prevent BACKSPACE from navigating away from the page
    return false;
  }

  // check if SPACE was pressed
  if (key === " ") {

    // try to release the ball
    game.startAttempt(Boolean(frozenCollisionMask));

    // prevent the key from scrolling the webpage
    return false;
  }

  // check if P was pressed
  if (key === "p" || key === "P") {

    // pause or resume the game
    game.togglePause();

    // prevent the key from affecting the webpage
    return false;
  }

  // check if R was pressed
  if (key === "r" || key === "R") {

    // do not reset from the start menu
    if (game.state !== "start") {

      // create a fresh scene
      resetScene();

      // return to preparation mode
      game.resetAttempt();
    }

    // prevent the key from affecting the webpage
    return false;
  }

  // check if M was pressed
  if (key === "m" || key === "M") {

    // create a fresh scene
    resetScene();

    // return to the main menu
    game.returnToMenu();

    // prevent the key from affecting the webpage
    return false;
  }
}


// draw the laboratory grid behind the game
function drawBackground() {
  // paint the canvas dark navy
  background(12, 20, 34);

  // remember the current drawing settings
  push();

  // use thin and faint blue grid lines
  stroke(45, 90, 115, 65);

  // make the lines one pixel wide
  strokeWeight(1);

  // draw a vertical line every 40 pixels
  for (let x = 0; x <= width; x += 40) {
    // draw the vertical line
    line(x, 0, x, height);
  }

  // draw a horizontal line every 40 pixels
  for (let y = 0; y <= height; y += 40) {
    // draw the horizontal line
    line(0, y, width, y);
  }

  // use slightly stronger lines every 200 pixels
  stroke(48, 115, 150, 65);

  // draw the larger vertical grid lines
  for (let x = 0; x <= width; x += 200) {
    // draw a larger vertical line
    line(x, 0, x, height);
  }

  // draw the larger horizontal grid lines
  for (let y = 0; y <= height; y += 200) {
    // draw a larger horizontal line
    line(0, y, width, y);
  }

  // restore the previous drawing settings
  pop();
}

class GameManager {
  // create the game manager
  constructor() {
    // begin at the main menu
    this.state = "start";

    // store the total score
    this.score = 0;

    // count the attempts
    this.attempts = 0;

    // set the time limit in seconds
    this.timeLimit = 15;

    // store the remaining time
    this.timeLeft = this.timeLimit;
  }

  // start a completely new game
  beginNewGame() {
    // reset the score
    this.score = 0;

    // reset the attempt counter
    this.attempts = 0;

    // reset the timer
    this.timeLeft = this.timeLimit;

    // enter preparation mode
    this.state = "prepare";
  }

  // prepare another attempt
  resetAttempt() {
    // reset the timer
    this.timeLeft = this.timeLimit;

    // return to preparation mode
    this.state = "prepare";
  }

  // release the ball
  startAttempt(hasPose) {
    // only start during preparation
    if (this.state !== "prepare") return;

    // do not start without a recorded pose
    if (!hasPose) return;

    // increase the attempt counter
    this.attempts++;

    // reset the timer
    this.timeLeft = this.timeLimit;

    // start the physics simulation
    this.state = "playing";
  }

  // pause or resume the game
  togglePause() {
    // check if the game is currently playing
    if (this.state === "playing") {
      // pause the game
      this.state = "paused";

      // check if the game is currently paused
    } else if (this.state === "paused") {
      // resume the game
      this.state = "playing";
    }
  }

  // handle a successful attempt
  win() {
    // only allow winning while playing
    if (this.state !== "playing") return;

    // increase the score
    this.score++;

    // enter the success state
    this.state = "won";
  }

  // handle a failed attempt
  lose() {
    // only allow losing while playing
    if (this.state !== "playing") return;

    // enter the game over state
    this.state = "gameOver";
  }

  // update the countdown timer
  updateTimer() {
    // do nothing unless the game is playing
    if (this.state !== "playing") return;

    // convert the time between frames into seconds
    let secondsPassed = deltaTime / 1000;

    // subtract the passed time from the remaining time
    this.timeLeft -= secondsPassed;

    // check if the time has run out
    if (this.timeLeft <= 0) {
      // prevent negative time values
      this.timeLeft = 0;

      // end the attempt
      this.lose();
    }
  }

  // return to the main menu
  returnToMenu() {
    // change the current state
    this.state = "start";

    // reset the timer
    this.timeLeft = this.timeLimit;
  }

  // choose which interface to draw
  drawUI(hasPose, modelReady) {
    // check if we are on the start screen
    if (this.state === "start") {
      // draw the main menu
      this.drawStartScreen();

      // check if the player is preparing
    } else if (this.state === "prepare") {
      // draw the preparation instructions
      this.drawPrepareScreen(hasPose, modelReady);

      // check if the ball is moving
    } else if (this.state === "playing") {
      // draw the game HUD
      this.drawHUD();

      // check if the game is paused
    } else if (this.state === "paused") {
      // draw the game HUD behind the pause message
      this.drawHUD();

      // draw the pause overlay
      this.drawEndScreen(
        "PAUSED",
        "The timer is stopped.",
        "P: Resume   |   R: Retry",
      );

      // check if the player won
    } else if (this.state === "won") {
      // draw the success screen
      this.drawEndScreen(
        "SUCCESS!",
        "The ball reached the bowl!",
        "R: Retry   |   M: Menu",
      );

      // check if the player lost
    } else if (this.state === "gameOver") {
      // draw the failure screen
      this.drawEndScreen(
        "TRY AGAIN!",
        "The ball missed or time ran out.",
        "R: Retry   |   M: Menu",
      );
    }
  }

  // draw the main menu
  drawStartScreen() {
    // remember the current drawing settings
    push();

    // remove outlines
    noStroke();

    // create a dark transparent background
    fill(15, 20, 30, 225);

    // cover the whole game canvas
    rect(0, 0, width, height);

    // center the text
    textAlign(CENTER, CENTER);

    // use white text
    fill(255);

    // set the title size
    textSize(42);

    // draw the game title
    text("BODY BRIDGE", width / 2, 105);

    // use smaller text
    textSize(17);

    // show the game's objective
    text("Guide the falling ball into the bowl.", width / 2, 160);

    // use an even smaller text size
    textSize(16);

    // show the first instruction
    text("1. Find your position", width / 2, 225);

    // show the second instruction
    text("2. Click to record your silhouette", width / 2, 255);

    // show the third instruction
    text("3. Press SPACE to release the ball", width / 2, 285);

    // show the fourth instruction
    text("4. Reach the bowl before time runs out!", width / 2, 315);

    // use a bright color for the start instruction
    fill(100, 255, 170);

    // increase the text size
    textSize(22);

    // show how to start
    text("PRESS ENTER TO START", width / 2, 400);

    // restore the previous drawing settings
    pop();
  }

  // draw the preparation instructions
  drawPrepareScreen(hasPose, modelReady) {
    // remember the drawing settings
    push();

    // remove outlines
    noStroke();

    // use a nearly white background for the HUD
    fill(255, 245);

    // draw the top information panel
    rect(12, 12, width - 24, 68, 8);

    // use dark text
    fill(25);

    // align text to the left
    textAlign(LEFT, CENTER);

    // set the title size
    textSize(17);

    // show the current mode
    text("PREPARE YOUR POSE", 24, 32);

    // use smaller text
    textSize(13);

    // check whether the player has recorded a pose
    if (hasPose) {
      // show that the pose is ready
      text("Pose recorded! Press SPACE to play.", 24, 57);

      // check whether the model is ready
    } else if (modelReady) {
      // ask the player to record a pose
      text("Move into position, then click to record.", 24, 57);
    } else {
      // tell the player that the model is loading
      text("Loading body detection...", 24, 57);
    }

    // show the score and attempts
    text("Score: " + this.score, width - 190, 32);
    text("Attempts: " + this.attempts, width - 190, 57);

    // draw the bottom instructions panel
    fill(255, 245);
    rect(12, height - 52, width - 24, 40, 8);

    // use dark text again
    fill(25);

    // show the available controls
    text(
      "Click: Record   |   SPACE: Play   |   R: Reset   |   M: Menu",
      24,
      height - 32,
    );

    // restore the previous drawing settings
    pop();
  }

  // draw the information shown during gameplay
  drawHUD() {
    // remember the drawing settings
    push();

    // remove outlines
    noStroke();

    // draw the information panel at the bottom
    rect(12, height - 95, width - 24, 68, 8);

    // use dark text
    fill(25);

    // align text to the left
    textAlign(LEFT, CENTER);

    // set the text size
    textSize(15);

    // show the current score
    text("Score: " + this.score, 24, 38);

    // show the number of attempts
    text("Attempts: " + this.attempts, 170, 38);

    // show the remaining time
    text("Time: " + ceil(this.timeLeft), 345, 38);

    // show the pause control
    text("P: Pause", 510, 38);

    // restore the previous drawing settings
    pop();
  }

  // draw the pause, win, or lose screen
  drawEndScreen(titleText, subtitleText, controlsText) {
    // remember the drawing settings
    push();

    // remove outlines
    noStroke();

    // darken the game behind the message
    fill(15, 20, 30, 190);

    // cover the entire canvas
    rect(0, 0, width, height);

    // center the text
    textAlign(CENTER, CENTER);

    // use white text
    fill(255);

    // set the title size
    textSize(38);

    // show the main message
    text(titleText, width / 2, height / 2 - 75);

    // use smaller text
    textSize(18);

    // show the explanation
    text(subtitleText, width / 2, height / 2 - 20);

    // show the score
    text("Score: " + this.score, width / 2, height / 2 + 25);

    // show the attempts
    text("Attempts: " + this.attempts, width / 2, height / 2 + 55);

    // use a bright color for controls
    fill(100, 255, 170);

    // set the control text size
    textSize(18);

    // show the available controls
    text(controlsText, width / 2, height / 2 + 115);

    // restore the previous drawing settings
    pop();
  }
}

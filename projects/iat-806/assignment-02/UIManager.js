class UIManager {
  // create the interface manager
  constructor() {
    // store optional images for HUD artwork
    this.images = {
      start: null,
      hud: null,
      end: null,
      // store the central pause artwork
      pause: null,
      // store the success artwork
      success: null,
      // store the failure artwork
      failure: null,
    };
  }

  // load the artwork we already have
  async loadAssets() {
    // try to load the start-screen image
    try {
      // wait until the PNG has loaded
      this.images.start = await loadImage("assets/start-screen.png");
    } catch (error) {
      // report the problem without breaking the game
      console.error("Could not load the start-screen image:", error);
    }

    // try to load our new transparent playing HUD
    try {
      // wait until the HUD image has loaded
      this.images.hud = await loadImage("assets/hud-playing.png");
    } catch (error) {
      // report an image problem without stopping the game
      console.error("Could not load the gameplay HUD:", error);
    }

    // try to load the central pause panel
    try {
      // wait until the pause image has loaded
      this.images.pause = await loadImage("assets/hud-pause.png");
    } catch (error) {
      // report the missing image without stopping the game
      console.error("Could not load the pause HUD:", error);
    }

    // try to load the success panel
    try {
      // wait until the success image is available
      this.images.success = await loadImage("assets/hud-success.png");
    } catch (error) {
      // explain which image did not load
      console.error("Could not load the success HUD:", error);
    }

    // try to load the failure panel
    try {
      // wait until the failure image is available
      this.images.failure = await loadImage("assets/hud-failure.png");
    } catch (error) {
      // explain which image did not load
      console.error("Could not load the failure HUD:", error);
    }
  }

  // save an image for a particular part of the interface
  setImage(name, img) {
    // store the image using its name
    this.images[name] = img;
  }

  // decide which interface to draw
  draw(game, hasPose, modelReady) {
    // check if the player is at the main menu
    if (game.state === "start") {
      // draw the starting screen
      this.drawStartScreen();

    // check if the player is preparing a pose
    } else if (game.state === "prepare") {
      // choose the correct instruction
      let message = "Loading body detection...";

      // check if the model is ready
      if (modelReady) {
        // explain how to record
        message = "Click on the canvas to record your pose.";
      }

      // check if a pose has already been recorded
      if (hasPose) {
        // explain how to start the simulation
        message = "Pose recorded! Press SPACE to play.";
      }

      // draw the preparation HUD
      this.drawHUD(game, "PREPARE", message);

    // check if the simulation is running
    } else if (game.state === "playing") {
      // draw the playing HUD
      this.drawHUD(game, "PLAYING", "P: Pause  |  R: Retry  |  M: Menu");

    // check if the game is paused
    } else if (game.state === "paused") {
      // draw the special pause panel
      this.drawPauseScreen(game);

    // check if the player succeeded
    } else if (game.state === "won") {
      // draw the success screen
      this.drawResultScreen(game, true);

    // check if the attempt failed
    } else if (game.state === "gameOver") {
      // draw the failure screen
      this.drawResultScreen(game, false);
    }
  }

  // draw the main menu using our transparent PNG
  drawStartScreen() {
    // remember the current drawing settings
    push();

    // remove outlines
    noStroke();

    // draw the start-screen frame if it loaded
    if (this.images.start) {
      // place the transparent artwork over the live silhouette
      image(this.images.start, 0, 0, width, height);
    } else {
      // show a simple title if the artwork is unavailable
      fill(255);
      textSize(36);
      textAlign(CENTER, CENTER);
      text("BODY BRIDGE", width / 2, 100);
    }

    // put the instructions in the four empty artwork panels
    textAlign(LEFT, CENTER);

    // use a readable bright color
    fill(240, 250, 255);

    // set the instruction size
    textSize(19);

    // explain the first step
    text("Position your body", 274, 190);

    // explain the second step
    text("Click to record your silhouette", 274, 257);

    // explain the third step
    text("Press SPACE to release the ball", 274, 324);

    // explain the fourth step
    text("Guide the ball into the bowl", 274, 390);

    // center the text inside the pink button
    textAlign(CENTER, CENTER);

    // use white for the start message
    fill(255);

    // make the start message larger
    textSize(25);

    // show how to begin
    text("PRESS ENTER TO START", width / 2, 470);

    // use a pale cyan color for the bottom controls
    fill(195, 250, 255);

    // make the bottom controls smaller
    textSize(16);

    // show the keyboard controls for later gameplay
    text("R: RETRY       M: MENU", width / 2, 532);

    // restore the previous drawing settings
    pop();
  }

  // draw the small HUD during preparation and gameplay
  drawHUD(game, title, message) {
    // save the current drawing settings
    push();

    // remove outlines from text and shapes
    noStroke();

    // draw the transparent neon HUD artwork
    if (this.images.hud) {
      // fill the canvas with the artwork at its designed size
      image(this.images.hud, 0, 0, width, height);
    } else {
      // show a simple dark bar if the PNG did not load
      fill(25, 32, 44, 235);

      // draw a backup bar only at the top
      rect(12, 26, width - 24, 47, 8);
    }

    // center the text inside the artwork panels
    textAlign(CENTER, CENTER);

    // use a bright white color for the text
    fill(235, 251, 255);

    // choose the short status text for the left panel
    let status = "LEVEL 01";

    // check if the player is preparing
    if (game.state === "prepare") {
      // show a loading status until detection is ready
      status = "LOADING...";

      // tell the player to click when the model is ready
      if (message.includes("Click")) status = "CLICK TO RECORD";

      // tell the player to release the ball after recording
      if (message.includes("SPACE")) status = "SPACE TO PLAY";
    }

    // use medium text for the left status panel
    textSize(13);

    // draw the current state inside the left panel
    text(status, 200, 56);

    // show the small score label next to the trophy icon
    textSize(10);
    text("SCORE", 357, 41);

    // show the current score underneath the label
    textSize(13);
    text(game.score, 357, 56);

    // show the attempt label next to the flag icon
    textSize(10);
    text("TRIES", 500, 41);

    // show the number of attempts underneath the label
    textSize(13);
    text(game.attempts, 500, 56);

    // show the time label next to the stopwatch icon
    textSize(10);
    text("TIME", 628, 41);

    // show the remaining time in seconds
    textSize(13);
    text(ceil(game.timeLeft), 628, 56);

    // restore the previous drawing settings
    pop();
  }

  // draw the pause screen using the new transparent image
  drawPauseScreen(game) {
    // save the current drawing settings
    push();

    // remove outlines
    noStroke();

    // darken the game behind the pause panel
    fill(6, 12, 25, 155);

    // cover the whole canvas with a transparent dark color
    rect(0, 0, width, height);

    // restore the drawing settings
    pop();

    // show the regular HUD and frozen timer at the top
    this.drawHUD(game, "PAUSED", "");

    // save the drawing settings for the center panel
    push();

    // show the new neon artwork if it loaded
    if (this.images.pause) {
      // place the transparent artwork over the scene
      image(this.images.pause, 0, 0, width, height);
    } else {
      // use a backup dark panel if the image did not load
      fill(16, 26, 44, 245);

      // draw the backup panel in the center
      rect(100, 120, width - 200, 345, 18);
    }

    // center the menu text inside its panels
    textAlign(CENTER, CENTER);

    // use bold letters for the main title
    textStyle(BOLD);

    // use a soft cyan color for the title
    fill(215, 253, 255);

    // make the title larger than the buttons
    textSize(32);

    // draw the title in the pink top frame
    text("PAUSED", 400, 166);

    // use bold white text for the three actions
    fill(246, 250, 255);

    // set the action text size
    textSize(22);

    // write the first action in its button
    text("RESUME", 409, 251);

    // write the second action in its button
    text("RETRY", 409, 324);

    // write the third action in its button
    text("MAIN MENU", 409, 396);

    // use thin outlines for the keyboard shortcuts
    stroke(64, 224, 239, 190);

    // make the shortcut outlines one pixel thick
    strokeWeight(1);

    // give the shortcuts a dark background
    fill(7, 27, 42, 225);

    // draw a keycap for the resume shortcut
    rect(527, 237, 32, 29, 6);

    // draw a keycap for the retry shortcut
    rect(527, 310, 32, 29, 6);

    // draw a keycap for the menu shortcut
    rect(527, 382, 32, 29, 6);

    // remove the outlines before drawing shortcut letters
    noStroke();

    // use cyan for the shortcut letters
    fill(137, 246, 255);

    // make the shortcut letters easy to read
    textSize(16);

    // draw the shortcut for resume
    text("P", 543, 251);

    // draw the shortcut for retry
    text("R", 543, 324);

    // draw the shortcut for the main menu
    text("M", 543, 396);

    // restore all drawing settings
    pop();
  }

  // draw the success or failure screen
  drawResultScreen(game, succeeded) {
    // remember the current drawing settings
    push();

    // remove shape outlines
    noStroke();

    // darken the simulation but keep it visible
    fill(6, 12, 25, 170);

    // draw the dark layer over the game
    rect(0, 0, width, height);

    // restore the previous drawing settings
    pop();

    // keep the score and timer HUD visible at the top
    this.drawHUD(game, "RESULT", "");

    // remember the drawing settings for the central panel
    push();

    // choose the correct background artwork
    let resultImage = succeeded ? this.images.success : this.images.failure;

    // check whether the artwork loaded
    if (resultImage) {
      // place the transparent artwork over the game
      image(resultImage, 0, 0, width, height);
    } else {
      // use a dark backup panel if the image is missing
      fill(16, 26, 44, 245);

      // draw the backup panel in the center
      rect(120, 120, 560, 395, 18);
    }

    // use centered text in the empty title and action panels
    textAlign(CENTER, CENTER);

    // use bold text for the results
    textStyle(BOLD);

    // use a bright title color
    fill(225, 253, 255);

    // set the title size
    textSize(30);

    // show the result title inside the pink plaque
    text(succeeded ? "SUCCESS!" : "TRY AGAIN!", 400, succeeded ? 256 : 233);

    // choose white for the action labels
    fill(245, 250, 255);

    // use a readable label size
    textSize(20);

    // show the success information or failure action
    if (succeeded) {
      // show the successful shot message beside the checkmark
      text("BALL DELIVERED!", 418, 333);

      // show the retry action beside the orange arrow
      text("RETRY", 418, 396);

      // show the menu action beside the pink home icon
      text("MAIN MENU", 418, 459);
    } else {
      // show the retry action beside the circular arrow
      text("RETRY", 418, 308);

      // show the menu action beside the home icon
      text("MAIN MENU", 418, 373);

      // use smaller text for the final attempt information
      textSize(17);

      // show the current number of attempts
      text("ATTEMPT " + game.attempts + " ENDED", 418, 440);
    }

    // draw shortcuts for the real keyboard actions
    if (succeeded) {
      // label the retry shortcut
      this.drawResultKey("R", 551, 396);

      // label the menu shortcut
      this.drawResultKey("M", 551, 459);
    } else {
      // label the retry shortcut
      this.drawResultKey("R", 551, 308);

      // label the menu shortcut
      this.drawResultKey("M", 551, 373);
    }

    // restore the previous drawing settings
    pop();
  }

  // draw a small keyboard shortcut box
  drawResultKey(letter, x, y) {
    // remember the current drawing settings
    push();

    // use a thin cyan outline
    stroke(90, 230, 240, 210);

    // use a one-pixel outline
    strokeWeight(1);

    // fill the key with dark blue
    fill(6, 25, 39, 235);

    // draw the shortcut box centered on its position
    rect(x - 16, y - 14, 32, 28, 5);

    // remove outlines from the text
    noStroke();

    // use pale cyan for the letter
    fill(170, 250, 255);

    // draw the letter in the center
    textAlign(CENTER, CENTER);

    // give the letter a simple bold style
    textStyle(BOLD);

    // set the letter size
    textSize(16);

    // draw the shortcut letter
    text(letter, x, y);

    // restore the previous drawing settings
    pop();
  }

  // draw the pause, success, or failure screen
  drawOverlay(title, message, controls, game) {
    // save the current drawing settings
    push();

    // remove outlines
    noStroke();

    // darken the gameplay
    fill(19, 25, 37, 205);
    rect(0, 0, width, height);

    // draw optional ending artwork
    if (this.images.end) {
      image(this.images.end, 0, 0, width, height);
    }

    // center the text
    textAlign(CENTER, CENTER);

    // use white text
    fill(255);

    // set the title size
    textSize(48);

    // show the main message
    text(title, width / 2, 205);

    // use smaller text
    textSize(20);

    // show the explanation
    text(message, width / 2, 275);

    // show the current score
    text("Score: " + game.score, width / 2, 335);

    // show the number of attempts
    text("Attempts: " + game.attempts, width / 2, 370);

    // use green for the controls
    fill(110, 255, 170);

    // set the controls text size
    textSize(18);

    // show the available controls
    text(controls, width / 2, 465);

    // restore the previous drawing settings
    pop();
  }
}

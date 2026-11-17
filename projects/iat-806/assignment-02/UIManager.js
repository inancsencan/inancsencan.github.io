class UIManager {
  // create the interface manager
  constructor() {
    // store optional images for HUD artwork
    this.images = {
      start: null,
      hud: null,
      end: null,
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
      // keep the gameplay HUD visible behind the pause screen
      this.drawHUD(game, "PAUSED", "");

      // draw the pause screen
      this.drawOverlay(
        "PAUSED",
        "Simulation stopped.",
        "P: Resume  |  R: Retry",
        game,
      );

      // check if the player succeeded
    } else if (game.state === "won") {
      // draw the success screen
      this.drawOverlay(
        "SUCCESS!",
        "The ball reached the bowl!",
        "R: Retry  |  M: Menu",
        game,
      );

      // check if the attempt failed
    } else if (game.state === "gameOver") {
      // draw the failure screen
      this.drawOverlay(
        "TRY AGAIN!",
        "The attempt has ended.",
        "R: Retry  |  M: Menu",
        game,
      );
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

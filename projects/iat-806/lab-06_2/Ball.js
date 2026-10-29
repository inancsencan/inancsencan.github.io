class Ball {
  //store initial and current values of the object
  constructor(xPos, yPos, radi, ballC) {
    this.x = this.initX = xPos;
    this.y = this.initY = yPos;
    this.r = this.initR = radi;
    this.c = this.initC = ballC;
    this.highlightC = "magenta";
    //to resize the balls
    this.sizeM = 1;
  }

  //update function that handles other functions
  update(jitterAmp, ballColor, state) {
    this.move(jitterAmp);
    this.changeSize(state);
    this.show(ballColor);
  }

  //displays the balls
  show(ballColor) {
    fill(ballColor);
    circle(this.x, this.y, this.r * 2 * this.sizeM);
  }

  //jitter movement. planning to add more moves.
  move(jitterAmp) {
    //get distance value
    let dif = this.orthoDist();
    //drifting prevention here
    this.x += random(-jitterAmp, jitterAmp) + dif[0] * 0.1;
    this.y += random(-jitterAmp, jitterAmp) + dif[1] * 0.1;
  }

  //calculates distance from initial position to drifted position
  //keeps the distances of x and y separately
  orthoDist() {
    let xDist = this.initX - this.x;
    let yDist = this.initY - this.y;
    return [xDist, yDist];
  }

  //defines the action of ball size changing
  changeSize(state) {
    switch (state) {
      case "growing":
        //grow
        this.sizeM += 0.1;
        break;
      case "neutral":
        //stay
        break;
      case "shrinking":
        //shrink
        this.sizeM -= 0.1;
        break;
    }
    this.sizeM = constrain(this.sizeM, 0.5, 5);
  }

  //uses segmentation.mask as input, which is an image
  isOnBody(mask) {
    //gets the rgba value of the pixel at ball location
    let pixel = mask.get(floor(this.x), floor(this.y)); // [r,g,b,a];
    //returns alpha value as boolean conditioned to 128
    return pixel[3] < 128;
  }

  contains(px, py) {
    let distToBall = dist(px, py, this.x, this.y);
    if (distToBall <= this.r * this.sizeM) {
      return true;
    } else {
      return false;
    }
  }

  //turn object color to highlight color
  highlight() {
    this.c = this.highlightC;
  }

  //turn object color back to initial color
  deHighlight() {
    this.c = this.initC;
  }

  //when switched, use highlight(), revert when switched back
  respond(active) {
    if (active) {
      this.highlight();
    } else {
      this.deHighlight();
    }
  }
}

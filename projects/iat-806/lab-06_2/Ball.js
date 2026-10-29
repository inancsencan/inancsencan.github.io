class Ball {
  constructor(xPos, yPos, radi, ballC) {
    this.x = this.initX = xPos;
    this.y = this.initY = yPos;
    this.r = this.initR = radi;
    this.c = this.initC = ballC;
    this.sizeM = 1;
  }

  update(jitterAmp, ballColor, state) {
    this.jitter(jitterAmp);
    this.changeSize(state);
    this.show(ballColor);
  }

  show(ballColor) {
    fill(ballColor);
    circle(this.x, this.y, this.r * 2 * this.sizeM);
  }

  jitter(jitterAmp) {
    let dif = this.orthoDist();
    this.x += random(-jitterAmp, jitterAmp) + dif[0] * 0.1;
    this.y += random(-jitterAmp, jitterAmp) + dif[1] * 0.1;
  }

  orthoDist() {
    let xDist = this.initX - this.x;
    let yDist = this.initY - this.y;
    return [xDist, yDist];
  }

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
}

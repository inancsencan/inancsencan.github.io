class Ball {
  constructor(xPos, yPos, radi, ballColor) {
    this.x = xPos;
    this.y = yPos;
    this.initX = xPos;
    this.initY = yPos;
    this.r = radi;
    this.c = ballColor;
  }

  update(jitterAmp) {
    this.jitter(jitterAmp);
    this.show();
  }

  show() {
    fill(this.c);
    circle(this.x, this.y, this.r * 2);
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
}

class Ball {
  constructor(x, y, c, r, maxR = 10) {
    // it's like the instance saying, MY X is 400. In Python the keyword is self.x.
    this.x = x;
    this.y = y;
    this.originalColor = c;
    // this.color is the one that changes
    this.color = c;
    this.highlightColor = "red";
    // ALSO this is a diameter, not radius.
    // This is our mistake... we should have looked at the documentation.
    this.r = r;
    this.maxR = maxR;
    // TODO: if one of your methods needs a new attribute, create it here.
  }

  update(byHowMuch) {
    this.changeSize(byHowMuch);
    this.move(byHowMuch);
    this.show();
  }

  respond(active) {
    if (active) {
      this.highlight();
    } else {
      this.deHighlight();
    }
  }

  contains(pointX, pointY) {
    let distance = dist(this.x, this.y, pointX, pointY);

    return distance < this.r;

    /* if (distance < dist.r) {
      return true;
    } else {
      return false;
    } */
  }

  highlight() {
    this.color = this.highlightColor;
  }

  deHighlight() {
    this.color = this.originalColor;
  }

  isOnBody(mask) {
    let pixel = mask.get(floor(this.x), floor(this.y)); // [r,g,b,a];

    return pixel[3] < 128;
  }

  move(byHowMuch) {
    // this.x = this.x + random(-5,5)
    this.x += random(-byHowMuch, byHowMuch);
    this.y += random(-byHowMuch, byHowMuch);
  }

  changeSize(byHowMuch) {
    // we fix the size like this:
    // the constrain is saying that it shouldn't grow larger than a certain amount.
    this.r = constrain(this.r + random(-byHowMuch, byHowMuch), 2, this.maxR);
  }

  show() {
    fill(this.color);
    circle(this.x, this.y, this.r * 2);
  }
}

function createRandomBall() {
  let ballX = random(0, width);
  let ballY = random(0, height);
  let ballC = color(20, 130, 140 + random(-100, 100), 120);
  let ballR = 10;
  let ball = new Ball(ballX, ballY, ballC, ballR);
  return ball;
}

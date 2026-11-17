class Bowl {
  // create a new bowl
  constructor(x, y, w, h) {
    // horizontal position
    this.x = x;

    // vertical position
    this.y = y;

    // width of the bowl
    this.w = w;

    // height of the bowl
    this.h = h;

    // thickness of the bowl walls
    this.wall = 12;
  }

  // draw the bowl
  show() {
    // remove outlines
    noStroke();

    // set a transparent blue color
    fill(50, 180, 220, 40);

    // draw the inside of the bowl
    rect(this.x, this.y, this.w, this.h);

    // set the wall color
    fill(50, 150, 190);

    // draw the left wall
    rect(this.x, this.y, this.wall, this.h);

    // draw the right wall
    rect(this.x + this.w - this.wall, this.y, this.wall, this.h);

    // draw the bottom wall
    rect(this.x, this.y + this.h - this.wall, this.w, this.wall);
  }

  // check if a ball is inside the bowl
  catches(ball) {
    // find the inner left edge of the bowl
    let innerLeft = this.x + this.wall;

    // find the inner right edge of the bowl
    let innerRight = this.x + this.w - this.wall;

    // find the inner bottom of the bowl
    let innerBottom = this.y + this.h - this.wall;

    // check if the ball is far enough inside horizontally
    let insideX =
      ball.pos.x >= innerLeft + ball.r / 2 &&
      ball.pos.x <= innerRight - ball.r / 2;

    // check if the ball is below the upper third of the bowl
    let insideY =
      ball.pos.y >= this.y + this.h / 3 && ball.pos.y <= innerBottom;

    // the ball scores when both conditions are true
    return insideX && insideY;
  }

  // make the bowl walls physically solid
  collide(ball) {
    // describe the three walls as rectangles
    let walls = [
      // left wall
      { x: this.x, y: this.y, w: this.wall, h: this.h },

      // right wall
      { x: this.x + this.w - this.wall, y: this.y, w: this.wall, h: this.h },

      // bottom wall
      { x: this.x, y: this.y + this.h - this.wall, w: this.w, h: this.wall },
    ];

    // check every wall
    for (let wall of walls) {
      // find the nearest horizontal point on the wall
      let closestX = constrain(ball.pos.x, wall.x, wall.x + wall.w);

      // find the nearest vertical point on the wall
      let closestY = constrain(ball.pos.y, wall.y, wall.y + wall.h);

      // find the horizontal distance from the wall
      let dx = ball.pos.x - closestX;

      // find the vertical distance from the wall
      let dy = ball.pos.y - closestY;

      // calculate the squared distance
      let distanceSq = dx * dx + dy * dy;

      // skip this wall if the ball does not touch it
      if (distanceSq >= ball.r * ball.r) continue;

      // prepare the collision direction
      let nx = 0;
      let ny = 0;

      // prepare the amount of overlap
      let overlap = 0;

      // check if the ball's center is outside the wall
      if (distanceSq > 0) {
        // calculate the distance
        let distance = sqrt(distanceSq);

        // find the horizontal collision direction
        nx = dx / distance;

        // find the vertical collision direction
        ny = dy / distance;

        // calculate how deeply the ball overlaps
        overlap = ball.r - distance;
      } else {
        // find the distance to the left edge
        let left = ball.pos.x - wall.x;

        // find the distance to the right edge
        let right = wall.x + wall.w - ball.pos.x;

        // find the distance to the top edge
        let top = ball.pos.y - wall.y;

        // find the distance to the bottom edge
        let bottom = wall.y + wall.h - ball.pos.y;

        // find the nearest edge
        let nearest = min(left, right, top, bottom);

        // choose the direction of that edge
        if (nearest === left) nx = -1;
        else if (nearest === right) nx = 1;
        else if (nearest === top) ny = -1;
        else ny = 1;

        // move the ball completely outside the wall
        overlap = ball.r + nearest;
      }

      // push the ball away from the wall
      ball.pos.x += nx * (overlap + 0.5);
      ball.pos.y += ny * (overlap + 0.5);

      // calculate the ball's speed toward the wall
      let speedIntoWall = ball.vel.x * nx + ball.vel.y * ny;

      // bounce only if the ball is moving into the wall
      if (speedIntoWall < 0) {
        // reflect the horizontal velocity
        ball.vel.x -= (1 + ball.bounciness) * speedIntoWall * nx;

        // reflect the vertical velocity
        ball.vel.y -= (1 + ball.bounciness) * speedIntoWall * ny;
      }
    }
  }
}

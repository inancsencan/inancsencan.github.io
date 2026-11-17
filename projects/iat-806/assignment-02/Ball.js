class Ball {
  // Create a ball at the given position.
  constructor(x, y) {
    // Store the ball's position.
    this.pos = createVector(x, y);

    // Give the ball a small push to the right.
    this.vel = createVector(2, 0);

    // Pull the ball downward.
    this.gravity = createVector(0, 0.2);

    // Set the ball's radius.
    this.r = 12;

    // Remember if the ball has ever touched the body.
    this.hasTouched = false;

    // Set how bouncy the ball is.
    this.bounciness = 0.5;

    // Set how much speed the ball loses after hitting.
    this.friction = 0.98;
  }

  // Move the ball and check for collisions.
  update(mask) {
    // Add gravity to velocity.
    this.vel.add(this.gravity);

    // Calculate how many small steps we need.
    let steps = max(1, ceil(this.vel.mag() / 4));

    // Divide the movement into smaller pieces.
    let stepMove = this.vel.copy().div(steps);

    // Move the ball one small step at a time.
    for (let i = 0; i < steps; i++) {
      // Remember the last safe position.
      let previousPosition = this.pos.copy();

      // Move the ball forward.
      this.pos.add(stepMove);

      // Check if the ball touches the body.
      if (this.collidesWith(mask)) {
        // Remember that a collision happened.
        this.hasTouched = true;

        // Find the direction facing away from the body.
        let normal = this.getCollisionNormal(mask);

        // Return the ball to its last safe position.
        this.pos = previousPosition;

        // Move the ball slightly away from the surface.
        this.pos.add(normal.copy().mult(2));

        // Find how fast the ball moves toward the surface.
        let speedTowardSurface = this.vel.dot(normal);

        // Only bounce if moving into the surface.
        if (speedTowardSurface < 0) {
          // Reflect the velocity away from the surface.
          this.vel.sub(
            normal.copy().mult((1 + this.bounciness) * speedTowardSurface),
          );

          // Reduce the ball's speed a little.
          this.vel.mult(this.friction);
        }

        // Stop moving for this frame.
        break;
      }
    }
  }

  // Check whether one pixel belongs to the body.
  isSolid(mask, x, y) {
    // Stop if there is no mask.
    if (!mask) return false;

    // Convert the coordinates to whole numbers.
    x = floor(x);
    y = floor(y);

    // Ignore pixels outside the image.
    if (x < 0 || x >= mask.width || y < 0 || y >= mask.height) {
      return false;
    }

    // Read the pixel at this position.
    let pixel = mask.get(x, y);

    // An opaque pixel represents the body.
    return pixel[3] > 127;
  }

  // Check whether the ball overlaps the body.
  collidesWith(mask) {
    // Stop if there is no mask.
    if (!mask) return false;

    // Check if the center is inside the body.
    if (this.isSolid(mask, this.pos.x, this.pos.y)) {
      return true;
    }

    // Check 16 points around the ball's edge.
    for (let i = 0; i < 16; i++) {
      // Calculate the angle of this point.
      let angle = (TWO_PI * i) / 16;

      // Calculate the point's horizontal position.
      let x = this.pos.x + cos(angle) * this.r;

      // Calculate the point's vertical position.
      let y = this.pos.y + sin(angle) * this.r;

      // Check whether this point touches the body.
      if (this.isSolid(mask, x, y)) {
        return true;
      }
    }

    // No collision was found.
    return false;
  }

  // Find which direction the body surface faces.
  getCollisionNormal(mask) {
    // Start with an empty direction vector.
    let normal = createVector(0, 0);

    // Check points around the ball's edge.
    for (let i = 0; i < 16; i++) {
      // Calculate the angle of the point.
      let angle = (TWO_PI * i) / 16;

      // Find the horizontal direction.
      let dx = cos(angle);

      // Find the vertical direction.
      let dy = sin(angle);

      // Calculate the point's horizontal position.
      let x = this.pos.x + dx * this.r;

      // Calculate the point's vertical position.
      let y = this.pos.y + dy * this.r;

      // Check whether the point is inside the body.
      if (this.isSolid(mask, x, y)) {
        // Add a direction pointing away from the body.
        normal.x -= dx;
        normal.y -= dy;
      }
    }

    // Check whether we found a useful direction.
    if (normal.magSq() === 0) {
      // Use the opposite velocity as a backup.
      normal = this.vel.copy().mult(-1);
    }

    // Make the direction vector have length 1.
    normal.normalize();

    // Return the collision direction.
    return normal;
  }

  // Draw the ball.
  show() {
    // Do not draw an outline.
    noStroke();

    // Use orange if the ball has touched the body.
    if (this.hasTouched) {
      fill(255, 120, 0);
    } else {
      // Otherwise, use dark gray.
      fill(30);
    }

    // Draw the ball using its diameter.
    circle(this.pos.x, this.pos.y, this.r * 2);
  }
}

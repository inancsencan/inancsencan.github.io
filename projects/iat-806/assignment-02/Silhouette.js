class Silhouette {
  // make a new frozen body shape
  constructor(displayMask, collisionMask, index) {
    // store the image used for drawing
    this.displayMask = displayMask;

    // store the image used for collision detection
    this.collisionMask = collisionMask;

    // remember which silhouette this is
    this.index = index;

    // choose a different color for each saved pose
    this.colors = [
      [45, 255, 120, 170],  // first pose: neon green
      [65, 210, 255, 165],  // second pose: cyan
      [255, 195, 75, 165],  // third pose: orange
    ];
  }

  // draw this frozen silhouette
  show() {
    // remember the current drawing settings
    push();

    // choose the color for this silhouette
    let c = this.colors[this.index % this.colors.length];

    // apply its color and transparency
    tint(c[0], c[1], c[2], c[3]);

    // draw the silhouette across the canvas
    image(this.displayMask, 0, 0, width, height);

    // restore the previous drawing settings
    pop();
  }
}

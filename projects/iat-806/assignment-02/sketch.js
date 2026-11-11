// define video as variable
let video;

// we need two segmentation variables: one for the mask,
let bodySegmentation;
let segmentation;

// play with the mask
let displayMask;
let frozenMask = null;
let frozenCollisionMask = null;

// need async so we can use await inside setup()
async function setup() {
  // defines canvas
  const canvas = createCanvas(640, 480);

  // puts the canvas inside <div id="sketch-holder"> in index.html
  canvas.parent("sketch-holder");

  // starts video capture, assigns it to video
  video = createCapture(VIDEO);

  // redefines the size of the video
  video.size(640, 480);

  // this will let the camera recognize the "person"
  let options = {
    maskType: "background",
  };

  // assign the mask to the bodySegmentation variable
  bodySegmentation = await ml5.bodySegmentation("BodyPix", options);

  // starts the detection process, and calls gotResults when it is done
  bodySegmentation.detectStart(video, gotResults);

  // hides the video. we will need the silhouette only anyways.
  video.hide();
}

function draw() {
  // paint background white
  background(255);

  // if segmentation exists, draw mask as black
  if (displayMask) {
    //paint it pink
    tint(255, 50, 100);

    // draw the current mask
    image(displayMask, 0, 0, width, height);

    // revert the tint
    noTint();
  }
  if (frozenMask) {
    // paint it green
    tint(0, 255, 0);

    // draw the frozen mask
    image(frozenMask, 0, 0, width, height);

    // revert the tint
    noTint();
  }
}

function gotResults(result) {
  segmentation = result;

  // Make a separate copy for visual presentation
  displayMask = result.mask.get();

  // Convert black pixels to white
  displayMask.filter(INVERT);
}

function freezeMask() {
  // temporarily freezes the mask and records it in a variable
  if (displayMask) {
    frozenMask = displayMask.get();
    frozenCollisionMask = segmentation.mask.get();
  }
}

function mousePressed() {
  // when the mouse is pressed, freeze the mask
  freezeMask();
}

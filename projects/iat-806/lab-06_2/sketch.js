let balls = [];
let bodySegmentationModel; //Define a variable to store the BodySegmentation model.
let segmentation;

let video;
let numBalls = 1000;

let options = {
  maskType: "person",
};

async function setup() {
  const canvas = createCanvas(640, 480);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  bodySegmentationModel = await ml5.bodySegmentation("BodyPix", options);
  bodySegmentationModel.detectStart(video, gotResults);

  for (let i = 0; i < numBalls; i++) {
    let ball = createRandomBall();
    balls.push(ball);
  }
}

function draw() {
  background(120);

  //image(video, 0, 0);

  /* if (segmentation) {
    image(segmentation.mask, 0, 0, width, height);
  } */

  for (let ball of balls) {
    if (segmentation) {
      let active = ball.isOnBody(segmentation.mask);
      ball.respond(active);

      ball.update(2);
      active = false;
    }
  }
}

function mousePressed() {
  balls.forEach((ball) => {
    let active = ball.contains(mouseX, mouseY);
    ball.respond(active);
  });
}

function gotResults(result) {
  segmentation = result;
}

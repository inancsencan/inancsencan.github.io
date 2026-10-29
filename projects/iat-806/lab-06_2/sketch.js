let bodySegmentation; //Define a variable to store the BodySegmentation model.
let options = {
  maskType: "person",
};
let video;
let segmentation;

//single ball used for initial testing, maybe use for debugging later
let ball1;

//makes an empty array of myBalls
let myBalls = [];
//how many balls
let ballCount = 1000;
//colors while balls are growing/shrinking
let growColor = "red";
let shrinkColor = "green";
let sizeState;

async function setup() {
  bodySegmentation = await ml5.bodySegmentation("BodyPix", options);

  //canvas size, we used to work with 600/600 because it is
  //the smallest number that can be divided by many numbers
  createCanvas(600, 600);

  //from 0 until ball count, make balls
  for (let i = 0; i < ballCount; i++) {
    ball1 = createRandomBall();
    myBalls.push(ball1);
  }

  // Create the video and hide it
  video = createCapture(VIDEO);
  video.size(600, 600);
  video.hide();
  //Start detecting body parts from the webcam video
  bodySegmentation.detectStart(video, gotResults);
}

function draw() {
  //we type the colors now because why not
  background("black");

  //big balls if mouse is on left, small balls if on right
  if (mouseX < width / 2) {
    sizeState = "growing";
  } else {
    sizeState = "shrinking";
  }

  //for as many balls there are in the array, update the balls
  for (let i = 0; i < myBalls.length; i++) {
    if (segmentation) {
      let active = myBalls[i].isOnBody(segmentation.mask);
      myBalls[i].respond(active);
      myBalls[i].update(5, myBalls[i].c, sizeState);
    }
  }
}

//define positions, color, then make ball, return the ball
function createRandomBall() {
  let posX = random(0, width);
  let posY = random(0, height);
  let randomC = color(random(0, 255), random(0, 255), random(0, 255));
  let ballT = new Ball(posX, posY, 15, randomC);
  return ballT;
}

//change ball hovered by mouse and pressed
function mousePressed() {
  for (let i = 0; i < myBalls.length; i++) {
    //create temp state for hovered ball
    let hover = myBalls[i].contains(mouseX, mouseY);
    //use that state to respond
    myBalls[i].respond(hover);
  }
}

function gotResults(result) {
  segmentation = result;
}

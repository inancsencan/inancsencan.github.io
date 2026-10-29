//single ball used for initial testing, maybe use for debugging later
let ball1;

//makes an empty array of myBalls
let myBalls = [];
//how many balls
let ballCount = 1000;
//colors while balls are growing/shrinking
let growColor = "red";
let shrinkColor = "green";

function setup() {
  //canvas size, we used to work with 600/600 because it is
  //the smallest number that can be divided by many numbers
  createCanvas(600, 600);

  //from 0 until ball count, make balls
  for (let i = 0; i < ballCount; i++) {
    ball1 = createRandomBall();
    myBalls.push(ball1);
  }
}

function draw() {
  //we type the colors now because why not
  background("black");

  //for as many balls there are in the array, update the balls
  for (let i = 0; i < myBalls.length; i++) {
    myBalls[i].update(5, myBalls[i].c, "neutral");
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

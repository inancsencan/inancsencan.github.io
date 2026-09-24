// KardunTurtle — give the turtle instructions and watch it draw.
//
// Everything you need to change is in this file.

let turtle;

async function setup() {
  createCanvas(800, 800);

  // The turtle's face. Drop any image into this folder and point at it here —
  // it gets scaled and cropped into a circle, so anything roughly square works.
  const face = await loadImage("turtle.jpg");

  // Make a turtle near the bottom left, facing up.
  turtle = new KardunTurtle(400, 400, face);

  giveInstructions();
}

// ---------------------------------------------------------------
// YOUR INSTRUCTIONS GO HERE
// ---------------------------------------------------------------

function giveInstructions() {
  turtle.penColor("#ff7a3c");
  turtle.penWidth(4);

  // Press a face onto the canvas, so we can see where we started.
  turtle.stamp();

  //position yourself
  turtle.penUp();
  turtle.left(180);
  turtle.forward(50);
  turtle.right(90);
  turtle.forward(50);
  turtle.right(90);
  turtle.penDown();

  turtle.penDown();
  turtle.setSpeed(20);

  // 100
  turtle.penColor("rgb(255, 200, 80)");
  turtle.forward(100);
  turtle.right(90);
  turtle.forward(100);
  turtle.right(90);
  turtle.forward(100);
  turtle.right(90);
  turtle.forward(110);

  // 110
  turtle.penColor("rgb(255, 175, 75)");
  turtle.right(95);
  turtle.forward(110);
  turtle.right(90);
  turtle.forward(110);
  turtle.right(90);
  turtle.forward(110);
  turtle.right(90);
  turtle.forward(120);

  // 120
  turtle.penColor("rgb(255, 145, 75)");
  turtle.right(95);
  turtle.forward(120);
  turtle.right(90);
  turtle.forward(120);
  turtle.right(90);
  turtle.forward(120);
  turtle.right(90);
  turtle.forward(132);

  // 132
  turtle.penColor("rgb(255, 115, 90)");
  turtle.right(95);
  turtle.forward(132);
  turtle.right(90);
  turtle.forward(132);
  turtle.right(90);
  turtle.forward(132);
  turtle.right(90);
  turtle.forward(145);

  // 145
  turtle.penColor("rgb(250, 90, 115)");
  turtle.right(95);
  turtle.forward(145);
  turtle.right(90);
  turtle.forward(145);
  turtle.right(90);
  turtle.forward(145);
  turtle.right(90);
  turtle.forward(160);

  // 160
  turtle.penColor("rgb(240, 75, 145)");
  turtle.right(95);
  turtle.forward(160);
  turtle.right(90);
  turtle.forward(160);
  turtle.right(90);
  turtle.forward(160);
  turtle.right(90);
  turtle.forward(176);

  // 176
  turtle.penColor("rgb(220, 70, 175)");
  turtle.right(95);
  turtle.forward(176);
  turtle.right(90);
  turtle.forward(176);
  turtle.right(90);
  turtle.forward(176);
  turtle.right(90);
  turtle.forward(194);

  // 194
  turtle.penColor("rgb(195, 70, 200)");
  turtle.right(95);
  turtle.forward(194);
  turtle.right(90);
  turtle.forward(194);
  turtle.right(90);
  turtle.forward(194);
  turtle.right(90);
  turtle.forward(213);

  // 213
  turtle.penColor("rgb(165, 75, 215)");
  turtle.right(95);
  turtle.forward(213);
  turtle.right(90);
  turtle.forward(213);
  turtle.right(90);
  turtle.forward(213);
  turtle.right(90);
  turtle.forward(234);

  // 234
  turtle.penColor("rgb(135, 80, 225)");
  turtle.right(95);
  turtle.forward(234);
  turtle.right(90);
  turtle.forward(234);
  turtle.right(90);
  turtle.forward(234);
  turtle.right(90);
  turtle.forward(257);

  // 257
  turtle.penColor("rgb(105, 90, 230)");
  turtle.right(95);
  turtle.forward(257);
  turtle.right(90);
  turtle.forward(257);
  turtle.right(90);
  turtle.forward(257);
  turtle.right(90);
  turtle.forward(283);

  // 283
  turtle.penColor("rgb(80, 105, 235)");
  turtle.right(95);
  turtle.forward(283);
  turtle.right(90);
  turtle.forward(283);
  turtle.right(90);
  turtle.forward(283);
  turtle.right(90);
  turtle.forward(311);

  // 311
  turtle.penColor("rgb(60, 125, 235)");
  turtle.right(95);
  turtle.forward(311);
  turtle.right(90);
  turtle.forward(311);
  turtle.right(90);
  turtle.forward(311);
  turtle.right(90);
  turtle.forward(342);

  // 342
  turtle.penColor("rgb(45, 150, 230)");
  turtle.right(95);
  turtle.forward(342);
  turtle.right(90);
  turtle.forward(342);
  turtle.right(90);
  turtle.forward(342);
  turtle.right(90);
  turtle.forward(376);

  // 376
  turtle.penColor("rgb(35, 175, 220)");
  turtle.right(95);
  turtle.forward(376);
  turtle.right(90);
  turtle.forward(376);
  turtle.right(90);
  turtle.forward(376);
  turtle.right(90);
  turtle.forward(414);

  // 414
  turtle.penColor("rgb(30, 195, 205)");
  turtle.right(95);
  turtle.forward(414);
  turtle.right(90);
  turtle.forward(414);
  turtle.right(90);
  turtle.forward(414);
  turtle.right(90);
  turtle.forward(455);

  // 455
  turtle.penColor("rgb(35, 210, 185)");
  turtle.right(95);
  turtle.forward(455);
  turtle.right(90);
  turtle.forward(455);
  turtle.right(90);
  turtle.forward(455);
  turtle.right(90);
  turtle.forward(500);

  // 500
  turtle.penColor("rgb(45, 220, 160)");
  turtle.right(95);
  turtle.forward(500);
  turtle.right(90);
  turtle.forward(500);
  turtle.right(90);
  turtle.forward(500);
  turtle.right(90);
  turtle.forward(550);

  // 550
  turtle.penColor("rgb(60, 225, 135)");
  turtle.right(95);
  turtle.forward(550);
  turtle.right(90);
  turtle.forward(550);
  turtle.right(90);
  turtle.forward(550);
  turtle.right(90);
  turtle.forward(605);

  // 605
  turtle.penColor("rgb(80, 230, 110)");
  turtle.right(95);
  turtle.forward(605);
  turtle.right(90);
  turtle.forward(605);
  turtle.right(90);
  turtle.forward(605);
  turtle.right(90);
  turtle.forward(666);

  // 666
  turtle.penColor("rgb(110, 230, 90)");
  turtle.right(95);
  turtle.forward(666);
  turtle.right(90);
  turtle.forward(666);
  turtle.right(90);
  turtle.forward(666);
  turtle.right(90);
  turtle.forward(733);

  // 733
  turtle.penColor("rgb(145, 230, 75)");
  turtle.right(95);
  turtle.forward(733);
  turtle.right(90);
  turtle.forward(733);
  turtle.right(90);
  turtle.forward(733);
  turtle.right(90);
  turtle.forward(806);

  // 806
  turtle.penColor("rgb(185, 225, 65)");
  turtle.right(95);
  turtle.forward(806);
  turtle.right(90);
  turtle.forward(806);
  turtle.right(90);
  turtle.forward(806);
  turtle.right(90);
  turtle.forward(887);
}

function draw() {
  background("#14161a");
  turtle.update(); // runs the next bit of the instructions and draws everything
}

// Press R to start over.
function keyPressed() {
  if (key === "r" || key === "R") {
    turtle.reset();
    giveInstructions();
  }
}

// ---------------------------------------------------------------
// Everything the turtle understands
// ---------------------------------------------------------------
//
//   turtle.forward(100)        walk forward, drawing if the pen is down
//   turtle.backward(100)       walk backward
//   turtle.right(90)           turn clockwise, in degrees
//   turtle.left(90)            turn counter-clockwise
//
//   turtle.penUp()             stop drawing
//   turtle.penDown()           start drawing again
//   turtle.penColor("red")     any p5 color
//   turtle.penWidth(8)         line thickness
//
//   turtle.goTo(100, 200)      jump to a point
//   turtle.setHeading(0)       0 = right, 90 = down, -90 = up
//   turtle.home()              back to the start, facing up
//   turtle.stamp()             print the turtle's face onto the drawing
//   turtle.erase()             wipe the drawing, keep the turtle
//   turtle.repeat(4, fn)       do a set of instructions n times
//
//   turtle.setSpeed(4)         pixels per frame — bigger is faster
//   turtle.instant()           no animation, draw it all at once
//   turtle.setSize(80)         how big the turtle is drawn
//   turtle.hide() / .show()    show or hide the turtle itself
//   turtle.reset()             clear everything

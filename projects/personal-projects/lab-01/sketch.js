console.log("nothing important here");

function setup() {
  createCanvas(975, 650);
}

function draw() {
  background(36, 44, 62);
  rectMode(CORNERS);

  //window
  strokeWeight(10);
  stroke(11, 26, 33);
  fill(56, 75, 105);
  rect(111, 85, 484, 376);

  //buildings
  noStroke();
  fill(34, 52, 74);
  rect(116, 256, 143, 371);
  rect(143, 371, 168, 272);
  rect(168, 371, 214, 224);
  rect(214, 371, 248, 294);
  rect(248, 371, 272, 261);
  rect(272, 371, 303, 320);
  rect(303, 371, 336, 303);
  fill(40, 59, 86);
  rect(336, 371, 351, 343);
  rect(351, 371, 370, 324);
  fill(34, 52, 74);
  rect(370, 371, 400, 293);
  rect(400, 371, 412, 316);
  rect(412, 371, 446, 246);
  rect(446, 371, 460, 275);
  rect(460, 371, 479, 298);

  //blinds
  strokeWeight(10);
  strokeCap(ROUND);
  stroke(11, 26, 33);
  line(116, 100, 479, 100);
  line(116, 113, 479, 113);
  line(116, 126, 479, 126);
  line(116, 139, 479, 139);
  strokeWeight(2);
  line(141, 85, 141, 145);
  line(454, 85, 454, 145);

  //moon :)
  noStroke();
  fill(243, 195, 135);
  circle(421, 183, 40);

  //divider
  strokeWeight(5);
  stroke(11, 26, 33);
  line((111 + 484) / 2, 85, (111 + 484) / 2, 376);

  //drawers
  strokeCap(SQUARE);
  stroke(115, 85, 76);
  strokeWeight(10);
  line(540, 170, 810, 170);
  line(540, 270, 810, 270);

  //add stuff to drawers

  //books
  rectMode(CORNER);
  fill(125, 105, 94);
  noStroke();
  rect(580, 163, 10, -60);
  rect(592, 163, 10, -60);
  fill(97, 78, 63);
  rect(604, 163, 15, -70);
  fill(125, 105, 94);
  rect(621, 163, 15, -80);
  fill(55, 65, 82);
  rect(638, 163, 17, -93);
  strokeWeight(10);
  stroke(11, 26, 33);
  line(565, 163, 573, 113);
  strokeWeight(15);
  line(665, 93, 680, 163);

  noStroke();
  fill(97, 78, 63);
  rect(670, 263, 100, -10);
  fill(11, 26, 33);
  rect(680, 251, 80, -15);
  fill(97, 78, 63);
  rect(690, 234, 60, -10);

  strokeWeight(5);
  stroke(97, 78, 63);
  line(635, 200, 642, 240);
  stroke(55, 65, 82);
  line(655, 200, 650, 240);

  noStroke();
  fill(11, 26, 33);
  rect(630, 253, 30, -35);
  rect(630, 263, 30, -35, 12);

  rectMode(CORNERS);

  //desk
  strokeWeight(12);
  stroke(106, 76, 63);
  line(300, 440, 925, 440);

  //desk supports
  stroke(11, 26, 33);
  fill(22, 32, 48);
  rect(340, 452, 440, 590);
  strokeWeight(3);
  line(340, 485, 440, 485);
  line(340, 520, 440, 520);
  line(340, 555, 440, 555);
  strokeWeight(10);
  line(370, 462, 410, 462);
  line(370, 490, 410, 490);
  line(370, 525, 410, 525);
  line(370, 560, 410, 560);

  stroke(11, 26, 33);
  fill(22, 32, 48);
  rect(830, 452, 910, 590);
  strokeWeight(3);
  line(830, 485, 910, 485);
  line(830, 520, 910, 520);
  line(830, 555, 910, 555);
  strokeWeight(10);
  line(855, 462, 885, 462);
  line(855, 490, 885, 490);
  line(855, 525, 885, 525);
  line(855, 560, 885, 560);

  //add stuff on desk here

  //chair
  fill(11, 26, 33);
  rect(620, 420, 700, 480, 10);
  rect(560, 505, 690, 515, 10);
  strokeWeight(8);
  strokeCap(ROUND);
  line(645, 480, 640, 505);
  line(685, 480, 680, 505);

  line(575, 515, 565, 595);
  line(610, 515, 620, 595);
  line(635, 515, 625, 595);
  line(680, 515, 690, 595);
  //floor
  fill(66, 54, 56);
  noStroke();
  rect(50, 595, 925, 610);

  //ground and walls
  fill(11, 20, 34);
  rect(15, 400, 50, 650);
  rect(925, 434, 960, 650);
  rect(0, 610, 975, 650);

  rect(15, 20, 50, 110);
  rect(925, 20, 960, 110);
  rect(0, 0, 975, 40);

  rect(25, 110, 40, 400);
  rect(935, 110, 950, 434);
}

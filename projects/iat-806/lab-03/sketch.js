console.log("nothing important here");

async function setup() {
  createCanvas(500, 400);

  frame1 = await loadImage("frames/deadeye_gangnam_01.png");
  frame2 = await loadImage("frames/deadeye_gangnam_02.png");
  frame3 = await loadImage("frames/deadeye_gangnam_03.png");
  frame4 = await loadImage("frames/deadeye_gangnam_04.png");
  frame5 = await loadImage("frames/deadeye_gangnam_05.png");
  frame6 = await loadImage("frames/deadeye_gangnam_06.png");
  frame7 = await loadImage("frames/deadeye_gangnam_07.png");
  frame8 = await loadImage("frames/deadeye_gangnam_08.png");
  frame9 = await loadImage("frames/deadeye_gangnam_09.png");
  frame10 = await loadImage("frames/deadeye_gangnam_10.png");
  frame11 = await loadImage("frames/deadeye_gangnam_11.png");
  frame12 = await loadImage("frames/deadeye_gangnam_12.png");
  frame13 = await loadImage("frames/deadeye_gangnam_13.png");
  frame14 = await loadImage("frames/deadeye_gangnam_14.png");
  frame15 = await loadImage("frames/deadeye_gangnam_15.png");
  frame16 = await loadImage("frames/deadeye_gangnam_16.png");
}

function draw() {
  background(0);

  let speed = 10;
  let slowFrame = floor(frameCount / speed);
  let index = floor(slowFrame) % 16;
  if (index === 0) {
    image(frame1, 100, 0);
  } else if (index === 1) {
    image(frame2, 100, 0);
  } else if (index === 2) {
    image(frame3, 100, 0);
  } else if (index === 3) {
    image(frame4, 100, 0);
  } else if (index === 4) {
    image(frame5, 100, 0);
  } else if (index === 5) {
    image(frame6, 100, 0);
  } else if (index === 6) {
    image(frame7, 100, 0);
  } else if (index === 7) {
    image(frame8, 100, 0);
  } else if (index === 8) {
    image(frame9, 100, 0);
  } else if (index === 9) {
    image(frame10, 100, 0);
  } else if (index === 10) {
    image(frame11, 100, 0);
  } else if (index === 11) {
    image(frame12, 100, 0);
  } else if (index === 12) {
    image(frame13, 100, 0);
  } else if (index === 13) {
    image(frame14, 100, 0);
  } else if (index === 14) {
    image(frame15, 100, 0);
  } else if (index === 15) {
    image(frame16, 100, 0);
  }
}

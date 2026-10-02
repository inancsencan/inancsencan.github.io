console.log("nothing important here");

let frames = [];
let backgroundImage;

async function setup() {
  createCanvas(500, 400);
  backgroundImage = await loadImage("background.png");

  for (let i = 1; i <= 16; i++) {
    let number = String(i).padStart(2, "0");
    let path = `frames/deadeye_gangnam_${number}.png`;
    frames.push(await loadImage(path));
  }
}

function draw() {
  background(backgroundImage);

  let speed = 10;
  let slowFrame = floor(frameCount / speed);
  let index = floor(slowFrame) % 16;
  for (let i = 0; i < frames.length; i++) {
    if (i === index) {
      image(frames[i], 180, 115, 135, 210);
    }
  }
}

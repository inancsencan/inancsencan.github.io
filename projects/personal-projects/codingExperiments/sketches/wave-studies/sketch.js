const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let time = 0;

// Set canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Draw an individual wave
function drawWave(offset, color) {
  ctx.beginPath();

  const centerY = canvas.height / 2;
  const amplitude = canvas.height * 0.15;
  const frequency = 0.012;

  for (let x = 0; x <= canvas.width; x += 2) {
    const y =
      centerY +
      Math.sin(x * frequency + time + offset) * amplitude +
      Math.sin(x * frequency * 0.5 + offset) * 30;

    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Animation loop
function animate() {
  ctx.fillStyle = "#080d14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw multiple waves
  for (let i = 0; i < 30; i++) {
    const offset = i * 0.12;

    const opacity = 0.2 + (i / 30) * 0.6;

    const color = `rgba(100, 220, 230, ${opacity})`;

    drawWave(offset, color);
  }

  time += 0.012;

  requestAnimationFrame(animate);
}

// Initialize
resizeCanvas();
animate();

window.addEventListener("resize", resizeCanvas);

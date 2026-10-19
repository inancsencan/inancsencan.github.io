const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticles() {
  particles = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.5 + Math.random() * 1.5,
      angle: Math.random() * Math.PI * 2,
    });
  }
}

function animate() {
  ctx.fillStyle = "rgba(8, 13, 20, 0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  particles.forEach((particle) => {
    const oldX = particle.x;
    const oldY = particle.y;

    // Change direction gradually
    particle.angle += 0.015;

    particle.x += Math.cos(particle.angle) * particle.speed;
    particle.y += Math.sin(particle.angle) * particle.speed;

    // Draw particle trail
    ctx.beginPath();
    ctx.moveTo(oldX, oldY);
    ctx.lineTo(particle.x, particle.y);

    ctx.strokeStyle = "#4fd1c5";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wrap particles around the canvas
    if (particle.x < 0) particle.x = canvas.width;
    if (particle.x > canvas.width) particle.x = 0;
    if (particle.y < 0) particle.y = canvas.height;
    if (particle.y > canvas.height) particle.y = 0;
  });

  requestAnimationFrame(animate);
}

// Initialize the sketch
resizeCanvas();
createParticles();
animate();

// Adjust when browser size changes
window.addEventListener("resize", () => {
  resizeCanvas();
  createParticles();
});

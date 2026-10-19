const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let time = 0;

// Set canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Recursive branching function
function drawBranch(length, depth, angle, growth) {
  // Stop when maximum recursion is reached
  if (depth === 0 || length < 2) {
    return;
  }

  // Each branch grows progressively
  const progress = Math.max(0, Math.min(1, growth));

  if (progress <= 0) {
    return;
  }

  const visibleLength = length * progress;

  // Set branch appearance
  ctx.lineWidth = Math.max(0.7, depth * 0.7);

  ctx.strokeStyle = depth < 3 ? "#a6c4ac" : "#d3dfd7";

  // Draw the current branch
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -visibleLength);
  ctx.stroke();

  // Wait until branch is fully grown
  if (progress < 1) {
    return;
  }

  // Move to the end of the branch
  ctx.save();
  ctx.translate(0, -length);

  // Draw left branch
  ctx.save();
  ctx.rotate(-angle);

  drawBranch(length * 0.74, depth - 1, angle, growth - 1);

  ctx.restore();

  // Draw right branch
  ctx.save();
  ctx.rotate(angle);

  drawBranch(length * 0.74, depth - 1, angle, growth - 1);

  ctx.restore();

  ctx.restore();
}

// Animation loop
function animate() {
  // Clear canvas
  ctx.fillStyle = "#10151b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Position tree at bottom center
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height * 0.94);

  // Tree parameters
  const initialLength = Math.min(canvas.width * 0.11, canvas.height * 0.23);

  const depth = 10;

  // Slowly oscillating branching angle
  const branchAngle = 0.39 + Math.sin(time * 0.8) * 0.12;

  // Progressively reveal the branches
  const growth = (time % 19) / 1.5;

  drawBranch(initialLength, depth, branchAngle, growth);

  ctx.restore();

  // Advance time
  time += 0.013;

  requestAnimationFrame(animate);
}

// Initialize
resizeCanvas();
animate();

window.addEventListener("resize", resizeCanvas);

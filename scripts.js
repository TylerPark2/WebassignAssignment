const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

let player = { x: 400, y: 300, size: 20, speed: 3, health: 100 };
let zombies = [];
let bullets = [];
let score = 0;
let wave = 1;
let ammo = 30;

const keys = {};

// Listen for key events
document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));
canvas.addEventListener("click", shootBullet);

function update() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player movement
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  // Prevent leaving canvas
  player.x = Math.max(0, Math.min(canvas.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height, player.y));

  // Draw player
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);

  // Update zombies
  zombies.forEach((zombie, i) => {
    const angle = Math.atan2(player.y - zombie.y, player.x - zombie.x);
    zombie.x += Math.cos(angle) * zombie.speed;
    zombie.y += Math.sin(angle) * zombie.speed;

    // Draw zombie
    ctx.fillStyle = "green";
    ctx.fillRect(zombie.x - zombie.size / 2, zombie.y - zombie.size / 2, zombie.size, zombie.size);

    // Collision with player
    if (getDistance(player, zombie) < player.size) {
      player.health -= 1;
      if (player.health <= 0) {
        alert("Game Over!");
        resetGame();
      }
    }
  });

  // Update bullets
  bullets.forEach((bullet, i) => {
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;

    // Draw bullet
    ctx.fillStyle = "red";
    ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);

    // Check for collision with zombies
    zombies.forEach((zombie, j) => {
      if (getDistance(bullet, zombie) < zombie.size) {
        bullets.splice(i, 1);
        zombies.splice(j, 1);
        score += 10;
      }
    });

    // Remove bullets out of bounds
    if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
      bullets.splice(i, 1);
    }
  });

  // Spawn new wave if no zombies left
  if (zombies.length === 0) spawnWave();

  // Update HUD
  document.getElementById("health").textContent = player.health;
  document.getElementById("ammo").textContent = ammo;
  document.getElementById("score").textContent = score;
  document.getElementById("wave").textContent = wave;

  requestAnimationFrame(update);
}

function shootBullet(e) {
  if (ammo > 0) {
    const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
    bullets.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(angle) * 5,
      dy: Math.sin(angle) * 5,
    });
    ammo--;
  }
}

function spawnWave() {
  wave++;
  for (let i = 0; i < wave * 5; i++) {
    zombies.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 20,
      speed: 1 + wave * 0.1,
    });
  }
}

function resetGame() {
  player.health = 100;
  zombies = [];
  bullets = [];
  score = 0;
  wave = 1;
  ammo = 30;
}

function getDistance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

update();

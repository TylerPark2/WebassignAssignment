const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const healthSpan = document.getElementById('health');
const scoreSpan = document.getElementById('score');
const waveSpan = document.getElementById('wave');
const ammoSpan = document.getElementById('ammo');
const gameOverDiv = document.getElementById('gameOver');

const customizeBtn = document.getElementById('customizeBtn');
const colorCustomizer = document.getElementById('colorCustomizer');
const hueSlider = document.getElementById('hueSlider');
const saturationSlider = document.getElementById('saturationSlider');
const lightnessSlider = document.getElementById('lightnessSlider');
const colorPreview = document.getElementById('colorPreview');

// Player color customization
let playerColor = {
  hue: 0,
  saturation: 100,
  lightness: 50
};

// Customize button toggle
customizeBtn.addEventListener('click', () => {
  colorCustomizer.classList.toggle('active');
});

// Color sliders update
[hueSlider, saturationSlider, lightnessSlider].forEach(slider => {
  slider.addEventListener('input', updatePlayerColor);
});

function updatePlayerColor() {
  playerColor.hue = hueSlider.value;
  playerColor.saturation = saturationSlider.value;
  playerColor.lightness = lightnessSlider.value;

  const hslColor = `hsl(${playerColor.hue}, ${playerColor.saturation}%, ${playerColor.lightness}%)`;
  colorPreview.style.backgroundColor = hslColor;
}


let gameState = {
  player: {
    x: 0,
    y: 0,
    speed: 5,
    sprintSpeed: 8,
    health: 100,
    score: 0,
    ammo: 30,
    radius: 20
  },
  zombies: [],
  wave: 1,
  projectiles: [],
  pickups: [],
  keys: {},
  mousePos: { x: 0, y: 0 },
  gameOver: false
};


const TICK_RATE = 60;
const ZOMBIE_SPAWN_RATE = 3000;
const PICKUP_SPAWN_RATE = 10000;
const DAMAGE_COOLDOWN = 1000;
let lastDamageTime = 0;
let lastSpawnTime = Date.now();
let lastPickupSpawn = Date.now();

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gameState.player.x = canvas.width / 2;
  gameState.player.y = canvas.height / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.addEventListener('keydown', e => gameState.keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => gameState.keys[e.key.toLowerCase()] = false);
window.addEventListener('mousemove', e => {
  gameState.mousePos.x = e.clientX;
  gameState.mousePos.y = e.clientY;
});
window.addEventListener('mousedown', shoot);
restartBtn.addEventListener('click', restartGame);

function shoot() {
  if (gameState.gameOver || gameState.player.ammo <= 0) return;

  const angle = Math.atan2(
    gameState.mousePos.y - gameState.player.y,
    gameState.mousePos.x - gameState.player.x
  );

  gameState.projectiles.push({
    x: gameState.player.x,
    y: gameState.player.y,
    dx: Math.cos(angle) * 10,
    dy: Math.sin(angle) * 10,
    radius: 5
  });

  gameState.player.ammo--;
  ammoSpan.textContent = gameState.player.ammo;
}

function spawnZombie() {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  switch (side) {
    case 0:
      x = Math.random() * canvas.width;
      y = -50;
      break;
    case 1:
      x = canvas.width + 50;
      y = Math.random() * canvas.height;
      break;
    case 2:
      x = Math.random() * canvas.width;
      y = canvas.height + 50;
      break;
    case 3:
      x = -50;
      y = Math.random() * canvas.height;
      break;
  }

  const speed = 2 + (gameState.wave * 0.5);
  gameState.zombies.push({ x, y, speed, radius: 20 });
}

function spawnPickup() {
  const type = Math.random() < 0.7 ? 'ammo' : 'health';
  gameState.pickups.push({
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * (canvas.height - 100) + 50,
    type,
    radius: 15
  });
}

function updatePlayer() {
  const speed = gameState.keys['shift'] ?
    gameState.player.sprintSpeed :
    gameState.player.speed;

  if (gameState.keys['w']) gameState.player.y -= speed;
  if (gameState.keys['s']) gameState.player.y += speed;
  if (gameState.keys['a']) gameState.player.x -= speed;
  if (gameState.keys['d']) gameState.player.x += speed;

  gameState.player.x = Math.max(20, Math.min(canvas.width - 20, gameState.player.x));
  gameState.player.y = Math.max(20, Math.min(canvas.height - 20, gameState.player.y));
}

function updateZombies() {
  for (let zombie of gameState.zombies) {
    const dx = gameState.player.x - zombie.x;
    const dy = gameState.player.y - zombie.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    zombie.x += (dx / dist) * zombie.speed;
    zombie.y += (dy / dist) * zombie.speed;

    if (dist < zombie.radius + gameState.player.radius) {
      const now = Date.now();
      if (now - lastDamageTime > DAMAGE_COOLDOWN) {
        gameState.player.health -= 10;
        healthSpan.textContent = gameState.player.health;
        lastDamageTime = now;

        if (gameState.player.health <= 0) {
          gameState.gameOver = true;
          gameOverDiv.style.display = 'block';
        }
      }
    }
  }
}

function updateProjectiles() {
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    proj.x += proj.dx;
    proj.y += proj.dy;

    if (proj.x < 0 || proj.x > canvas.width ||
      proj.y < 0 || proj.y > canvas.height) {
      gameState.projectiles.splice(i, 1);
      continue;
    }

    for (let j = gameState.zombies.length - 1; j >= 0; j--) {
      const zombie = gameState.zombies[j];
      const dx = proj.x - zombie.x;
      const dy = proj.y - zombie.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < proj.radius + zombie.radius) {
        gameState.zombies.splice(j, 1);
        gameState.projectiles.splice(i, 1);
        gameState.player.score += 100;
        scoreSpan.textContent = gameState.player.score;
        break;
      }
    }
  }
}

function updatePickups() {
  for (let i = gameState.pickups.length - 1; i >= 0; i--) {
    const pickup = gameState.pickups[i];
    const dx = pickup.x - gameState.player.x;
    const dy = pickup.y - gameState.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < pickup.radius + gameState.player.radius) {
      if (pickup.type === 'ammo') {
        gameState.player.ammo += 30;
        ammoSpan.textContent = gameState.player.ammo;
      } else {
        gameState.player.health = Math.min(100, gameState.player.health + 30);
        healthSpan.textContent = gameState.player.health;
      }
      gameState.pickups.splice(i, 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(gameState.player.x, gameState.player.y,
    gameState.player.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${playerColor.hue}, ${playerColor.saturation}%, ${playerColor.lightness}%)`;;
  ctx.fill();

  ctx.fillStyle = 'green';
  for (let zombie of gameState.zombies) {
    ctx.beginPath();
    ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'yellow';
  for (let proj of gameState.projectiles) {
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let pickup of gameState.pickups) {
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
    ctx.fillStyle = pickup.type === 'ammo' ? 'orange' : 'red';
    ctx.fill();
  }
}

function gameLoop() {
  if (!gameState.gameOver) {
    const now = Date.now();
    if (now - lastSpawnTime > ZOMBIE_SPAWN_RATE) {
      spawnZombie();
      lastSpawnTime = now;
    }

    if (now - lastPickupSpawn > PICKUP_SPAWN_RATE) {
      spawnPickup();
      lastPickupSpawn = now;
    }

    if (gameState.zombies.length === 0) {
      gameState.wave++;
      waveSpan.textContent = gameState.wave;
      for (let i = 0; i < gameState.wave * 2; i++) {
        spawnZombie();
      }
    }

    updatePlayer();
    updateZombies();
    updateProjectiles();
    updatePickups();
    draw();
  }
  requestAnimationFrame(gameLoop);
}

function restartGame() {
  gameState = {
    player: {
      x: canvas.width / 2,
      y: canvas.height / 2,
      speed: 5,
      sprintSpeed: 8,
      health: 100,
      score: 0,
      ammo: 30,
      radius: 20
    },
    zombies: [],
    wave: 1,
    projectiles: [],
    pickups: [],
    keys: {},
    mousePos: { x: 0, y: 0 },
    gameOver: false
  };

  healthSpan.textContent = gameState.player.health;
  scoreSpan.textContent = gameState.player.score;
  waveSpan.textContent = gameState.wave;
  ammoSpan.textContent = gameState.player.ammo;
  gameOverDiv.style.display = 'none';
  colorCustomizer.classList.remove('active');

  lastSpawnTime = Date.now();
  lastPickupSpawn = Date.now();

  for (let i = 0; i < gameState.wave * 2; i++) {
    spawnZombie();
  }
}

gameLoop();
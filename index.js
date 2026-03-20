const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 576;
const TILE_SIZE = 48;
const offset = { x: -750, y: -600 };
const keys = {
  w: { pressed: false },
  a: { pressed: false },
  s: { pressed: false },
  d: { pressed: false },
};

// --- CLASES ---
class Boundary {
  constructor({ position }) {
    this.position = position;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE;
  }
  draw() {
    ctx.fillStyle = "rgba(255, 0, 0, 0.0)"; // Cambia a 0.3 para ver las colisiones
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
}

class Sprite {
  constructor({ position, image, frames = { max: 1 }, sprites }) {
    this.position = position;
    this.image = image;
    this.frames = { ...frames, val: 0, elapsed: 0 };
    this.image.onload = () => {
      this.width = this.image.width / this.frames.max;
      this.height = this.image.height;
    };
    this.moving = false;
    this.sprites = sprites;
  }

  draw() {
    ctx.drawImage(
      this.image,
      this.frames.val * (this.image.width / this.frames.max),
      0,
      this.image.width / this.frames.max,
      this.image.height,
      this.position.x,
      this.position.y,
      this.image.width / this.frames.max,
      this.image.height,
    );

    if (!this.moving) return;

    if (this.frames.max > 1) {
      this.frames.elapsed++;
    }

    if (this.frames.elapsed % 10 === 0) {
      if (this.frames.val < this.frames.max - 1) this.frames.val++;
      else this.frames.val = 0;
    }
  }
}

// --- INICIALIZACIÓN ---
const bgImg = new Image();
bgImg.src = "./img/Pellet Town.png";

const pDown = new Image();
pDown.src = "./img/playerDown.png";
const pUp = new Image();
pUp.src = "./img/playerUp.png";
const pLeft = new Image();
pLeft.src = "./img/playerLeft.png";
const pRight = new Image();
pRight.src = "./img/playerRight.png";

const player = new Sprite({
  position: {
    x: canvas.width / 2 - 192 / 4 / 2,
    y: canvas.height / 2 - 68 / 2,
  },
  image: pDown,
  frames: { max: 4 },
  sprites: { up: pUp, down: pDown, left: pLeft, right: pRight },
});

const background = new Sprite({
  position: { x: offset.x, y: offset.y },
  image: bgImg,
});

const MAP_WIDTH = 70; // Ajusta este número al ancho de tu mapa en tiles
const collisions2D = [];
for (let i = 0; i < collisionMap.length; i += MAP_WIDTH) {
  collisions2D.push(collisionMap.slice(i, i + MAP_WIDTH));
}
const battleZoneMap = [];
for (let i = 0; i < battleZonesData.length; i += MAP_WIDTH) {
  battleZoneMap.push(battleZonesData.slice(i, i + MAP_WIDTH));
}

const boundaries = [];
collisions2D.forEach((row, i) => {
  row.forEach((symbol, j) => {
    if (symbol === 1025) {
      // Tu valor de colisión
      boundaries.push(
        new Boundary({
          position: {
            x: j * TILE_SIZE + offset.x,
            y: i * TILE_SIZE + offset.y,
          },
        }),
      );
    }
  });
});

const battleZonesBoundaries = [];
battleZoneMap.forEach((row, i) => {
  row.forEach((symbol, j) => {
    if (symbol === 1025) {
      // Tu valor de zona de batalla
      battleZonesBoundaries.push(
        new Boundary({
          position: {
            x: j * TILE_SIZE + offset.x,
            y: i * TILE_SIZE + offset.y,
          },
        }),
      );
    }
  });
});

// Importante: Actualiza la lista de movables después de crear las boundaries
const movables = [background, ...boundaries, ...battleZonesBoundaries];

// --- LÓGICA DE COLISIÓN ---
function checkCollision({ rect1, rect2 }) {
  // Reducimos un poco la hitbox del jugador para que no sea un bloque exacto
  // Esto permite que el personaje "entre" un poco en los tiles (efecto 2.5D)
  const padding = 4;
  return (
    rect1.position.x + rect1.width - padding >= rect2.position.x &&
    rect1.position.x + padding <= rect2.position.x + rect2.width &&
    rect1.position.y + rect1.height - padding >= rect2.position.y &&
    rect1.position.y + rect1.height / 2 <= rect2.position.y + rect2.height
  );
}

// --- FUNCIÓN AUXILIAR PARA ÁREA DE SOLAPAMIENTO ---
function getOverlappingArea(rect1, rect2) {
  const overlapX = Math.max(
    0,
    Math.min(rect1.position.x + rect1.width, rect2.position.x + rect2.width) -
      Math.max(rect1.position.x, rect2.position.x),
  );
  const overlapY = Math.max(
    0,
    Math.min(rect1.position.y + rect1.height, rect2.position.y + rect2.height) -
      Math.max(rect1.position.y, rect2.position.y),
  );
  return overlapX * overlapY;
}

// --- BUCLE PRINCIPAL ---
function animate() {
  globalThis.requestAnimationFrame(animate);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  background.draw();
  boundaries.forEach((b) => b.draw());
  battleZonesBoundaries.forEach((b) => b.draw()); // Solo para debug
  player.draw();

  let moving = false;
  player.moving = false;

  // --- DETECCIÓN DE ZONAS DE BATALLA ---
  // Se dispara solo si el jugador se está moviendo
  if (keys.w.pressed || keys.a.pressed || keys.s.pressed || keys.d.pressed) {
    for (let b of battleZonesBoundaries) {
      const area = getOverlappingArea(player, b);

      // Si el jugador pisa más de la mitad de su tamaño en la zona
      if (area > (player.width * player.height) / 2) {
        // Aquí podrías agregar un factor aleatorio para que no sea instantáneo
        if (Math.random() < 0.02) {
          // 2% de probabilidad por frame de movimiento
          console.log("¡Iniciando Batalla!");
          // Aquí activarías el estado de batalla y detendrías la animación
        }
        break;
      }
    }
  }

  const speed = 3;

  // --- LÓGICA EJE VERTICAL (W / S) ---
  if (keys.w.pressed || keys.s.pressed) {
    player.moving = true;
    let movingVertical = true;
    const vSpeed = keys.w.pressed ? speed : -speed;
    player.image = keys.w.pressed ? player.sprites.up : player.sprites.down;

    for (let b of boundaries) {
      if (
        checkCollision({
          rect1: player,
          rect2: {
            ...b,
            position: { x: b.position.x, y: b.position.y + vSpeed },
          },
        })
      ) {
        movingVertical = false;
        break;
      }
    }
    if (movingVertical) movables.forEach((m) => (m.position.y += vSpeed));
  }

  // --- LÓGICA EJE HORIZONTAL (A / D) ---
  if (keys.a.pressed || keys.d.pressed) {
    player.moving = true;
    let movingHorizontal = true;
    const hSpeed = keys.a.pressed ? speed : -speed;

    if (!keys.w.pressed && !keys.s.pressed) {
      player.image = keys.a.pressed
        ? player.sprites.left
        : player.sprites.right;
    }

    for (let b of boundaries) {
      if (
        checkCollision({
          rect1: player,
          rect2: {
            ...b,
            position: { x: b.position.x + hSpeed, y: b.position.y },
          },
        })
      ) {
        movingHorizontal = false;
        break;
      }
    }
    if (movingHorizontal) movables.forEach((m) => (m.position.x += hSpeed));
  }
}

animate();

// --- EVENT LISTENERS ---
globalThis.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "w":
    case "ArrowUp":
      keys.w.pressed = true;
      break;
    case "s":
    case "ArrowDown":
      keys.s.pressed = true;
      break;
    case "a":
    case "ArrowLeft":
      keys.a.pressed = true;
      break;
    case "d":
    case "ArrowRight":
      keys.d.pressed = true;
      break;
  }
});

globalThis.addEventListener("keyup", (e) => {
  switch (e.key) {
    case "w":
    case "ArrowUp":
      keys.w.pressed = false;
      break;
    case "s":
    case "ArrowDown":
      keys.s.pressed = false;
      break;
    case "a":
    case "ArrowLeft":
      keys.a.pressed = false;
      break;
    case "d":
    case "ArrowRight":
      keys.d.pressed = false;
      break;
  }
});

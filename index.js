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
  constructor({
    position,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    isEnemy = false,
    health = 100,
  }) {
    this.position = position;
    this.image = image;
    this.frames = { ...frames, val: 0, elapsed: 0 };
    this.health = health;

    if (this.image.complete) {
      this.width = this.image.width / this.frames.max;
      this.height = this.image.height;
    } else {
      this.image.onload = () => {
        this.width = this.image.width / this.frames.max;
        this.height = this.image.height;
      };
    }

    this.animate = animate;
    this.sprites = sprites;
    this.isEnemy = isEnemy;
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

    if (!this.animate) return;

    if (this.frames.max > 1) {
      this.frames.elapsed++;
    }

    if (this.frames.elapsed % this.frames.hold === 0) {
      if (this.frames.val < this.frames.max - 1) this.frames.val++;
      else this.frames.val = 0;
    }
  }

  attack({ attack, recipient, renderedSprites }) {
    const damage = Math.floor(Math.random() * attack.damage) + 1;
    recipient.health = Math.max(0, recipient.health - damage);

    let healthBar = recipient.isEnemy ? "#draggleHealth" : "#embyHealth";

    switch (attack.name) {
      case "Fireball": {
        const fireballImage = new Image();
        fireballImage.src = "./img/fireball.png";
        const fireball = new Sprite({
          position: { x: this.position.x, y: this.position.y },
          image: fireballImage,
          frames: { max: 4, hold: 10 },
          animate: true,
        });
        renderedSprites.splice(1, 0, fireball);

        gsap.to(fireball.position, {
          x: recipient.position.x,
          y: recipient.position.y,
          onComplete: () => {
            gsap.to(healthBar, {
              width: recipient.health + "%",
            });

            gsap.to(recipient.position, {
              x: recipient.position.x + 10,
              yoyo: true,
              repeat: 5,
              duration: 0.08,
            });

            gsap.to(recipient, {
              opacity: 0,
              repeat: 5,
              yoyo: true,
              duration: 0.08,
              onComplete: () => {
                recipient.opacity = 1;

                if (recipient.health <= 0) {
                  endBattle(recipient, renderedSprites);
                }
              },
            });
            renderedSprites.splice(1, 1);
          },
        });
        break;
      }
      case "Tackle": {
        const tl = gsap.timeline();

        let movementDistance = 20;
        if (this.isEnemy) movementDistance = -20;

        tl.to(this.position, {
          x: this.position.x - movementDistance,
        })
          .to(this.position, {
            x: this.position.x + movementDistance * 2,
            duration: 0.1,
            onComplete: () => {
              gsap.to(healthBar, {
                width: recipient.health + "%",
              });

              gsap.to(recipient.position, {
                x: recipient.position.x + 10,
                yoyo: true,
                repeat: 5,
                duration: 0.08,
              });

              gsap.to(recipient, {
                opacity: 0,
                repeat: 5,
                yoyo: true,
                duration: 0.08,
                onComplete: () => {
                  recipient.opacity = 1;

                  if (recipient.health <= 0) {
                    endBattle(recipient, renderedSprites);
                  }
                },
              });
            },
          })
          .to(this.position, {
            x: this.position.x,
          });
        break;
      }
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
  frames: { max: 4, hold: 10 },
  sprites: { up: pUp, down: pDown, left: pLeft, right: pRight },
});

const background = new Sprite({
  position: { x: offset.x, y: offset.y },
  image: bgImg,
});

const MAP_WIDTH = 70;
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

const movables = [background, ...boundaries, ...battleZonesBoundaries];

// --- LÓGICA DE COLISIÓN ---
function checkCollision({ rect1, rect2 }) {
  const padding = 4;
  return (
    rect1.position.x + rect1.width - padding >= rect2.position.x &&
    rect1.position.x + padding <= rect2.position.x + rect2.width &&
    rect1.position.y + rect1.height - padding >= rect2.position.y &&
    rect1.position.y + rect1.height / 2 <= rect2.position.y + rect2.height
  );
}

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

const battle = {
  initiated: false,
};

let animationId;

// --- BUCLE PRINCIPAL (MUNDO LIBRE) ---
function animate() {
  animationId = globalThis.requestAnimationFrame(animate);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  background.draw();
  boundaries.forEach((b) => b.draw());
  battleZonesBoundaries.forEach((b) => b.draw());
  player.draw();

  player.animate = false;

  if (battle.initiated) return; // Si empezó la batalla, frenamos el movimiento

  if (keys.w.pressed || keys.a.pressed || keys.s.pressed || keys.d.pressed) {
    player.animate = true;

    for (let b of battleZonesBoundaries) {
      const area = getOverlappingArea(player, b);

      if (area > (player.width * player.height) / 2) {
        if (Math.random() < 0.02) {
          battle.initiated = true; // Activar batalla antes de cancelar el frame
          globalThis.cancelAnimationFrame(animationId);

          gsap.to("#overlappingDiv", {
            opacity: 1,
            repeat: 3,
            yoyo: true,
            duration: 0.4,
            onComplete() {
              gsap.to("#overlappingDiv", {
                opacity: 1,
                duration: 0.4,
                onComplete() {
                  // Mostrar Menú de Ataques
                  document.querySelector("#topHealthBar").style.display =
                    "block";
                  document.querySelector("#bottomHealthBar").style.display =
                    "block";
                  document.querySelector("#barAttackInterface").style.display =
                    "flex";

                  // Iniciar Batalla
                  animateBattle();

                  gsap.to("#overlappingDiv", {
                    opacity: 0,
                    duration: 0.4,
                  });
                },
              });
            },
          });
          break;
        }
      }
    }
  }

  const speed = 3;

  if (keys.w.pressed || keys.s.pressed) {
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

  if (keys.a.pressed || keys.d.pressed) {
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

const battleBackgroundImage = new Image();
battleBackgroundImage.src = "./img/battleBackground.png";
const battleBackgroundSprite = new Sprite({
  position: { x: 0, y: 0 },
  image: battleBackgroundImage,
});

const draggleBackgroundImage = new Image();
draggleBackgroundImage.src = "./img/draggleSprite.png";
const draggle = new Sprite({
  position: { x: 800, y: 100 },
  image: draggleBackgroundImage,
  frames: { max: 4, hold: 30 },
  animate: true,
  isEnemy: true,
});

const embyBackgroundImage = new Image();
embyBackgroundImage.src = "./img/embySprite.png";
const emby = new Sprite({
  position: { x: 280, y: 325 },
  image: embyBackgroundImage,
  frames: { max: 4, hold: 30 },
  animate: true,
});

const renderedSprites = [battleBackgroundSprite, draggle, emby];

let battleAnimationId; // Nuevo: Para controlar el loop de batalla
function animateBattle() {
  battleAnimationId = globalThis.requestAnimationFrame(animateBattle);

  renderedSprites.forEach((sprite) => {
    sprite.draw();
  });
}

function endBattle(recipient, renderedSprites) {
  gsap.to(recipient.position, {
    y: recipient.position.y + 100,
    duration: 0.5,
  });

  gsap.to(recipient, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      gsap.to("#overlappingDiv", {
        opacity: 1,
        duration: 0.5,
        onComplete: () => {
          // 1. Frenar la animación de batalla
          globalThis.cancelAnimationFrame(battleAnimationId);
          
          // 2. IMPORTANTE: Limpiar el ID del bucle principal antes de reiniciarlo
          // Esto evita que se acumulen múltiples llamadas a animate()
          globalThis.cancelAnimationFrame(animationId); 

          battle.initiated = false;
          
          document.querySelector("#topHealthBar").style.display = "none";
          document.querySelector("#bottomHealthBar").style.display = "none";
          document.querySelector("#barAttackInterface").style.display = "none";

          recipient.health = 100;
          recipient.position.y -= 100;

          const draggleBar = document.querySelector("#draggleHealth");
          if (draggleBar) draggleBar.style.width = "100%";

          // 3. Reiniciar el bucle de forma limpia
          animate(); 

          gsap.to("#overlappingDiv", {
            opacity: 0,
            duration: 0.5,
          });
        },
      });
    },
  });
}

document.querySelector("#attack1").addEventListener("click", () => {
  emby.attack({
    attack: { name: "Tackle", damage: 10 },
    recipient: draggle,
    renderedSprites: renderedSprites,
  });
});

document.querySelector("#attack2").addEventListener("click", () => {
  emby.attack({
    attack: { name: "Fireball", damage: 25 },
    recipient: draggle,
    renderedSprites: renderedSprites,
  });
});

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

// Iniciamos UNICAMENTE el mapa
animate();

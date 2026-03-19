const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 576;

const TILE_SIZE = 48; 
const offset = { x: -750, y: -600 };

// --- CLASES ---
class Boundary {
    constructor({ position }) {
        this.position = position;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
    }
    draw() {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.0)'; // Cambia a 0.3 para ver las colisiones
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
            this.image.height
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

const pDown = new Image(); pDown.src = "./img/playerDown.png";
const pUp = new Image(); pUp.src = "./img/playerUp.png";
const pLeft = new Image(); pLeft.src = "./img/playerLeft.png";
const pRight = new Image(); pRight.src = "./img/playerRight.png";

const player = new Sprite({
    position: {
        x: canvas.width / 2 - 192 / 4 / 2,
        y: canvas.height / 2 - 68 / 2
    },
    image: pDown,
    frames: { max: 4 },
    sprites: { up: pUp, down: pDown, left: pLeft, right: pRight }
});

const background = new Sprite({
    position: { x: offset.x, y: offset.y },
    image: bgImg
});

const MAP_WIDTH = 70; // Ajusta este número al ancho de tu mapa en tiles
const collisions2D = [];
for (let i = 0; i < collisionMap.length; i += MAP_WIDTH) {
    collisions2D.push(collisionMap.slice(i, i + MAP_WIDTH));
}

const boundaries = [];
collisions2D.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 1025) { // Tu valor de colisión
            boundaries.push(new Boundary({
                position: {
                    x: j * TILE_SIZE + offset.x,
                    y: i * TILE_SIZE + offset.y
                }
            }));
        }
    });
});

// Importante: Actualiza la lista de movables después de crear las boundaries
const movables = [background, ...boundaries];

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

const keys = {
    w: { pressed: false }, a: { pressed: false },
    s: { pressed: false }, d: { pressed: false }
};

// --- BUCLE PRINCIPAL ---
function animate() {
    globalThis.requestAnimationFrame(animate);
    
    background.draw();
    boundaries.forEach(b => b.draw());
    player.draw();

    let moving = true;
    player.moving = false;

    // Movimiento con predicción de colisión
    const speed = 3;

    if (keys.w.pressed) {
        player.moving = true;
        player.image = player.sprites.up;
        for (let b of boundaries) {
            if (checkCollision({
                rect1: player,
                rect2: { ...b, position: { x: b.position.x, y: b.position.y + speed } }
            })) {
                moving = false;
                break;
            }
        }
        if (moving) movables.forEach(m => m.position.y += speed);
    } else if (keys.s.pressed) {
        player.moving = true;
        player.image = player.sprites.down;
        for (let b of boundaries) {
            if (checkCollision({
                rect1: player,
                rect2: { ...b, position: { x: b.position.x, y: b.position.y - speed } }
            })) {
                moving = false;
                break;
            }
        }
        if (moving) movables.forEach(m => m.position.y -= speed);
    } else if (keys.a.pressed) {
        player.moving = true;
        player.image = player.sprites.left;
        for (let b of boundaries) {
            if (checkCollision({
                rect1: player,
                rect2: { ...b, position: { x: b.position.x + speed, y: b.position.y } }
            })) {
                moving = false;
                break;
            }
        }
        if (moving) movables.forEach(m => m.position.x += speed);
    } else if (keys.d.pressed) {
        player.moving = true;
        player.image = player.sprites.right;
        for (let b of boundaries) {
            if (checkCollision({
                rect1: player,
                rect2: { ...b, position: { x: b.position.x - speed, y: b.position.y } }
            })) {
                moving = false;
                break;
            }
        }
        if (moving) movables.forEach(m => m.position.x -= speed);
    }
}

animate();

// --- EVENT LISTENERS ---
globalThis.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'w': case 'ArrowUp': keys.w.pressed = true; break;
        case 's': case 'ArrowDown': keys.s.pressed = true; break;
        case 'a': case 'ArrowLeft': keys.a.pressed = true; break;
        case 'd': case 'ArrowRight': keys.d.pressed = true; break;
    }
});

globalThis.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'w': case 'ArrowUp': keys.w.pressed = false; break;
        case 's': case 'ArrowDown': keys.s.pressed = false; break;
        case 'a': case 'ArrowLeft': keys.a.pressed = false; break;
        case 'd': case 'ArrowRight': keys.d.pressed = false; break;
    }
});
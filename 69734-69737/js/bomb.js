class Bomb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 35;
        this.rotation = 0;
        this.rotationSpeed = Utils.random(-0.05, 0.05);
        this.active = true;
        this.gravity = 0.25;
        this.exploded = false;
        this.explosionParticles = [];
        this.fuseTimer = 0;
    }

    launch(canvasWidth, canvasHeight) {
        this.x = Utils.random(this.radius, canvasWidth - this.radius);
        this.y = canvasHeight + this.radius;
        this.vx = Utils.random(-2.5, 2.5);
        this.vy = Utils.random(-13, -10);
        this.active = true;
        this.exploded = false;
        this.explosionParticles = [];
    }

    update(slowMotion = false) {
        if (!this.active) return;

        const timeScale = slowMotion ? 0.4 : 1;

        if (this.exploded) {
            this.explosionParticles.forEach(p => {
                p.vy += 0.1 * timeScale;
                p.x += p.vx * timeScale;
                p.y += p.vy * timeScale;
                p.life -= 1;
            });
            this.explosionParticles = this.explosionParticles.filter(p => p.life > 0);
            if (this.explosionParticles.length === 0) {
                this.active = false;
            }
        } else {
            this.vy += this.gravity * timeScale;
            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;
            this.rotation += this.rotationSpeed * timeScale;
            this.fuseTimer++;
        }
    }

    explode() {
        if (this.exploded) return;
        this.exploded = true;

        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = Utils.random(3, 8);
            this.explosionParticles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Utils.random(3, 8),
                color: i % 2 === 0 ? '#f39c12' : '#e74c3c',
                life: 40
            });
        }
    }

    isOffScreen(canvasHeight) {
        if (this.exploded) return false;
        return this.y > canvasHeight + this.radius * 2 && this.vy > 0;
    }

    draw(ctx) {
        if (!this.active) return;

        if (this.exploded) {
            this.explosionParticles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * (p.life / 40), 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 40;
                ctx.fill();
                ctx.globalAlpha = 1;
            });
        } else {
            this.drawBomb(ctx);
        }
    }

    drawBomb(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(-8, -8, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#4a4a4a');
        gradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-10, -10, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.quadraticCurveTo(10, -this.radius - 15, 5, -this.radius - 25);
        ctx.stroke();

        const flicker = Math.sin(this.fuseTimer * 0.3) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(5, -this.radius - 25, 5 + flicker * 3, 0, Math.PI * 2);
        const fuseGradient = ctx.createRadialGradient(5, -this.radius - 25, 0, 5, -this.radius - 25, 8);
        fuseGradient.addColorStop(0, '#ffff00');
        fuseGradient.addColorStop(0.5, '#ff6600');
        fuseGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = fuseGradient;
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, 0);

        ctx.restore();
    }
}

class BombManager {
    constructor() {
        this.bombs = [];
        this.maxBombs = 3;
        this.spawnTimer = 0;
        this.spawnInterval = 200;
        this.bombChance = 0.15;
    }

    update(canvasWidth, canvasHeight, slowMotion = false) {
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval && this.bombs.length < this.maxBombs) {
            this.spawnTimer = 0;
            this.spawnInterval = Utils.randomInt(150, 300);
            if (Math.random() < this.bombChance) {
                this.spawnBomb(canvasWidth, canvasHeight);
            }
        }

        this.bombs.forEach(bomb => bomb.update(slowMotion));
        this.bombs = this.bombs.filter(bomb => bomb.active);
    }

    spawnBomb(canvasWidth, canvasHeight) {
        const bomb = new Bomb(0, 0);
        bomb.launch(canvasWidth, canvasHeight);
        this.bombs.push(bomb);
    }

    checkSlices(trailPoints) {
        if (trailPoints.length < 2) return false;

        const p1 = trailPoints[trailPoints.length - 2];
        const p2 = trailPoints[trailPoints.length - 1];

        for (const bomb of this.bombs) {
            if (bomb.exploded) continue;

            if (Utils.lineCircleCollision(p1.x, p1.y, p2.x, p2.y, bomb.x, bomb.y, bomb.radius)) {
                bomb.explode();
                return true;
            }
        }

        return false;
    }

    checkMissed(canvasHeight) {
        this.bombs.forEach(bomb => {
            if (!bomb.exploded && bomb.isOffScreen(canvasHeight)) {
                bomb.active = false;
            }
        });
    }

    draw(ctx) {
        this.bombs.forEach(bomb => bomb.draw(ctx));
    }

    explodeAll() {
        this.bombs.forEach(bomb => {
            if (!bomb.exploded) {
                bomb.explode();
            }
        });
    }

    reset() {
        this.bombs = [];
        this.spawnTimer = 0;
    }
}

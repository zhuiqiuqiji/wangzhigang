class Particle {
    constructor(x, y, color, velocityX, velocityY, life, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = velocityX;
        this.vy = velocityY;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.alpha = 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime / 16;
        this.y += this.vy * deltaTime / 16;
        this.life -= deltaTime;
        this.alpha = this.life / this.maxLife;
        this.vx *= 0.97;
        this.vy *= 0.97;
        this.rotation += this.rotationSpeed;
    }

    isDead() {
        return this.life <= 0;
    }

    draw(ctx, gridSize, camera) {
        const screenPos = camera.worldToScreen(this.x, this.y);
        ctx.save();
        ctx.globalAlpha = this.alpha * this.alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.arc(0, 0, this.size * this.alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class ParticleSystem {
    constructor(maxParticles = 500) {
        this.particles = [];
        this.maxParticles = maxParticles;
    }

    emit(x, y, color, count = 10, spread = 2, speed = 3, life = 500, size = 4) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }

            const angle = Math.random() * Math.PI * 2;
            const velocity = speed * (0.5 + Math.random() * 0.5);
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            const offsetX = (Math.random() - 0.5) * spread;
            const offsetY = (Math.random() - 0.5) * spread;

            this.particles.push(new Particle(
                x + offsetX,
                y + offsetY,
                color,
                vx,
                vy,
                life * (0.5 + Math.random() * 0.5),
                size
            ));
        }
    }

    emitExplosion(x, y, colors, count = 30) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }

            const angle = Math.random() * Math.PI * 2;
            const velocity = 2 + Math.random() * 6;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            const color = colors[Math.floor(Math.random() * colors.length)];

            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 0.5,
                y + (Math.random() - 0.5) * 0.5,
                color,
                vx,
                vy,
                400 + Math.random() * 600,
                3 + Math.random() * 5
            ));
        }
    }

    emitDeathExplosion(x, y, colors, count = 50) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }

            const angle = Math.random() * Math.PI * 2;
            const velocity = 3 + Math.random() * 8;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            const color = colors[Math.floor(Math.random() * colors.length)];

            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 1,
                y + (Math.random() - 0.5) * 1,
                color,
                vx,
                vy,
                500 + Math.random() * 800,
                4 + Math.random() * 6
            ));
        }
    }

    emitShieldBreak(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }

            const angle = Math.random() * Math.PI * 2;
            const velocity = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 0.5,
                y + (Math.random() - 0.5) * 0.5,
                '#22c55e',
                vx,
                vy,
                300 + Math.random() * 300,
                3 + Math.random() * 3
            ));
        }
    }

    emitTrail(x, y, color, size = 3) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift();
        }

        this.particles.push(new Particle(
            x + (Math.random() - 0.5) * 0.3,
            y + (Math.random() - 0.5) * 0.3,
            color,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            400,
            size
        ));
    }

    emitFoodCollect(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }

            const angle = Math.random() * Math.PI * 2;
            const velocity = 1 + Math.random() * 2;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            this.particles.push(new Particle(
                x,
                y,
                color,
                vx,
                vy,
                200 + Math.random() * 200,
                2 + Math.random() * 2
            ));
        }
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, gridSize, camera) {
        for (const particle of this.particles) {
            particle.draw(ctx, gridSize, camera);
        }
    }

    clear() {
        this.particles = [];
    }
}
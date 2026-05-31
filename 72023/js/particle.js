class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || Utils.random(-1, 1);
        this.vy = options.vy || Utils.random(-2, -0.5);
        this.size = options.size || Utils.random(2, 6);
        this.color = options.color || 'rgba(0, 229, 255, 0.6)';
        this.life = options.life || Utils.random(30, 90);
        this.maxLife = this.life;
        this.gravity = options.gravity || 0;
        this.shrink = options.shrink !== undefined ? options.shrink : true;
        this.active = true;
        this.type = options.type || 'normal';
    }

    update(dt) {
        if (this.type === 'lightRay') {
            this.life -= dt * 60;
            if (this.life <= 0) this.active = false;
            return;
        }

        if (this.type === 'floatParticle') {
            this.life -= dt * 60;
            if (this.life <= 0) this.active = false;
            this.x += this.vx * dt * 60;
            this.y += this.vy * dt * 60;
            this.vx += Math.sin(this.life * 0.1) * 0.02;
            return;
        }

        if (this.type === 'splash') {
            this.x += this.vx * dt * 60;
            this.y += this.vy * dt * 60;
            this.vy += 0.2 * dt * 60;
            this.life -= dt * 60;
            if (this.life <= 0) this.active = false;
            return;
        }

        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.vy += this.gravity * dt * 60;
        this.life -= dt * 60;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        if (this.type === 'lightRay') {
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha * 0.08;
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.moveTo(this.x - 20, this.y - 200);
            ctx.lineTo(this.x + 20, this.y - 200);
            ctx.lineTo(this.x + 60, this.y + 200);
            ctx.lineTo(this.x - 60, this.y + 200);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            return;
        }

        if (this.type === 'floatParticle') {
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha * 0.4;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        if (this.type === 'splash') {
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        const alpha = Math.max(0, this.life / this.maxLife);
        const currentSize = this.shrink ? this.size * alpha : this.size;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor(maxParticles = 200) {
        this.particles = [];
        this.maxParticles = maxParticles;
        this.floatParticles = [];
        this._initFloatParticles();
    }

    _initFloatParticles() {
        for (let i = 0; i < 30; i++) {
            this.floatParticles.push({
                x: Utils.random(0, window.innerWidth || 800),
                y: Utils.random(0, window.innerHeight || 600),
                vx: Utils.random(-0.2, 0.2),
                vy: Utils.random(-0.3, -0.1),
                size: Utils.random(1, 3),
                phase: Utils.random(0, Math.PI * 2),
                alpha: Utils.random(0.1, 0.4)
            });
        }
    }

    resize(canvasWidth, canvasHeight) {
        for (const p of this.floatParticles) {
            p.x = Utils.random(0, canvasWidth);
            p.y = Utils.random(0, canvasHeight);
        }
    }

    emit(x, y, count, options = {}) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }
            this.particles.push(new Particle(x, y, options));
        }
    }

    emitBubble(x, y, canvasWidth, canvasHeight) {
        this.emit(x, y, 1, {
            vx: Utils.random(-0.3, 0.3),
            vy: Utils.random(-1.2, -0.4),
            size: Utils.random(2, 5),
            color: 'rgba(150, 220, 255, 0.4)',
            life: Utils.random(80, 200),
            gravity: -0.01,
            shrink: false
        });
    }

    emitCollect(x, y, type) {
        const color = type === 'pearl'
            ? 'rgba(240, 248, 255, 0.9)'
            : type === 'rarePearl'
            ? 'rgba(200, 150, 255, 0.9)'
            : type === 'oxygenTank'
            ? 'rgba(79, 195, 247, 0.9)'
            : 'rgba(255, 217, 61, 0.9)';
        this.emit(x, y, 15, {
            vx: Utils.random(-4, 4),
            vy: Utils.random(-4, 4),
            size: Utils.random(2, 5),
            color: color,
            life: Utils.random(25, 45),
            gravity: 0.05,
            shrink: true
        });
    }

    emitDamage(x, y) {
        this.emit(x, y, 18, {
            vx: Utils.random(-5, 5),
            vy: Utils.random(-5, 5),
            size: Utils.random(3, 8),
            color: 'rgba(255, 80, 80, 0.9)',
            life: Utils.random(25, 45),
            gravity: 0.1,
            shrink: true
        });
    }

    emitCelebration(x, y) {
        const colors = [
            'rgba(255, 217, 61, 0.9)',
            'rgba(0, 229, 255, 0.9)',
            'rgba(255, 107, 53, 0.9)',
            'rgba(46, 204, 113, 0.9)',
            'rgba(255, 255, 255, 0.9)',
            'rgba(255, 107, 157, 0.9)'
        ];
        for (let i = 0; i < 40; i++) {
            this.emit(x, y, 1, {
                vx: Utils.random(-8, 8),
                vy: Utils.random(-10, -2),
                size: Utils.random(3, 9),
                color: colors[Math.floor(Math.random() * colors.length)],
                life: Utils.random(50, 90),
                gravity: 0.12,
                shrink: true
            });
        }
    }

    emitSplash(x, y, color = 'rgba(150, 220, 255, 0.7)') {
        for (let i = 0; i < 8; i++) {
            this.emit(x, y, 1, {
                vx: Utils.random(-2, 2),
                vy: Utils.random(-3, -1),
                size: Utils.random(1.5, 3),
                color: color,
                life: Utils.random(15, 25),
                gravity: 0.15,
                shrink: true,
                type: 'splash'
            });
        }
    }

    emitLightRay(x, y) {
        this.emit(x, y, 1, {
            life: Utils.random(60, 120),
            type: 'lightRay'
        });
    }

    update(dt, canvasWidth, canvasHeight) {
        for (const p of this.floatParticles) {
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.phase += dt * 2;
            p.x += Math.sin(p.phase) * 0.1 * dt * 60;

            if (p.y < -10) {
                p.y = canvasHeight + 10;
                p.x = Utils.random(0, canvasWidth);
            }
            if (p.x < -10) p.x = canvasWidth + 10;
            if (p.x > canvasWidth + 10) p.x = -10;
        }

        this.particles = this.particles.filter(p => p.active);
        for (const p of this.particles) {
            p.update(dt);
        }
    }

    render(ctx) {
        for (const p of this.floatParticles) {
            ctx.save();
            ctx.globalAlpha = p.alpha * (0.6 + Math.sin(p.phase) * 0.4);
            ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        for (const p of this.particles) {
            p.render(ctx);
        }
    }
}

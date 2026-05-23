class Particle {
    constructor(x, y, vx, vy, color, size, life, gravity = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.gravity = gravity;
        this.alpha = 1;
    }

    update(deltaTime) {
        const dt = deltaTime * 60;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }

    emit(x, y, config = {}) {
        const {
            count = 10,
            spread = Math.PI * 2,
            angle = 0,
            speed = 2,
            speedVariation = 1,
            color = '#ffffff',
            size = 3,
            sizeVariation = 2,
            life = 30,
            lifeVariation = 15,
            gravity = 0
        } = config;

        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;

            const particleAngle = angle + (Math.random() - 0.5) * spread;
            const particleSpeed = speed + (Math.random() - 0.5) * speedVariation;
            const particleLife = life + (Math.random() - 0.5) * lifeVariation;
            const particleSize = size + (Math.random() - 0.5) * sizeVariation;

            this.particles.push(new Particle(
                x,
                y,
                Math.cos(particleAngle) * particleSpeed,
                Math.sin(particleAngle) * particleSpeed,
                color,
                particleSize,
                particleLife,
                gravity
            ));
        }
    }

    emitCollision(x, y, direction = 0) {
        this.emit(x, y, {
            count: 20,
            spread: Math.PI,
            angle: direction + Math.PI,
            speed: 4,
            speedVariation: 3,
            color: '#ff6600',
            size: 4,
            sizeVariation: 3,
            life: 25,
            lifeVariation: 10
        });
        
        this.emit(x, y, {
            count: 15,
            spread: Math.PI,
            angle: direction + Math.PI,
            speed: 2,
            speedVariation: 2,
            color: '#ffff00',
            size: 2,
            sizeVariation: 2,
            life: 15,
            lifeVariation: 8
        });
        
        this.emit(x, y, {
            count: 10,
            spread: Math.PI * 2,
            angle: 0,
            speed: 1,
            speedVariation: 2,
            color: '#888888',
            size: 3,
            sizeVariation: 2,
            life: 40,
            lifeVariation: 20
        });
    }

    emitSparks(x, y, direction = 0) {
        this.emit(x, y, {
            count: 8,
            spread: Math.PI * 0.5,
            angle: direction,
            speed: 5,
            speedVariation: 3,
            color: '#ffff00',
            size: 2,
            sizeVariation: 1,
            life: 15,
            lifeVariation: 8
        });
    }

    emitNitro(x, y, angle) {
        const rearAngle = angle + Math.PI;
        
        this.emit(x + Math.cos(rearAngle) * 20, y + Math.sin(rearAngle) * 20, {
            count: 5,
            spread: 0.5,
            angle: rearAngle,
            speed: 3,
            speedVariation: 2,
            color: '#00ffff',
            size: 4,
            sizeVariation: 2,
            life: 20,
            lifeVariation: 10
        });
        
        this.emit(x + Math.cos(rearAngle) * 20, y + Math.sin(rearAngle) * 20, {
            count: 3,
            spread: 0.3,
            angle: rearAngle,
            speed: 5,
            speedVariation: 2,
            color: '#ffffff',
            size: 2,
            sizeVariation: 1,
            life: 10,
            lifeVariation: 5
        });
    }

    emitSmoke(x, y, angle) {
        const rearAngle = angle + Math.PI;
        
        this.emit(x + Math.cos(rearAngle) * 25, y + Math.sin(rearAngle) * 25, {
            count: 2,
            spread: 0.8,
            angle: rearAngle,
            speed: 1,
            speedVariation: 1,
            color: '#555555',
            size: 6,
            sizeVariation: 4,
            life: 40,
            lifeVariation: 20
        });
    }

    emitDriftSmoke(x, y) {
        this.emit(x, y, {
            count: 3,
            spread: Math.PI * 0.3,
            angle: Math.random() * Math.PI * 2,
            speed: 0.5,
            speedVariation: 0.5,
            color: '#333333',
            size: 5,
            sizeVariation: 3,
            life: 35,
            lifeVariation: 15
        });
    }

    update(deltaTime) {
        this.particles = this.particles.filter(p => p.update(deltaTime));
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

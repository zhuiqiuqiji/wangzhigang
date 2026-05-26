const Utils = {
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    circleCollision(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) < r1 + r2;
    },

    rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    drawGlow(ctx, x, y, radius, color) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

class Particle {
    constructor(x, y, color, speed, life, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.angle = Utils.random(0, Math.PI * 2);
        this.speed = Utils.random(speed * 0.5, speed);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.alpha = this.life / this.maxLife;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }

    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count = 10, speed = 3, life = 30, size = 3) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, speed, life, size));
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}

class StarField {
    constructor(canvas) {
        this.canvas = canvas;
        this.stars = [];
        this.initStars();
    }

    initStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Utils.random(0, this.canvas.width),
                y: Utils.random(0, this.canvas.height),
                size: Utils.random(0.5, 2),
                speed: Utils.random(0.5, 2),
                brightness: Utils.random(0.3, 1)
            });
        }
    }

    update() {
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Utils.random(0, this.canvas.width);
            }
        });
    }

    draw(ctx) {
        this.stars.forEach(star => {
            ctx.globalAlpha = star.brightness;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}

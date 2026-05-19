class Fruit {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = 0;
        this.vy = 0;
        this.radius = Fruit.TYPES[type].radius;
        this.rotation = Utils.random(0, Math.PI * 2);
        this.rotationSpeed = Utils.random(-0.1, 0.1);
        this.isSliced = false;
        this.sliceAngle = 0;
        this.slicedParts = [];
        this.active = true;
        this.gravity = 0.25;
        this.score = Fruit.TYPES[type].score;
        this.color = Fruit.TYPES[type].color;
        this.innerColor = Fruit.TYPES[type].innerColor;
        this.special = Fruit.TYPES[type].special;
        this.pulsePhase = Utils.random(0, Math.PI * 2);
    }

    launch(canvasWidth, canvasHeight) {
        this.x = Utils.random(this.radius, canvasWidth - this.radius);
        this.y = canvasHeight + this.radius;
        this.vx = Utils.random(-3, 3);
        this.vy = Utils.random(-14, -11);
        this.active = true;
        this.isSliced = false;
        this.slicedParts = [];
    }

    update(slowMotion = false) {
        if (!this.active) return;

        const timeScale = slowMotion ? 0.4 : 1;

        if (this.isSliced) {
            this.slicedParts.forEach(part => {
                part.vy += this.gravity * timeScale;
                part.x += part.vx * timeScale;
                part.y += part.vy * timeScale;
                part.rotation += part.rotationSpeed * timeScale;
                part.life -= 1;
            });
            this.slicedParts = this.slicedParts.filter(part => part.life > 0 && part.y < 1000);
            if (this.slicedParts.length === 0) {
                this.active = false;
            }
        } else {
            this.vy += this.gravity * timeScale;
            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;
            this.rotation += this.rotationSpeed * timeScale;
            this.pulsePhase += 0.1;
        }
    }

    slice(angle) {
        if (this.isSliced) return null;

        this.isSliced = true;
        this.sliceAngle = angle;

        const part1 = {
            x: this.x,
            y: this.y,
            vx: this.vx - 3 * Math.cos(angle + Math.PI / 2),
            vy: this.vy - 3 * Math.sin(angle + Math.PI / 2),
            rotation: this.rotation,
            rotationSpeed: this.rotationSpeed * 1.5,
            side: 1,
            life: 60
        };

        const part2 = {
            x: this.x,
            y: this.y,
            vx: this.vx + 3 * Math.cos(angle + Math.PI / 2),
            vy: this.vy + 3 * Math.sin(angle + Math.PI / 2),
            rotation: this.rotation,
            rotationSpeed: -this.rotationSpeed * 1.5,
            side: -1,
            life: 60
        };

        this.slicedParts = [part1, part2];
        return this.score;
    }

    isOffScreen(canvasHeight) {
        if (this.isSliced) return false;
        return this.y > canvasHeight + this.radius * 2 && this.vy > 0;
    }

    draw(ctx) {
        if (!this.active) return;

        if (this.isSliced) {
            this.slicedParts.forEach(part => {
                this.drawSlicedPart(ctx, part);
            });
        } else {
            this.drawWhole(ctx);
        }
    }

    drawWhole(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const pulse = this.special ? (Math.sin(this.pulsePhase) * 0.15 + 1) : 1;
        const drawRadius = this.radius * pulse;

        if (this.special) {
            ctx.save();
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, drawRadius + 5 + i * 8, 0, Math.PI * 2);
                const glowAlpha = 0.15 - i * 0.04;
                if (this.special === 'slow') {
                    ctx.strokeStyle = `rgba(135, 206, 235, ${glowAlpha})`;
                } else if (this.special === 'double') {
                    ctx.strokeStyle = `rgba(255, 215, 0, ${glowAlpha})`;
                } else if (this.special === 'life') {
                    ctx.strokeStyle = `rgba(255, 225, 53, ${glowAlpha})`;
                }
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(0, 0, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-drawRadius * 0.3, -drawRadius * 0.3, drawRadius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        if (this.type === 'watermelon') {
            ctx.beginPath();
            ctx.arc(0, 0, drawRadius * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = '#2d5a27';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        if (this.special) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${drawRadius * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (this.special === 'slow') {
                ctx.fillText('❄️', 0, 0);
            } else if (this.special === 'double') {
                ctx.fillText('2x', 0, 0);
            } else if (this.special === 'life') {
                ctx.fillText('❤️', 0, 0);
            }
        }

        ctx.restore();
    }

    drawSlicedPart(ctx, part) {
        ctx.save();
        ctx.translate(part.x, part.y);
        ctx.rotate(part.rotation);

        let startAngle, endAngle;
        if (part.side === 1) {
            startAngle = this.sliceAngle;
            endAngle = this.sliceAngle + Math.PI;
        } else {
            startAngle = this.sliceAngle + Math.PI;
            endAngle = this.sliceAngle + Math.PI * 2;
        }

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.radius * 0.8, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = this.innerColor;
        ctx.fill();

        ctx.restore();
    }
}

Fruit.TYPES = {
    watermelon: { radius: 45, score: 10, color: '#e74c3c', innerColor: '#ff6b6b', special: null },
    orange: { radius: 35, score: 15, color: '#f39c12', innerColor: '#ffb347', special: null },
    apple: { radius: 38, score: 20, color: '#c0392b', innerColor: '#ff7675', special: null },
    lemon: { radius: 32, score: 25, color: '#f1c40f', innerColor: '#ffeaa7', special: null },
    kiwi: { radius: 30, score: 30, color: '#6b8e23', innerColor: '#90EE90', special: null },
    ice: { radius: 35, score: 15, color: '#87CEEB', innerColor: '#E0FFFF', special: 'slow' },
    double: { radius: 38, score: 25, color: '#FFD700', innerColor: '#FFFF00', special: 'double' },
    banana: { radius: 40, score: 20, color: '#FFE135', innerColor: '#FFFACD', special: 'life' }
};

class FruitManager {
    constructor() {
        this.fruits = [];
        this.maxFruits = 8;
        this.spawnTimer = 0;
        this.spawnInterval = 60;
    }

    update(canvasWidth, canvasHeight, slowMotion = false) {
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval && this.fruits.length < this.maxFruits) {
            this.spawnTimer = 0;
            this.spawnFruit(canvasWidth, canvasHeight);
            this.spawnInterval = Utils.randomInt(40, 90);
        }

        this.fruits.forEach(fruit => fruit.update(slowMotion));
        this.fruits = this.fruits.filter(fruit => fruit.active);
    }

    spawnFruit(canvasWidth, canvasHeight) {
        const rand = Math.random();
        let type;
        if (rand < 0.08) {
            type = 'ice';
        } else if (rand < 0.15) {
            type = 'double';
        } else if (rand < 0.20) {
            type = 'banana';
        } else {
            const normalTypes = ['watermelon', 'orange', 'apple', 'lemon', 'kiwi'];
            type = normalTypes[Utils.randomInt(0, normalTypes.length - 1)];
        }
        const fruit = new Fruit(0, 0, type);
        fruit.launch(canvasWidth, canvasHeight);
        this.fruits.push(fruit);
    }

    checkSlices(trailPoints, particles) {
        if (trailPoints.length < 2) return { score: 0, count: 0, effects: [] };

        let totalScore = 0;
        let slicedCount = 0;
        let effects = [];
        const p1 = trailPoints[trailPoints.length - 2];
        const p2 = trailPoints[trailPoints.length - 1];

        this.fruits.forEach(fruit => {
            if (fruit.isSliced) return;

            if (Utils.lineCircleCollision(p1.x, p1.y, p2.x, p2.y, fruit.x, fruit.y, fruit.radius)) {
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const score = fruit.slice(angle);
                if (score) {
                    totalScore += score;
                    slicedCount++;
                    this.createSliceParticles(fruit, particles);
                    if (fruit.special) {
                        effects.push({ type: fruit.special, x: fruit.x, y: fruit.y });
                    }
                }
            }
        });

        return { score: totalScore, count: slicedCount, effects };
    }

    createSliceParticles(fruit, particles) {
        const particleCount = fruit.special ? 40 : 25;
        for (let i = 0; i < particleCount; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const speed = Utils.random(2, 10);
            particles.push({
                x: fruit.x,
                y: fruit.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                radius: Utils.random(2, 6),
                color: fruit.innerColor,
                life: Utils.random(30, 60),
                maxLife: 60,
                type: 'juice',
                gravity: 0.15
            });
        }

        for (let i = 0; i < 8; i++) {
            particles.push({
                x: fruit.x,
                y: fruit.y,
                vx: Utils.random(-4, 4),
                vy: Utils.random(-6, -2),
                radius: Utils.random(1, 3),
                color: '#ffffff',
                life: 20,
                maxLife: 20,
                type: 'sparkle',
                gravity: 0.05
            });
        }
    }

    checkMissed(canvasHeight) {
        let missed = 0;
        this.fruits.forEach(fruit => {
            if (!fruit.isSliced && fruit.isOffScreen(canvasHeight)) {
                fruit.active = false;
                missed++;
            }
        });
        return missed;
    }

    draw(ctx) {
        this.fruits.forEach(fruit => fruit.draw(ctx));
    }

    reset() {
        this.fruits = [];
        this.spawnTimer = 0;
    }
}

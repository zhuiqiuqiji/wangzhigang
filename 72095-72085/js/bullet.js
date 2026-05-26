class Bullet {
    constructor(x, y, vx, vy, isPlayerBullet = false, damage = 1, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.isPlayerBullet = isPlayerBullet;
        this.damage = damage;
        this.radius = options.radius || (isPlayerBullet ? 4 : 6);
        this.active = true;
        this.color = options.color || (isPlayerBullet ? '#00ffff' : '#ff4444');
        this.glowColor = options.glowColor || (isPlayerBullet ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 68, 68, 0.5)');
        this.trail = [];
        this.maxTrail = options.trailLength || 5;
        this.type = options.type || 'normal';
        this.homingStrength = options.homingStrength || 0;
        this.target = null;
        this.life = options.life || 600;
        this.maxLife = this.life;
        this.waveAmplitude = options.waveAmplitude || 0;
        this.waveFrequency = options.waveFrequency || 0;
        this.initialAngle = Math.atan2(vy, vx);
        this.initialSpeed = Math.sqrt(vx * vx + vy * vy);
        this.time = 0;
        this.grazed = false;
        this.size = options.size || 1;
    }

    update(canvas, player = null) {
        this.time++;
        this.life--;

        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) {
            this.trail.pop();
        }

        if (this.homingStrength > 0 && player) {
            let targetX, targetY;
            if (this.isPlayerBullet && this.targetEnemy) {
                targetX = this.targetEnemy.x;
                targetY = this.targetEnemy.y;
                if (!this.targetEnemy.active) {
                    this.targetEnemy = null;
                }
            } else if (!this.isPlayerBullet) {
                targetX = player.x;
                targetY = player.y;
            } else {
                return;
            }

            if (targetX !== undefined) {
                const targetAngle = Utils.angle(this.x, this.y, targetX, targetY);
                const currentAngle = Math.atan2(this.vy, this.vx);
                let angleDiff = targetAngle - currentAngle;
                
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                const turnSpeed = this.homingStrength * 0.05;
                const newAngle = currentAngle + Utils.clamp(angleDiff, -turnSpeed, turnSpeed);
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                this.vx = Math.cos(newAngle) * speed;
                this.vy = Math.sin(newAngle) * speed;
            }
        }

        if (this.waveAmplitude > 0) {
            const waveOffset = Math.sin(this.time * this.waveFrequency * 0.05) * this.waveAmplitude;
            const perpX = -Math.sin(this.initialAngle);
            const perpY = Math.cos(this.initialAngle);
            this.x += this.vx + perpX * waveOffset * 0.1;
            this.y += this.vy + perpY * waveOffset * 0.1;
        } else {
            this.x += this.vx;
            this.y += this.vy;
        }

        if (this.type === 'laser') {
            this.life = Math.min(this.life, 120);
        }

        if (this.life <= 0 ||
            this.x < -100 || this.x > canvas.width + 100 ||
            this.y < -100 || this.y > canvas.height + 100) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (this.type === 'laser') {
            this.drawLaser(ctx);
            return;
        }

        this.trail.forEach((pos, i) => {
            const alpha = 1 - (i / this.maxTrail);
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.radius * this.size * (1 - i * 0.1), 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        Utils.drawGlow(ctx, this.x, this.y, this.radius * this.size * 3, this.glowColor);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        if (this.homingStrength > 0) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            const angle = Math.atan2(this.vy, this.vx);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(angle) * this.radius * 3,
                this.y + Math.sin(angle) * this.radius * 3
            );
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    drawLaser(ctx) {
        const alpha = this.life / this.maxLife;
        const angle = Math.atan2(this.vy, this.vx);
        const length = 150;
        const width = this.radius * 2 * this.size;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.globalAlpha = alpha * 0.3;
        const gradient = ctx.createLinearGradient(0, 0, length, 0);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, -width * 2, length, width * 4);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(0, -width / 2, length, width);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, -width / 4, length, width / 2);

        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

class BulletPattern {
    static create(config) {
        const {
            type = 'circle',
            x, y,
            count = 12,
            speed = 4,
            angle = Math.PI / 2,
            spreadAngle = Math.PI * 2,
            color = '#ff4444',
            radius = 6,
            homingStrength = 0,
            waveAmplitude = 0,
            waveFrequency = 1,
            targetX = null,
            targetY = null,
            layers = 1,
            layerOffset = 0.3,
            rotation = 0,
            bulletType = 'normal',
            size = 1
        } = config;

        const glowColor = color.replace(')', ', 0.5)').replace('rgb', 'rgba');
        const bullets = [];

        for (let layer = 0; layer < layers; layer++) {
            const layerSpeed = speed * (1 + layer * layerOffset);
            const layerAngle = angle + rotation * layer;

            switch (type) {
                case 'circle':
                    bullets.push(...this.circle(x, y, count, layerSpeed, false, color, glowColor, radius, layerAngle, bulletType, size));
                    break;
                case 'spread':
                    bullets.push(...this.spread(x, y, layerAngle, count, spreadAngle, layerSpeed, false, color, glowColor, radius, bulletType, size));
                    break;
                case 'spiral':
                    bullets.push(...this.spiral(x, y, layerAngle, count, layerSpeed, false, color, glowColor, radius, bulletType, size));
                    break;
                case 'aimed':
                    if (targetX !== null && targetY !== null) {
                        bullets.push(this.aimed(x, y, targetX, targetY, layerSpeed, false, color, glowColor, radius, homingStrength, bulletType, size));
                    }
                    break;
                case 'homing':
                    bullets.push(this.homing(x, y, layerAngle, layerSpeed, homingStrength, color, glowColor, radius, bulletType, size));
                    break;
                case 'ring':
                    bullets.push(...this.ring(x, y, count, layerSpeed, 0, false, color, glowColor, radius, bulletType, size));
                    break;
                case 'wave':
                    bullets.push(...this.wave(x, y, layerAngle, count, spreadAngle, layerSpeed, waveAmplitude, waveFrequency, color, glowColor, radius, bulletType, size));
                    break;
                case 'random':
                    bullets.push(...this.random(x, y, count, layerSpeed, spreadAngle, color, glowColor, radius, bulletType, size));
                    break;
                case 'cross':
                    bullets.push(...this.cross(x, y, layerSpeed, color, glowColor, radius, bulletType, size));
                    break;
                case 'doubleCircle':
                    bullets.push(...this.doubleCircle(x, y, count, layerSpeed, color, glowColor, radius, bulletType, size));
                    break;
                case 'flower':
                    bullets.push(...this.flower(x, y, count, layerSpeed, layerAngle, color, glowColor, radius, bulletType, size));
                    break;
                case 'laser':
                    bullets.push(...this.laser(x, y, count, layerSpeed, layerAngle, spreadAngle, color, glowColor, radius, size));
                    break;
                case 'zigzag':
                    bullets.push(...this.zigzag(x, y, layerAngle, count, spreadAngle, layerSpeed, color, glowColor, radius, waveAmplitude, waveFrequency, bulletType, size));
                    break;
                case 'heart':
                    bullets.push(...this.heart(x, y, count, layerSpeed, layerAngle, color, glowColor, radius, bulletType, size));
                    break;
            }
        }

        return bullets;
    }

    static circle(x, y, count, speed, isPlayerBullet, color, glowColor, radius, rotation = 0, bulletType, size) {
        return this.spread(x, y, rotation, count, Math.PI * 2, speed, isPlayerBullet, color, glowColor, radius, bulletType, size);
    }

    static spread(x, y, baseAngle, count, spreadAngle, speed, isPlayerBullet, color, glowColor, radius, bulletType, size) {
        const bullets = [];
        if (count === 1) {
            bullets.push(this.straight(x, y, baseAngle, speed, isPlayerBullet, color, glowColor, radius, bulletType, size));
            return bullets;
        }

        const startAngle = baseAngle - (spreadAngle / 2);
        const angleStep = spreadAngle / (count - 1);

        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i;
            bullets.push(this.straight(x, y, angle, speed, isPlayerBullet, color, glowColor, radius, bulletType, size));
        }
        return bullets;
    }

    static spiral(x, y, startAngle, count, speed, isPlayerBullet, color, glowColor, radius, bulletType, size) {
        const bullets = [];
        for (let i = 0; i < count; i++) {
            const angle = startAngle + (i / count) * Math.PI * 2;
            const delayedSpeed = speed * (1 - i * 0.02);
            bullets.push(this.straight(x, y, angle, delayedSpeed, isPlayerBullet, color, glowColor, radius, bulletType, size));
        }
        return bullets;
    }

    static straight(x, y, angle, speed, isPlayerBullet, color, glowColor, radius, bulletType, size) {
        return new Bullet(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            isPlayerBullet, 1,
            { color, glowColor, radius, type: bulletType, size }
        );
    }

    static aimed(x, y, targetX, targetY, speed, isPlayerBullet, color, glowColor, radius, homingStrength, bulletType, size) {
        const angle = Utils.angle(x, y, targetX, targetY);
        return new Bullet(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            isPlayerBullet, 1,
            { color, glowColor, radius, homingStrength, type: bulletType, size }
        );
    }

    static homing(x, y, angle, speed, homingStrength, color, glowColor, radius, bulletType, size) {
        return new Bullet(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            false, 1,
            { color, glowColor, radius, homingStrength, type: bulletType, size }
        );
    }

    static ring(x, y, count, speed, rotation, isPlayerBullet, color, glowColor, radius, bulletType, size) {
        const bullets = this.circle(x, y, count, speed, isPlayerBullet, color, glowColor, radius, rotation, bulletType, size);
        bullets.forEach(b => { b.gap = true; });
        return bullets;
    }

    static wave(x, y, baseAngle, count, spreadAngle, speed, waveAmplitude, waveFrequency, color, glowColor, radius, bulletType, size) {
        const bullets = this.spread(x, y, baseAngle, count, spreadAngle, speed, false, color, glowColor, radius, bulletType, size);
        bullets.forEach(b => {
            b.waveAmplitude = waveAmplitude;
            b.waveFrequency = waveFrequency;
        });
        return bullets;
    }

    static random(x, y, count, speed, spreadAngle, color, glowColor, radius, bulletType, size) {
        const bullets = [];
        for (let i = 0; i < count; i++) {
            const angle = Utils.random(Math.PI / 2 - spreadAngle / 2, Math.PI / 2 + spreadAngle / 2);
            const randomSpeed = Utils.random(speed * 0.5, speed * 1.5);
            bullets.push(this.straight(x, y, angle, randomSpeed, false, color, glowColor, radius, bulletType, size));
        }
        return bullets;
    }

    static cross(x, y, speed, color, glowColor, radius, bulletType, size) {
        const bullets = [];
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2;
            bullets.push(this.straight(x, y, angle, speed, false, color, glowColor, radius, bulletType, size));
            bullets.push(this.straight(x, y, angle + Math.PI / 4, speed * 0.8, false, color, glowColor, radius * 0.8, bulletType, size * 0.8));
        }
        return bullets;
    }

    static doubleCircle(x, y, count, speed, color, glowColor, radius, bulletType, size) {
        const bullets = [];
        bullets.push(...this.circle(x, y, count, speed, false, color, glowColor, radius, 0, bulletType, size));
        bullets.push(...this.circle(x, y, count, speed * 0.7, false, '#ffffff', 'rgba(255,255,255,0.5)', radius * 0.6, Math.PI / count, bulletType, size * 0.7));
        return bullets;
    }

    static flower(x, y, count, speed, rotation, color, glowColor, radius, bulletType, size) {
        const bullets = [];
        const petalCount = Math.floor(count / 2);
        for (let i = 0; i < petalCount; i++) {
            const baseAngle = rotation + (i / petalCount) * Math.PI * 2;
            bullets.push(...this.spread(x, y, baseAngle, 3, Math.PI / 3, speed, false, color, glowColor, radius, bulletType, size));
            bullets.push(this.straight(x, y, baseAngle + Math.PI / petalCount, speed * 0.6, false, '#ffffff', 'rgba(255,255,255,0.5)', radius * 0.5, bulletType, size * 0.5));
        }
        return bullets;
    }

    static laser(x, y, count, speed, rotation, spreadAngle, color, glowColor, radius, size) {
        const bullets = [];
        for (let i = 0; i < count; i++) {
            const angle = rotation - spreadAngle / 2 + (spreadAngle / (count - 1 || 1)) * i;
            const bullet = this.straight(x, y, angle, speed, false, color, glowColor, radius, 'laser', size);
            bullet.life = 120;
            bullets.push(bullet);
        }
        return bullets;
    }

    static zigzag(x, y, baseAngle, count, spreadAngle, speed, color, glowColor, radius, waveAmplitude, waveFrequency, bulletType, size) {
        const bullets = this.spread(x, y, baseAngle, count, spreadAngle, speed, false, color, glowColor, radius, bulletType, size);
        bullets.forEach((b, i) => {
            b.waveAmplitude = waveAmplitude * (i % 2 === 0 ? 1 : -1);
            b.waveFrequency = waveFrequency;
        });
        return bullets;
    }

    static heart(x, y, count, speed, rotation, color, glowColor, radius, bulletType, size) {
        const bullets = [];
        for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 2;
            const heartX = 16 * Math.pow(Math.sin(t), 3);
            const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            const angle = Math.atan2(heartY, heartX) + rotation;
            const bulletSpeed = speed * (0.8 + Math.abs(Math.sin(t)) * 0.4);
            bullets.push(this.straight(x, y, angle, bulletSpeed, false, color, glowColor, radius, bulletType, size));
        }
        return bullets;
    }
}

class BulletManager {
    constructor() {
        this.playerBullets = [];
        this.enemyBullets = [];
        this.spiralAngle = 0;
    }

    reset() {
        this.playerBullets = [];
        this.enemyBullets = [];
        this.spiralAngle = 0;
    }

    addPlayerBullet(bullet) {
        this.playerBullets.push(bullet);
    }

    addPlayerBullets(bullets) {
        this.playerBullets.push(...bullets);
    }

    addEnemyBullet(bullet) {
        this.enemyBullets.push(bullet);
    }

    addEnemyBullets(bullets) {
        this.enemyBullets.push(...bullets);
    }

    clearEnemyBullets() {
        this.enemyBullets.forEach(b => {
            b.active = false;
        });
        this.enemyBullets = [];
    }

    update(canvas, player, enemyManager) {
        this.spiralAngle += 0.05;

        this.playerBullets.forEach(b => {
            if (b.isPlayerHoming && !b.targetEnemy && enemyManager) {
                let nearestEnemy = null;
                let nearestDist = Infinity;
                enemyManager.enemies.forEach(e => {
                    if (e.active) {
                        const dist = Utils.distance(b.x, b.y, e.x, e.y);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestEnemy = e;
                        }
                    }
                });
                if (nearestEnemy) {
                    b.targetEnemy = nearestEnemy;
                }
            }
            b.update(canvas, player);
        });
        this.enemyBullets.forEach(b => b.update(canvas, player));

        this.playerBullets = this.playerBullets.filter(b => b.active);
        this.enemyBullets = this.enemyBullets.filter(b => b.active);
    }

    draw(ctx) {
        this.playerBullets.forEach(b => b.draw(ctx));
        this.enemyBullets.forEach(b => b.draw(ctx));
    }

    checkPlayerBulletCollision(enemyManager, particles, itemManager) {
        let score = 0;
        this.playerBullets.forEach(bullet => {
            if (bullet.active) {
                score += enemyManager.checkCollision(bullet, particles, itemManager);
            }
        });
        return score;
    }

    checkEnemyBulletCollision(player, particles) {
        for (let bullet of this.enemyBullets) {
            if (bullet.active && Utils.circleCollision(
                bullet.x, bullet.y, bullet.radius * bullet.size,
                player.x, player.y, player.hitboxRadius
            )) {
                bullet.active = false;
                return player.takeDamage(particles);
            }
        }
        return false;
    }

    checkGraze(player, game) {
        let grazeCount = 0;
        this.enemyBullets.forEach(bullet => {
            if (bullet.active && !bullet.grazed) {
                const dist = Utils.distance(bullet.x, bullet.y, player.x, player.y);
                const grazeRadius = player.hitboxRadius + bullet.radius * bullet.size + 15;
                
                if (dist < grazeRadius && dist > player.hitboxRadius + bullet.radius * bullet.size) {
                    bullet.grazed = true;
                    grazeCount++;
                    game.onGraze(bullet.x, bullet.y);
                }
            }
        });
        return grazeCount;
    }
}

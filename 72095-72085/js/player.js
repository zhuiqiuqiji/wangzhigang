class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height - 100;
        this.width = 40;
        this.height = 50;
        this.hitboxRadius = 8;
        this.speed = 5;
        this.lives = 3;
        this.maxLives = 5;
        this.coins = 0;
        this.powerLevel = 1;
        this.maxPowerLevel = 5;
        this.shootCooldown = 150;
        this.lastShootTime = 0;
        this.invincible = false;
        this.invincibleTime = 2000;
        this.invincibleTimer = 0;
        this.isShooting = false;
        this.graze = 0;
        this.maxGraze = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.characterId = 'reimu';
        this.primaryColor = '#ff0066';
        this.damageMultiplier = 1;
        this.hasShield = false;
        this.shieldTimer = 0;
        this.shieldDuration = 0;
    }

    moveUp() {
        this.y = Math.max(this.height / 2 + 60, this.y - this.speed);
    }

    moveDown() {
        this.y = Math.min(this.canvas.height - this.height / 2, this.y + this.speed);
    }

    moveLeft() {
        this.x = Math.max(this.width / 2, this.x - this.speed);
    }

    moveRight() {
        this.x = Math.min(this.canvas.width - this.width / 2, this.x + this.speed);
    }

    shoot(currentTime) {
        if (this._characterShoot) {
            return this._characterShoot(currentTime);
        }
        return this.defaultShoot(currentTime);
    }

    defaultShoot(currentTime) {
        if (currentTime - this.lastShootTime < this.shootCooldown) {
            return [];
        }
        this.lastShootTime = currentTime;

        const bullets = [];
        const bulletSpeed = 10;
        const damage = this.damageMultiplier || 1;
        const color = this.primaryColor || '#00ffff';
        const glowColor = color.replace(')', ', 0.5)').replace('#', 'rgba(').replace(/^rgba\(([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2}), 0\.5\)$/, 'rgba($1, $2, $3, 0.5)');
        let r, g, b;
        if (color.startsWith('#')) {
            r = parseInt(color.slice(1, 3), 16);
            g = parseInt(color.slice(3, 5), 16);
            b = parseInt(color.slice(5, 7), 16);
        }
        const actualGlow = `rgba(${r}, ${g}, ${b}, 0.5)`;

        switch (this.powerLevel) {
            case 1:
                bullets.push(BulletPattern.straight(this.x, this.y - this.height / 2, -Math.PI / 2, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                break;
            case 2:
                bullets.push(BulletPattern.straight(this.x - 10, this.y - this.height / 2, -Math.PI / 2, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(this.x + 10, this.y - this.height / 2, -Math.PI / 2, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                break;
            case 3:
                bullets.push(BulletPattern.straight(this.x, this.y - this.height / 2, -Math.PI / 2, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(this.x - 15, this.y - this.height / 2, -Math.PI / 2 - 0.1, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(this.x + 15, this.y - this.height / 2, -Math.PI / 2 + 0.1, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                break;
            case 4:
                bullets.push(BulletPattern.straight(this.x - 10, this.y - this.height / 2, -Math.PI / 2, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(this.x + 10, this.y - this.height / 2, -Math.PI / 2, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(this.x - 20, this.y - this.height / 2, -Math.PI / 2 - 0.15, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(this.x + 20, this.y - this.height / 2, -Math.PI / 2 + 0.15, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                break;
            case 5:
                bullets.push(BulletPattern.straight(this.x, this.y - this.height / 2, -Math.PI / 2, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(this.x - 15, this.y - this.height / 2, -Math.PI / 2, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(this.x + 15, this.y - this.height / 2, -Math.PI / 2, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(this.x - 25, this.y - this.height / 2, -Math.PI / 2 - 0.2, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                bullets.push(BulletPattern.straight(this.x + 25, this.y - this.height / 2, -Math.PI / 2 + 0.2, bulletSpeed, true, color, actualGlow, 4, 'normal', 1));
                break;
        }

        bullets.forEach(b => { b.damage = damage; });
        return bullets;
    }

    activateShield(duration) {
        this.hasShield = true;
        this.shieldDuration = duration;
        this.shieldTimer = duration;
    }

    takeDamage(particles) {
        if (this.invincible) return false;

        if (this.hasShield) {
            this.hasShield = false;
            this.shieldTimer = 0;
            this.invincible = true;
            this.invincibleTimer = 1000;
            particles.emit(this.x, this.y, '#00aaff', 20, 5, 30, 4);
            return false;
        }

        this.lives--;
        this.invincible = true;
        this.invincibleTimer = this.invincibleTime;
        this.powerLevel = Math.max(1, this.powerLevel - 1);
        this.combo = 0;
        this.comboTimer = 0;

        particles.emit(this.x, this.y, '#ff4444', 30, 5, 40, 5);

        return true;
    }

    addGraze(count = 1) {
        this.graze += count;
        this.maxGraze += count;
        this.combo += count;
        this.comboTimer = 2000;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
    }

    update(deltaTime, particles) {
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        if (this.hasShield) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.hasShield = false;
            }
        }

        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        if (Math.random() < 0.5) {
            particles.emit(
                this.x + Utils.random(-5, 5),
                this.y + this.height / 2,
                this.primaryColor || '#00ffff',
                1,
                2,
                15,
                3
            );
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        if (this.hasShield) {
            const shieldTime = Date.now() * 0.003;
            for (let i = 0; i < 3; i++) {
                const radius = 25 + i * 8 + Math.sin(shieldTime + i) * 3;
                ctx.strokeStyle = `rgba(0, 170, 255, ${0.6 - i * 0.2})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            Utils.drawGlow(ctx, 0, 0, 40, 'rgba(0, 170, 255, 0.3)');
        }

        Utils.drawGlow(ctx, 0, 0, 30, 'rgba(0, 255, 255, 0.3)');

        ctx.fillStyle = this.primaryColor || '#00ffff';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 4, this.height / 3);
        ctx.lineTo(0, this.height / 2 - 5);
        ctx.lineTo(this.width / 4, this.height / 3);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = this.primaryColor ? this.primaryColor.replace(/^#/, '#22') : '#003333';
        ctx.beginPath();
        ctx.ellipse(0, -5, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.primaryColor || '#00ffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(-8, this.height / 2 - 5);
        ctx.lineTo(0, this.height / 2 + 10 + Math.random() * 10);
        ctx.lineTo(8, this.height / 2 - 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(-4, this.height / 2 - 5);
        ctx.lineTo(0, this.height / 2 + 5 + Math.random() * 5);
        ctx.lineTo(4, this.height / 2 - 5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.hitboxRadius, 0, Math.PI * 2);
        ctx.stroke();

        if (this.combo > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 10px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.combo} COMBO`, 0, -this.height / 2 - 15);
        }

        ctx.restore();
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.x = Math.min(this.x, width - this.width / 2);
        this.y = Math.min(this.y, height - this.height / 2);
    }
}
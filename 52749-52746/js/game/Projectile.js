class Projectile {
    constructor(x, y, target, damage, speed = 8, color = '#FFD700', effects = {}) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.size = effects.type === 'missile' ? 8 : (effects.type === 'splash' ? 7 : 5);
        this.isActive = true;
        this.trail = [];
        this.maxTrailLength = effects.type === 'laser' ? 0 : 6;
        
        this.splashRadius = effects.splashRadius || 0;
        this.slowAmount = effects.slowAmount || 0;
        this.slowDuration = effects.slowDuration || 0;
        this.poisonDamage = effects.poisonDamage || 0;
        this.poisonDuration = effects.poisonDuration || 0;
        this.type = effects.type || 'single';
        this.homing = effects.homing || false;
        
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.angle = Math.atan2(dy, dx);
        }
    }

    update(deltaTime, monsters = []) {
        if (!this.isActive) return;

        if (this.homing && this.target && !this.target.isDead) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.angle += angleDiff * 0.1;
        } else if (!this.target || this.target.isDead) {
            this.isActive = false;
            return;
        }

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        const moveX = Math.cos(this.angle) * this.speed * deltaTime * 60;
        const moveY = Math.sin(this.angle) * this.speed * deltaTime * 60;

        this.x += moveX;
        this.y += moveY;

        if (this.target && !this.target.isDead) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.target.size + this.size) {
                this.hitTarget(monsters);
                return;
            }
        }

        if (this.x < -50 || this.x > 850 || this.y < -50 || this.y > 650) {
            this.isActive = false;
        }
    }

    hitTarget(monsters) {
        if (this.splashRadius > 0) {
            this.applySplashDamage(monsters);
        } else if (this.target && !this.target.isDead) {
            this.applyDamage(this.target);
        }
        this.isActive = false;
    }

    applySplashDamage(monsters) {
        for (const monster of monsters) {
            if (monster.isDead || monster.reachedEnd) continue;
            const dx = monster.x - this.x;
            const dy = monster.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.splashRadius) {
                const damageMultiplier = 1 - (distance / this.splashRadius) * 0.5;
                const splashDamage = Math.floor(this.damage * damageMultiplier);
                this.applyDamage(monster, splashDamage);
            }
        }
    }

    applyDamage(monster, customDamage = null) {
        const damage = customDamage || this.damage;
        monster.takeDamage(damage);

        if (this.slowAmount > 0 && this.slowDuration > 0) {
            monster.applySlow(this.slowAmount, this.slowDuration);
        }

        if (this.poisonDamage > 0 && this.poisonDuration > 0) {
            monster.applyPoison(this.poisonDamage, this.poisonDuration);
        }
    }

    render(ctx) {
        if (!this.isActive) return;

        if (this.trail.length > 0) {
            for (let i = 0; i < this.trail.length; i++) {
                const alpha = (i + 1) / this.trail.length * 0.4;
                const size = this.size * (i + 1) / this.trail.length * 0.7;
                ctx.beginPath();
                ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
                ctx.fillStyle = this.hexToRgba(this.color, alpha);
                ctx.fill();
            }
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.type === 'missile') {
            ctx.beginPath();
            ctx.moveTo(this.size, 0);
            ctx.lineTo(-this.size, -this.size * 0.6);
            ctx.lineTo(-this.size * 0.5, 0);
            ctx.lineTo(-this.size, this.size * 0.6);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-this.size * 0.5, 0);
            ctx.lineTo(-this.size * 1.5, -this.size * 0.3);
            ctx.lineTo(-this.size * 1.5, this.size * 0.3);
            ctx.closePath();
            ctx.fillStyle = '#FF6B35';
            ctx.fill();
        } else if (this.type === 'slow') {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const px = Math.cos(angle) * this.size;
                const py = Math.sin(angle) * this.size;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (this.type === 'poison') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();

        if (this.splashRadius > 0 && this.type === 'splash') {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
            gradient.addColorStop(0, this.hexToRgba(this.color, 0.4));
            gradient.addColorStop(1, this.hexToRgba(this.color, 0));
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

    hexToRgba(hex, alpha) {
        if (hex.startsWith('rgb')) {
            return hex.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        }
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

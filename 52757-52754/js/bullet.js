class Bullet {
    constructor(x, y, angle, level, maxRadius, catchBonus, targetFish = null) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.level = level;
        this.maxRadius = maxRadius;
        this.catchBonus = catchBonus;
        this.targetFish = targetFish;
        
        this.speed = 12;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        this.radius = 8;
        this.expandSpeed = 0.8;
        this.fullyExpanded = false;
        
        this.active = true;
        this.collided = false;
        this.collisionAnimation = 0;
        
        this.trail = [];
        this.maxTrailLength = 8;
        
        this.spinAngle = 0;
        this.spinSpeed = 0.1;
        
        this.homing = targetFish !== null;
        this.homingStrength = 0.1;
        
        this.isCrit = false;
        this.hitFish = false;
    }
    
    update(deltaTime, canvasWidth, canvasHeight) {
        if (!this.active) return;
        
        const timeFactor = deltaTime / 16.67;
        
        if (this.collided) {
            this.collisionAnimation += deltaTime * 0.005;
            this.radius = this.maxRadius * (1 + this.collisionAnimation * 0.3);
            
            if (this.collisionAnimation >= 1) {
                this.active = false;
            }
            return;
        }
        
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        this.trail.forEach((point, index) => {
            point.alpha = (index + 1) / this.maxTrailLength * 0.5;
        });
        
        if (this.homing && this.targetFish && this.targetFish.alive && !this.targetFish.caught) {
            const targetAngle = Utils.angle(this.x, this.y, this.targetFish.x, this.targetFish.y);
            const currentAngle = Math.atan2(this.vy, this.vx);
            const angleDiff = targetAngle - currentAngle;
            const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
            const newAngle = currentAngle + normalizedDiff * this.homingStrength * timeFactor;
            
            this.vx = Math.cos(newAngle) * this.speed;
            this.vy = Math.sin(newAngle) * this.speed;
            this.angle = newAngle;
        } else {
            this.homing = false;
            this.targetFish = null;
        }
        
        this.x += this.vx * timeFactor;
        this.y += this.vy * timeFactor;
        
        if (!this.fullyExpanded) {
            this.radius += this.expandSpeed * timeFactor;
            if (this.radius >= this.maxRadius) {
                this.radius = this.maxRadius;
                this.fullyExpanded = true;
            }
        }
        
        this.spinAngle += this.spinSpeed * timeFactor;
        
        if (this.x < -100 || this.x > canvasWidth + 100 ||
            this.y < -100 || this.y > canvasHeight + 100) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        const color = Utils.getNetColor(this.level);
        
        this.trail.forEach((point, index) => {
            ctx.save();
            ctx.globalAlpha = point.alpha * 0.3;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.radius * 0.3 * (index / this.maxTrailLength), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        if (this.collided) {
            ctx.save();
            ctx.globalAlpha = 1 - this.collisionAnimation;
            Utils.drawNet(ctx, this.x, this.y, this.radius, this.level, 1 - this.collisionAnimation);
            
            ctx.globalAlpha = (1 - this.collisionAnimation) * 0.5;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else {
            Utils.drawNet(ctx, this.x, this.y, this.radius, this.level);
            
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.spinAngle);
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const innerR = this.radius * 0.6;
                const outerR = this.radius * 0.9;
                
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
                ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
                ctx.stroke();
            }
            
            ctx.restore();
            
            ctx.save();
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            if (this.homing && this.targetFish && this.targetFish.alive) {
                ctx.save();
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.targetFish.x, this.targetFish.y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        }
    }
    
    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2,
            centerX: this.x,
            centerY: this.y,
            radius: this.radius
        };
    }
    
    onCollision() {
        if (!this.collided) {
            this.collided = true;
            this.collisionAnimation = 0;
            this.vx = 0;
            this.vy = 0;
        }
    }
}

class Particle {
    constructor(x, y, color, type = 'normal') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        
        const angle = Utils.random(0, Math.PI * 2);
        const speed = Utils.random(2, 8);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.life = 1;
        this.decay = Utils.random(0.01, 0.03);
        
        if (type === 'coin') {
            this.vy = Utils.random(-8, -3);
            this.vx = Utils.random(-3, 3);
            this.gravity = 0.2;
            this.bounce = 0.6;
            this.coinValue = 0;
            this.targetY = y - 50;
            this.phase = 'up';
        } else if (type === 'spark') {
            this.decay = Utils.random(0.02, 0.05);
        }
        
        this.size = Utils.random(3, 8);
        this.rotation = Utils.random(0, Math.PI * 2);
        this.rotationSpeed = Utils.random(-0.2, 0.2);
    }
    
    update(deltaTime, canvasHeight = 0) {
        const timeFactor = deltaTime / 16.67;
        
        this.life -= this.decay * timeFactor;
        
        if (this.type === 'coin') {
            if (this.phase === 'up') {
                this.vy += this.gravity * 0.5 * timeFactor;
                if (this.y <= this.targetY) {
                    this.phase = 'float';
                    this.floatTimer = 0;
                }
            } else if (this.phase === 'float') {
                this.floatTimer += deltaTime * 0.005;
                this.vy = Math.sin(this.floatTimer) * 0.5;
                this.vx *= Math.pow(0.95, timeFactor);
                if (this.floatTimer >= 1) {
                    this.phase = 'fade';
                }
            } else {
                this.life -= this.decay * 2 * timeFactor;
                this.size *= Math.pow(0.98, timeFactor);
            }
            this.x += this.vx * timeFactor;
            this.y += this.vy * timeFactor;
        } else if (this.type === 'spark') {
            this.x += this.vx * timeFactor;
            this.y += this.vy * timeFactor;
            this.vx *= Math.pow(0.98, timeFactor);
            this.vy *= Math.pow(0.98, timeFactor);
            this.size *= Math.pow(0.97, timeFactor);
        } else {
            this.x += this.vx * timeFactor;
            this.y += this.vy * timeFactor;
            this.vx *= Math.pow(0.97, timeFactor);
            this.vy *= Math.pow(0.97, timeFactor);
        }
        
        this.rotation += this.rotationSpeed * timeFactor;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.type === 'coin') {
            Utils.drawCoin(ctx, 0, 0, this.size);
            
            if (this.coinValue > 0) {
                ctx.fillStyle = '#ffd700';
                ctx.font = `bold ${this.size * 1.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`+${this.coinValue}`, 0, -this.size * 2);
            }
        } else if (this.type === 'spark') {
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

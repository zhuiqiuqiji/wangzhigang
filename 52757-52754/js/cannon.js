const CannonLevels = [
    { level: 1, cost: 1, netRadius: 30, catchBonus: 0, color: '#87ceeb' },
    { level: 2, cost: 2, netRadius: 38, catchBonus: 0.05, color: '#98fb98' },
    { level: 3, cost: 3, netRadius: 46, catchBonus: 0.10, color: '#ffd700' },
    { level: 4, cost: 4, netRadius: 54, catchBonus: 0.15, color: '#ff7f50' },
    { level: 5, cost: 5, netRadius: 62, catchBonus: 0.20, color: '#ff69b4' },
    { level: 6, cost: 8, netRadius: 72, catchBonus: 0.25, color: '#9b59b6' },
    { level: 7, cost: 12, netRadius: 85, catchBonus: 0.30, color: '#e74c3c' }
];

class Cannon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.level = 1;
        this.angle = -Math.PI / 2;
        this.targetAngle = -Math.PI / 2;
        this.width = 80;
        this.height = 60;
        
        this.recoil = 0;
        this.recoilSpeed = 0.3;
        this.recoilMax = 15;
        
        this.shooting = false;
        this.shootAnimation = 0;
        
        this.glowIntensity = 0;
    }
    
    getLevelConfig() {
        return CannonLevels[this.level - 1] || CannonLevels[0];
    }
    
    setLevel(level) {
        this.level = Utils.clamp(level, 1, 7);
        this.glowIntensity = 1;
    }
    
    aimAt(mouseX, mouseY) {
        this.targetAngle = Utils.angle(this.x, this.y, mouseX, mouseY);
        
        const maxAngle = Math.PI * 0.1;
        const minAngle = -Math.PI * 1.1;
        
        if (this.targetAngle > maxAngle && this.targetAngle < Math.PI) {
            this.targetAngle = this.targetAngle > Math.PI / 2 ? minAngle : maxAngle;
        }
    }
    
    update(deltaTime) {
        const timeFactor = deltaTime / 16.67;
        
        const angleDiff = this.targetAngle - this.angle;
        const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        this.angle += normalizedDiff * 0.15 * timeFactor;
        
        if (this.recoil > 0) {
            this.recoil -= this.recoilSpeed * timeFactor;
            if (this.recoil < 0) this.recoil = 0;
        }
        
        if (this.shooting) {
            this.shootAnimation += deltaTime * 0.01;
            if (this.shootAnimation >= 1) {
                this.shooting = false;
                this.shootAnimation = 0;
            }
        }
        
        if (this.glowIntensity > 0) {
            this.glowIntensity -= deltaTime * 0.002;
            if (this.glowIntensity < 0) this.glowIntensity = 0;
        }
    }
    
    shoot() {
        this.recoil = this.recoilMax;
        this.shooting = true;
        this.shootAnimation = 0;
        
        const config = this.getLevelConfig();
        const bulletX = this.x + Math.cos(this.angle) * (this.width / 2 + 20);
        const bulletY = this.y + Math.sin(this.angle) * (this.width / 2 + 20);
        
        return new Bullet(
            bulletX,
            bulletY,
            this.angle,
            config.level,
            config.netRadius,
            config.catchBonus
        );
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const config = this.getLevelConfig();
        const recoilOffset = this.recoil * 0.5;
        
        if (this.glowIntensity > 0) {
            ctx.save();
            ctx.globalAlpha = this.glowIntensity * 0.5;
            ctx.shadowColor = config.color;
            ctx.shadowBlur = 30;
            ctx.fillStyle = config.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        const baseGradient = ctx.createRadialGradient(0, 10, 0, 0, 10, this.height * 0.8);
        baseGradient.addColorStop(0, '#5a6e7f');
        baseGradient.addColorStop(0.7, '#2d3e4f');
        baseGradient.addColorStop(1, '#1a2530');
        
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.ellipse(0, 10, this.width * 0.5, this.height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#7a8e9f';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.save();
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.translate(0, -recoilOffset);
        
        const barrelGradient = ctx.createLinearGradient(-this.width * 0.15, 0, this.width * 0.15, 0);
        barrelGradient.addColorStop(0, '#3d4f5f');
        barrelGradient.addColorStop(0.3, '#6a7e8f');
        barrelGradient.addColorStop(0.7, '#6a7e8f');
        barrelGradient.addColorStop(1, '#3d4f5f');
        
        ctx.fillStyle = barrelGradient;
        Utils.roundRect(ctx, -this.width * 0.15, -this.height * 0.3, this.width * 0.3, this.height * 0.7, 8);
        ctx.fill();
        
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.3, this.width * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-this.width * 0.04, -this.height * 0.33, this.width * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.shooting) {
            const flashAlpha = 1 - this.shootAnimation;
            ctx.save();
            ctx.globalAlpha = flashAlpha;
            ctx.fillStyle = config.color;
            ctx.shadowColor = config.color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, -this.height * 0.5, 15 + this.shootAnimation * 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        ctx.restore();
        
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.width * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.level, 0, 0);
        
        ctx.restore();
    }
    
    getCost() {
        return this.getLevelConfig().cost;
    }
}

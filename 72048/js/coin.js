class Coin {
    constructor(canvas, y) {
        this.canvas = canvas;
        this.x = Utils.random(100, canvas.width - 100);
        this.y = y;
        this.z = Utils.random(-100, 100);
        this.radius = 35;
        this.collected = false;
        this.rotation = 0;
        this.sparkles = [];
        this.collectAnimation = 0;
    }

    update(playerY) {
        this.rotation += 0.03;
        this.y -= 0.5;

        if (this.collected) {
            this.collectAnimation += 0.1;
        }

        if (Math.random() < 0.1) {
            this.sparkles.push({
                x: Utils.random(-this.radius, this.radius),
                y: Utils.random(-this.radius, this.radius),
                life: 1,
                size: Utils.random(2, 5)
            });
        }

        this.sparkles = this.sparkles.filter(s => {
            s.life -= 0.02;
            s.y -= 0.5;
            return s.life > 0;
        });
    }

    draw(ctx, playerY) {
        if (this.collected && this.collectAnimation > 1) return;

        const screenY = this.canvas.height * 0.4 + (this.y - playerY) * 0.5;
        
        if (screenY < -100 || screenY > this.canvas.height + 100) return;

        ctx.save();
        ctx.translate(this.x, screenY);

        const scale = Utils.map(this.z, -200, 200, 0.7, 1.3);
        ctx.scale(scale, scale);

        if (this.collected) {
            ctx.globalAlpha = 1 - this.collectAnimation;
            ctx.scale(1 + this.collectAnimation, 1 + this.collectAnimation);
        }

        const stretch = Math.cos(this.rotation) * 0.6 + 0.4;
        ctx.scale(stretch, 1);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#FFE066');
        gradient.addColorStop(0.5, '#FFD700');
        gradient.addColorStop(0.8, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.4, this.radius * 0.2, -0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#DAA520';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);

        ctx.restore();

        ctx.save();
        ctx.translate(this.x, screenY);
        ctx.scale(scale, scale);
        
        this.sparkles.forEach(s => {
            ctx.fillStyle = `rgba(255, 255, 255, ${s.life})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    checkCollision(player) {
        if (this.collected) return false;

        const screenY = this.canvas.height * 0.4 + (this.y - player.y) * 0.5;
        const playerScreenY = this.canvas.height * 0.4;

        const dx = this.x - player.x;
        const dy = screenY - playerScreenY;
        const dz = this.z - player.z;

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.5);
        return distance < this.radius + player.getCollisionRadius();
    }

    collect() {
        this.collected = true;
    }
}

class Obstacle {
    constructor(canvas, y, type) {
        this.canvas = canvas;
        this.x = Utils.random(80, canvas.width - 80);
        this.y = y;
        this.z = Utils.random(-100, 100);
        this.type = type;
        this.width = 50;
        this.height = 50;
        this.animationFrame = 0;
        this.vx = Utils.random(-2, 2);
        this.vy = 0;
        this.rotation = Utils.random(0, Math.PI * 2);
        this.rotationSpeed = Utils.random(-0.05, 0.05);
    }

    update(playerY) {
        this.animationFrame += 0.1;
        this.x += this.vx;
        this.rotation += this.rotationSpeed;

        if (this.x < 50 || this.x > this.canvas.width - 50) {
            this.vx *= -1;
        }

        if (this.type === 'bird') {
            this.vy = Math.sin(this.animationFrame) * 0.5;
        } else if (this.type === 'balloon') {
            this.vy = Math.sin(this.animationFrame * 0.5) * 0.3;
        } else if (this.type === 'drone') {
            this.vy = Math.sin(this.animationFrame * 2) * 1;
        }
    }

    draw(ctx, playerY) {
        const screenY = this.canvas.height * 0.4 + (this.y - playerY) * 0.5;
        
        if (screenY < -100 || screenY > this.canvas.height + 100) return;

        ctx.save();
        ctx.translate(this.x, screenY);

        const scale = Utils.map(this.z, -200, 200, 0.7, 1.3);
        ctx.scale(scale, scale);
        ctx.rotate(this.rotation);

        switch (this.type) {
            case 'bird':
                this.drawBird(ctx);
                break;
            case 'balloon':
                this.drawBalloon(ctx);
                break;
            case 'drone':
                this.drawDrone(ctx);
                break;
        }

        ctx.restore();
    }

    drawBird(ctx) {
        const wingFlap = Math.sin(this.animationFrame * 3) * 0.5;

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(30, -3);
        ctx.lineTo(30, 3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(12, -4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(13, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#444';
        ctx.save();
        ctx.rotate(wingFlap);
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.quadraticCurveTo(-30, -40, -40, -10);
        ctx.quadraticCurveTo(-20, -5, 0, -5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#444';
        ctx.save();
        ctx.rotate(-wingFlap);
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.quadraticCurveTo(-30, 40, -40, 10);
        ctx.quadraticCurveTo(-20, 5, 0, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawBalloon(ctx) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        const color = colors[Math.floor(this.rotation * 10) % colors.length];

        const gradient = ctx.createRadialGradient(-5, -15, 5, 0, 0, 35);
        gradient.addColorStop(0, '#FFF');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, color);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, -10, 25, 35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-8, 20);
        ctx.lineTo(8, 20);
        ctx.lineTo(0, 30);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 30);
        ctx.quadraticCurveTo(10, 50, 0, 70);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-10, -25, 8, 12, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawDrone(ctx) {
        const propellerSpeed = Math.sin(this.animationFrame * 10) * 0.3;

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.roundRect(-20, -10, 40, 20, 5);
        ctx.fill();

        ctx.fillStyle = '#555';
        ctx.fillRect(-35, -5, 15, 10);
        ctx.fillRect(20, -5, 15, 10);
        ctx.fillRect(-5, -35, 10, 15);
        ctx.fillRect(-5, 20, 10, 15);

        ctx.fillStyle = '#4ECDC4';
        ctx.save();
        ctx.translate(-27, -5);
        ctx.rotate(propellerSpeed);
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#4ECDC4';
        ctx.save();
        ctx.translate(27, -5);
        ctx.rotate(-propellerSpeed);
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#4ECDC4';
        ctx.save();
        ctx.translate(0, -27);
        ctx.rotate(propellerSpeed);
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#4ECDC4';
        ctx.save();
        ctx.translate(0, 27);
        ctx.rotate(-propellerSpeed);
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    checkCollision(player) {
        const screenY = this.canvas.height * 0.4 + (this.y - player.y) * 0.5;
        const playerScreenY = this.canvas.height * 0.4;

        const dx = this.x - player.x;
        const dy = screenY - playerScreenY;
        const dz = this.z - player.z;

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.5);
        return distance < 30 + player.getCollisionRadius();
    }
}

class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = this.canvas.width / 2;
        this.y = 0;
        this.z = 0;
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.tiltX = 0;
        this.tiltY = 0;
        this.parachuteOpen = false;
        this.parachuteProgress = 0;
        this.width = 40;
        this.height = 60;
        this.maxSpeed = 8;
        this.fallSpeed = 3;
        this.parachuteFallSpeed = 1;
        this.targetX = this.canvas.width / 2;
    }

    update(keys, deltaTime) {
        const timeScale = deltaTime * 60;
        const acceleration = 0.5 * timeScale;
        const friction = Math.pow(0.92, timeScale);
        const lerpFactor = 0.1 * timeScale;

        if (keys.left) {
            this.vx -= acceleration;
            this.tiltY = Utils.lerp(this.tiltY, -0.3, lerpFactor);
        } else if (keys.right) {
            this.vx += acceleration;
            this.tiltY = Utils.lerp(this.tiltY, 0.3, lerpFactor);
        } else {
            this.tiltY = Utils.lerp(this.tiltY, 0, lerpFactor * 0.5);
        }

        if (keys.up) {
            this.vy -= acceleration * 0.5;
            this.tiltX = Utils.lerp(this.tiltX, -0.2, lerpFactor);
        } else if (keys.down) {
            this.vy += acceleration * 0.5;
            this.tiltX = Utils.lerp(this.tiltX, 0.2, lerpFactor);
        } else {
            this.tiltX = Utils.lerp(this.tiltX, 0, lerpFactor * 0.5);
        }

        this.vx *= friction;
        this.vy *= friction;

        this.vx = Utils.clamp(this.vx, -this.maxSpeed, this.maxSpeed);
        this.vy = Utils.clamp(this.vy, -this.maxSpeed * 0.5, this.maxSpeed * 0.5);

        this.x += this.vx * timeScale;
        this.z += this.vy * timeScale;

        this.x = Utils.clamp(this.x, 50, this.canvas.width - 50);
        this.z = Utils.clamp(this.z, -200, 200);

        const currentFallSpeed = this.parachuteOpen ? this.parachuteFallSpeed : this.fallSpeed;
        this.y += currentFallSpeed * timeScale;

        if (this.parachuteOpen) {
            this.parachuteProgress = Utils.lerp(this.parachuteProgress, 1, lerpFactor * 0.5);
        }

        this.rotation += this.vx * 0.02 * timeScale;
    }

    openParachute() {
        if (!this.parachuteOpen) {
            this.parachuteOpen = true;
            this.vx *= 0.3;
            this.vy *= 0.3;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.canvas.height * 0.4);

        const scale = Utils.map(this.z, -200, 200, 0.7, 1.3);
        ctx.scale(scale, scale);
        ctx.rotate(this.tiltY);

        if (this.parachuteOpen) {
            this.drawParachute(ctx);
        }

        this.drawBody(ctx);

        ctx.restore();
    }

    drawBody(ctx) {
        ctx.save();
        ctx.rotate(this.tiltX);

        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(0, -30, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(0, -35, 14, 8, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4A90D9';
        ctx.beginPath();
        ctx.moveTo(-10, -20);
        ctx.lineTo(-25, 10);
        ctx.lineTo(-8, 5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(10, -20);
        ctx.lineTo(25, 10);
        ctx.lineTo(8, 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.fillRect(-12, 20, 8, 20);
        ctx.fillRect(4, 20, 8, 20);

        ctx.restore();
    }

    drawParachute(ctx) {
        const progress = this.parachuteProgress;
        const canopyWidth = 80 * progress;
        const canopyHeight = 40 * progress;

        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-canopyWidth * 0.3, -35);
        ctx.lineTo(0, -5);
        ctx.moveTo(canopyWidth * 0.3, -35);
        ctx.lineTo(0, -5);
        ctx.moveTo(-canopyWidth * 0.6, -45);
        ctx.lineTo(0, -5);
        ctx.moveTo(canopyWidth * 0.6, -45);
        ctx.lineTo(0, -5);
        ctx.moveTo(-canopyWidth * 0.8, -50);
        ctx.lineTo(0, -5);
        ctx.moveTo(canopyWidth * 0.8, -50);
        ctx.lineTo(0, -5);
        ctx.stroke();

        const gradient = ctx.createRadialGradient(0, -55, 0, 0, -55, canopyWidth);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(0.5, '#FF8E53');
        gradient.addColorStop(1, '#FF6B6B');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, -55, canopyWidth, canopyHeight, 0, Math.PI, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * (canopyWidth / 4), -55 - canopyHeight * 0.3);
            ctx.lineTo(i * (canopyWidth / 4) * 0.8, -55);
            ctx.stroke();
        }
    }

    getCollisionRadius() {
        return 25;
    }
}

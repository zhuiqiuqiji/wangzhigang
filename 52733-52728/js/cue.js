class Cue {
    constructor() {
        this.angle = 0;
        this.power = 0;
        this.maxPower = 15;
        this.visible = true;
        this.length = 150;
        this.width = 8;
    }

    update(cueBallPosition, mousePosition, isDragging, dragStartPosition) {
        if (!cueBallPosition) return;

        if (isDragging && dragStartPosition) {
            const dragVector = mousePosition.subtract(dragStartPosition);
            this.power = Math.min(dragVector.length() * 0.1, this.maxPower);

            const aimVector = cueBallPosition.subtract(mousePosition);
            this.angle = Math.atan2(aimVector.y, aimVector.x);
        } else {
            const aimVector = cueBallPosition.subtract(mousePosition);
            this.angle = Math.atan2(aimVector.y, aimVector.x);
            this.power = 0;
        }
    }

    draw(ctx, cueBallPosition) {
        if (!this.visible || !cueBallPosition) return;

        ctx.save();
        ctx.translate(cueBallPosition.x, cueBallPosition.y);
        ctx.rotate(this.angle);

        const offset = 20 + this.power * 3;
        const startX = Ball.RADIUS + offset;

        this.drawAimLine(ctx, cueBallPosition);

        const cueGradient = ctx.createLinearGradient(startX, 0, startX + this.length, 0);
        cueGradient.addColorStop(0, '#4A3728');
        cueGradient.addColorStop(0.1, '#6B4423');
        cueGradient.addColorStop(0.5, '#8B5A2B');
        cueGradient.addColorStop(0.9, '#6B4423');
        cueGradient.addColorStop(1, '#4A3728');

        ctx.fillStyle = cueGradient;
        ctx.beginPath();
        ctx.roundRect(startX, -this.width / 2, this.length, this.width, 2);
        ctx.fill();

        ctx.strokeStyle = '#2D1810';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#F5DEB3';
        ctx.beginPath();
        ctx.roundRect(startX - 8, -this.width / 3, 12, this.width * 0.67, 1);
        ctx.fill();

        const handleGradient = ctx.createLinearGradient(
            startX + this.length - 30, -this.width / 2,
            startX + this.length - 30, this.width / 2
        );
        handleGradient.addColorStop(0, '#2D1810');
        handleGradient.addColorStop(0.5, '#4A3728');
        handleGradient.addColorStop(1, '#2D1810');

        ctx.fillStyle = handleGradient;
        ctx.fillRect(startX + this.length - 30, -this.width / 2 - 2, 30, this.width + 4);

        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(startX + this.length, 0, this.width / 2 + 2, 0, Math.PI * 2);
        ctx.fill();

        if (this.power > 0) {
            this.drawPowerIndicator(ctx, startX + this.length + 10);
        }

        ctx.restore();
    }

    drawAimLine(ctx, cueBallPosition) {
        ctx.restore();
        ctx.save();

        const endX = cueBallPosition.x + Math.cos(this.angle) * 300;
        const endY = cueBallPosition.y + Math.sin(this.angle) * 300;

        ctx.setLineDash([5, 10]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cueBallPosition.x, cueBallPosition.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.translate(cueBallPosition.x, cueBallPosition.y);
        ctx.rotate(this.angle);
    }

    drawPowerIndicator(ctx, x) {
        const maxBarHeight = 60;
        const barWidth = 6;
        const barHeight = (this.power / this.maxPower) * maxBarHeight;

        const powerGradient = ctx.createLinearGradient(x, maxBarHeight / 2, x, -maxBarHeight / 2);
        powerGradient.addColorStop(0, '#00FF00');
        powerGradient.addColorStop(0.5, '#FFFF00');
        powerGradient.addColorStop(1, '#FF0000');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, -maxBarHeight / 2, barWidth, maxBarHeight);

        ctx.fillStyle = powerGradient;
        ctx.fillRect(x, maxBarHeight / 2 - barHeight, barWidth, barHeight);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, -maxBarHeight / 2, barWidth, maxBarHeight);
    }

    shoot(cueBall) {
        if (!cueBall || cueBall.potted) return;

        const velocity = new Vector2D(
            Math.cos(this.angle) * this.power,
            Math.sin(this.angle) * this.power
        );
        cueBall.velocity = velocity;
    }
}

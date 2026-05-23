class Table {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.borderWidth = 40;
        this.pocketRadius = 22;

        this.left = this.borderWidth;
        this.right = this.width - this.borderWidth;
        this.top = this.borderWidth;
        this.bottom = this.height - this.borderWidth;

        this.pockets = this.calculatePockets();
        this.feltNoise = this.generateFeltNoise();
    }

    generateFeltNoise() {
        const noise = [];
        for (let i = 0; i < 50; i++) {
            noise.push({
                x: this.borderWidth + Math.random() * (this.width - this.borderWidth * 2),
                y: this.borderWidth + Math.random() * (this.height - this.borderWidth * 2),
                color: Math.random() > 0.5 ? '#FFFFFF' : '#000000'
            });
        }
        return noise;
    }

    calculatePockets() {
        const pr = this.pocketRadius * 0.6;
        return [
            new Vector2D(this.borderWidth, this.borderWidth),
            new Vector2D(this.width / 2, this.borderWidth - 8),
            new Vector2D(this.width - this.borderWidth, this.borderWidth),
            new Vector2D(this.borderWidth, this.height - this.borderWidth),
            new Vector2D(this.width / 2, this.height - this.borderWidth + 8),
            new Vector2D(this.width - this.borderWidth, this.height - this.borderWidth)
        ];
    }

    draw(ctx) {
        this.drawOuterFrame(ctx);
        this.drawInnerFrame(ctx);
        this.drawFelt(ctx);
        this.drawCushions(ctx);
        this.drawPockets(ctx);
        this.drawDecorations(ctx);
    }

    drawOuterFrame(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, '#4A2C0A');
        gradient.addColorStop(0.3, '#6B3D0F');
        gradient.addColorStop(0.5, '#8B5A2B');
        gradient.addColorStop(0.7, '#6B3D0F');
        gradient.addColorStop(1, '#4A2C0A');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, 0, this.width, this.height, 10);
        ctx.fill();

        ctx.strokeStyle = '#2D1810';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    drawInnerFrame(ctx) {
        const gradient = ctx.createLinearGradient(
            this.borderWidth, this.borderWidth,
            this.width - this.borderWidth, this.height - this.borderWidth
        );
        gradient.addColorStop(0, '#5C3A1A');
        gradient.addColorStop(0.5, '#7B4F2A');
        gradient.addColorStop(1, '#5C3A1A');

        ctx.fillStyle = gradient;
        ctx.fillRect(
            this.borderWidth - 10,
            this.borderWidth - 10,
            this.width - this.borderWidth * 2 + 20,
            this.height - this.borderWidth * 2 + 20
        );
    }

    drawFelt(ctx) {
        const feltGradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width / 2
        );
        feltGradient.addColorStop(0, '#1B7A3A');
        feltGradient.addColorStop(0.7, '#146B30');
        feltGradient.addColorStop(1, '#0D5C26');

        ctx.fillStyle = feltGradient;
        ctx.fillRect(
            this.borderWidth,
            this.borderWidth,
            this.width - this.borderWidth * 2,
            this.height - this.borderWidth * 2
        );

        ctx.globalAlpha = 0.05;
        for (const noise of this.feltNoise) {
            ctx.fillStyle = noise.color;
            ctx.fillRect(noise.x, noise.y, 2, 2);
        }
        ctx.globalAlpha = 1;
    }

    drawCushions(ctx) {
        const cushionWidth = 8;
        ctx.fillStyle = '#0D5C26';

        ctx.beginPath();
        ctx.moveTo(this.left, this.top);
        ctx.lineTo(this.left + cushionWidth, this.top + cushionWidth);
        ctx.lineTo(this.left + cushionWidth, this.bottom - cushionWidth);
        ctx.lineTo(this.left, this.bottom);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.right, this.top);
        ctx.lineTo(this.right - cushionWidth, this.top + cushionWidth);
        ctx.lineTo(this.right - cushionWidth, this.bottom - cushionWidth);
        ctx.lineTo(this.right, this.bottom);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.left, this.top);
        ctx.lineTo(this.left + cushionWidth, this.top + cushionWidth);
        ctx.lineTo(this.right - cushionWidth, this.top + cushionWidth);
        ctx.lineTo(this.right, this.top);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.left, this.bottom);
        ctx.lineTo(this.left + cushionWidth, this.bottom - cushionWidth);
        ctx.lineTo(this.right - cushionWidth, this.bottom - cushionWidth);
        ctx.lineTo(this.right, this.bottom);
        ctx.closePath();
        ctx.fill();
    }

    drawPockets(ctx) {
        for (const pocket of this.pockets) {
            const gradient = ctx.createRadialGradient(
                pocket.x, pocket.y, 0,
                pocket.x, pocket.y, this.pocketRadius
            );
            gradient.addColorStop(0, '#000000');
            gradient.addColorStop(0.7, '#111111');
            gradient.addColorStop(1, '#222222');

            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, this.pocketRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, this.pocketRadius - 3, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pocket.x - 3, pocket.y - 3, this.pocketRadius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fill();
        }
    }

    drawDecorations(ctx) {
        ctx.strokeStyle = '#C9A86C';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(8, 8, this.width - 16, this.height - 16, 8);
        ctx.stroke();

        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(4, 4, this.width - 8, this.height - 8, 10);
        ctx.stroke();

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.6;

        for (let i = 1; i <= 4; i++) {
            const x = this.width / 5 * i;
            ctx.fillText('◆', x, 15);
            ctx.fillText('◆', x, this.height - 5);
        }

        ctx.globalAlpha = 1;
    }

    isInPocket(ball) {
        for (const pocket of this.pockets) {
            const distance = ball.position.distance(pocket);
            if (distance < this.pocketRadius + ball.radius * 0.3) {
                return true;
            }
        }
        return false;
    }
}
